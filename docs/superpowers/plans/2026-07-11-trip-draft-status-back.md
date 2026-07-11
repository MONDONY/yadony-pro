# Statut DRAFT d'un trajet — Plan d'implémentation BACKEND (dony-back)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un voyageur crée un trajet en brouillon (invisible du public), le publie plus tard via `POST /announcements/{id}/publish` ; quota 1 brouillon standard / 10 PRO.

**Architecture:** Statut `DRAFT` ajouté à l'enum `AnnouncementStatus` (colonne VARCHAR — zéro migration). `POST /announcements` accepte `saveAsDraft` ; les contrôles KYC/limite mensuelle/date se déplacent dans le nouveau `publishAnnouncement`. Le count mensuel exclut les DRAFT.

**Tech Stack:** Spring Boot 3.4 (Java 21), JPA/Hibernate, JUnit 5 + Mockito, MockMvc.

**Répertoire de travail :** `/Users/aboubakardiakite/Desktop/dony/dony-back` — branche `feature/trip-draft-status`.

## Global Constraints (spec)

- Quota brouillons : 1 (standard) / 10 (PRO) — configurable `dony.limits.*`.
- Création de brouillon : seuls contrôles = suspension de publication + quota brouillons. Pas de KYC, pas de limite mensuelle.
- Publication : suspension → `403 publishing-suspended` ; KYC → `403 kyc-not-verified` ; limite mensuelle non-PRO → `403 pro-limit-reached` ; date départ passée → `422 departure-date-passed` ; pas DRAFT → `422 not-a-draft`.
- Erreurs RFC 7807 via `DonyBusinessException(HttpStatus, code, title, detail)`.
- Audit log : `ANNOUNCEMENT_PUBLISHED` à la publication.
- Rétro-compat : `saveAsDraft` absent → `false`.
- Jamais modifier une migration existante ; ici aucune migration nécessaire.
- Tests verts + couverture ≥ 90 % avant PR.

---

### Task 1: Enum DRAFT + flag `saveAsDraft` + création en brouillon

**Files:**
- Modify: `src/main/java/com/dony/api/matching/AnnouncementStatus.java`
- Modify: `src/main/java/com/dony/api/matching/dto/AnnouncementRequest.java`
- Modify: `src/main/java/com/dony/api/matching/AnnouncementService.java` (méthode `createAnnouncement`, ~l.284-410)
- Modify: `src/main/java/com/dony/api/matching/AnnouncementRepository.java`
- Modify: `src/main/java/com/dony/api/config/DonyConfigProperties.java`
- Test: `src/test/java/com/dony/api/matching/AnnouncementServiceTest.java`

**Interfaces:**
- Produces: `AnnouncementStatus.DRAFT` ; `AnnouncementRequest.saveAsDraft()` (Boolean, nullable) ; `AnnouncementRepository.countByTravelerIdAndStatus(UUID, AnnouncementStatus): long` ; `DonyConfigProperties.Limits.maxDrafts()` (défaut 1) et `maxDraftsPro()` (défaut 10).

- [ ] **Step 1: Écrire les tests qui échouent** (dans `AnnouncementServiceTest`, suivre le setup Mockito existant du fichier)

```java
@Test
void createAnnouncement_saveAsDraft_setsDraftStatusAndSkipsKycAndMonthlyLimit() {
    UserEntity user = proUser(); // helper existant ou construire un user KYC NON vérifié
    user.setKycStatus(KycStatus.PENDING); // KYC non vérifié : ne doit PAS bloquer un draft
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));
    when(announcementRepository.countByTravelerIdAndStatus(user.getId(), AnnouncementStatus.DRAFT))
            .thenReturn(0L);
    when(announcementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    AnnouncementResponse resp = service.createAnnouncement("uid", draftRequest());

    assertThat(resp.status()).isEqualTo(AnnouncementStatus.DRAFT);
    verify(announcementRepository, never())
            .countByTravelerIdAndCreatedAtBetweenAndStatusNot(any(), any(), any(), any());
}

@Test
void createAnnouncement_saveAsDraft_nonProAtLimit_throws403DraftLimitReached() {
    UserEntity user = standardUser(); // isProAccount=false
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));
    when(announcementRepository.countByTravelerIdAndStatus(user.getId(), AnnouncementStatus.DRAFT))
            .thenReturn(1L); // déjà 1 brouillon

    assertThatThrownBy(() -> service.createAnnouncement("uid", draftRequest()))
            .isInstanceOf(DonyBusinessException.class)
            .hasFieldOrPropertyWithValue("code", "draft-limit-reached");
}

@Test
void createAnnouncement_saveAsDraft_proUnderProLimit_succeeds() {
    UserEntity user = proUser(); // isProAccount=true
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));
    when(announcementRepository.countByTravelerIdAndStatus(user.getId(), AnnouncementStatus.DRAFT))
            .thenReturn(9L); // 9 < 10
    when(announcementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    AnnouncementResponse resp = service.createAnnouncement("uid", draftRequest());
    assertThat(resp.status()).isEqualTo(AnnouncementStatus.DRAFT);
}

@Test
void createAnnouncement_saveAsDraft_publishingSuspended_throws403() {
    UserEntity user = standardUser();
    user.setPublishingSuspended(true);
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));

    assertThatThrownBy(() -> service.createAnnouncement("uid", draftRequest()))
            .isInstanceOf(DonyBusinessException.class)
            .hasFieldOrPropertyWithValue("code", "publishing-suspended");
}
```

Helper `draftRequest()` : copier le builder de request valide déjà utilisé dans le fichier de test, avec `saveAsDraft=true` (nouveau paramètre du record — passer `null` dans tous les appels existants au constructeur pour compiler).

- [ ] **Step 2: Lancer — vérifier l'échec (compilation : champ/méthodes absents)**

Run: `./mvnw test -Dtest=AnnouncementServiceTest -pl . 2>&1 | tail -20`
Expected: erreurs de compilation (`saveAsDraft`, `countByTravelerIdAndStatus`, `DRAFT` inexistants).

- [ ] **Step 3: Implémentation minimale**

`AnnouncementStatus.java` :
```java
public enum AnnouncementStatus {
    DRAFT,
    ACTIVE,
    FULL,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
```

`AnnouncementRequest.java` — ajouter en dernier composant du record :
```java
        Boolean saveAsDraft
```
(et méthode utilitaire dans le record : `public boolean isDraft() { return Boolean.TRUE.equals(saveAsDraft); }`)

`AnnouncementRepository.java` :
```java
    long countByTravelerIdAndStatus(UUID travelerId, AnnouncementStatus status);
```

`DonyConfigProperties.java` — étendre `Limits` :
```java
    public record Limits(NonPro nonPro, Drafts drafts) {
        public record NonPro(int monthlyAnnouncements) {}
        public record Drafts(Integer max, Integer maxPro) {}

        public int monthlyAnnouncements() {
            return nonPro != null ? nonPro.monthlyAnnouncements() : 2;
        }
        public int maxDrafts() {
            return drafts != null && drafts.max() != null ? drafts.max() : 1;
        }
        public int maxDraftsPro() {
            return drafts != null && drafts.maxPro() != null ? drafts.maxPro() : 10;
        }
    }
```

`AnnouncementService.createAnnouncement` — juste après le contrôle `isPublishingSuspended()` existant, encadrer les contrôles KYC + limite mensuelle :
```java
        boolean isDraft = request.isDraft();

        if (isDraft) {
            int maxDrafts = user.isProAccount()
                    ? config.limits().maxDraftsPro()
                    : config.limits().maxDrafts();
            long draftCount = announcementRepository
                    .countByTravelerIdAndStatus(user.getId(), AnnouncementStatus.DRAFT);
            if (draftCount >= maxDrafts) {
                throw new DonyBusinessException(HttpStatus.FORBIDDEN, "draft-limit-reached",
                        "Draft Limit Reached",
                        "Limite de " + maxDrafts + " brouillon(s) atteinte."
                                + (user.isProAccount() ? "" : " Passez en PRO pour en créer davantage."));
            }
        }

        if (!isDraft) {
            // ← déplacer ICI le bloc limite mensuelle existant (count >= monthlyAnnouncements)
            // ← déplacer ICI le bloc KYC existant (enforceKyc && kycStatus != VERIFIED)
        }
```
Et à la pose du statut (l.362) :
```java
        announcement.setStatus(isDraft ? AnnouncementStatus.DRAFT : AnnouncementStatus.ACTIVE);
```
Audit existant `ANNOUNCEMENT_CREATED` : ajouter `"status", saved.getStatus().name()` dans la Map.

- [ ] **Step 4: Vérifier le vert**

Run: `./mvnw test -Dtest=AnnouncementServiceTest 2>&1 | tail -5`
Expected: BUILD SUCCESS, nouveaux tests verts, anciens intacts.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(matching): création d'annonce en brouillon (statut DRAFT, quota 1/10)"
```

---

### Task 2: Le count mensuel exclut les brouillons

**Files:**
- Modify: `src/main/java/com/dony/api/matching/AnnouncementRepository.java:106`
- Modify: `src/main/java/com/dony/api/matching/AnnouncementService.java` (bloc limite mensuelle déplacé en Task 1)
- Test: `src/test/java/com/dony/api/matching/AnnouncementServiceTest.java`

**Interfaces:**
- Produces: `countByTravelerIdAndCreatedAtBetweenAndStatusNot(UUID, LocalDateTime, LocalDateTime, AnnouncementStatus): long` (remplace `countByTravelerIdAndCreatedAtBetween` dans le service ; supprimer l'ancienne méthode si plus aucun usage).

- [ ] **Step 1: Test qui échoue**

```java
@Test
void createAnnouncement_publishDirect_monthlyLimitIgnoresDrafts() {
    UserEntity user = standardUser();
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));
    // le nouveau count (hors DRAFT) renvoie 1 => sous la limite (2) => création OK
    when(announcementRepository.countByTravelerIdAndCreatedAtBetweenAndStatusNot(
            eq(user.getId()), any(), any(), eq(AnnouncementStatus.DRAFT))).thenReturn(1L);
    when(announcementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    AnnouncementResponse resp = service.createAnnouncement("uid", activeRequest()); // saveAsDraft=false
    assertThat(resp.status()).isEqualTo(AnnouncementStatus.ACTIVE);
}
```

- [ ] **Step 2: Vérifier l'échec** — `./mvnw test -Dtest=AnnouncementServiceTest` → compilation (méthode absente).

- [ ] **Step 3: Implémenter** — ajouter la derived query au repository, remplacer l'appel dans le bloc limite mensuelle :
```java
            long count = announcementRepository.countByTravelerIdAndCreatedAtBetweenAndStatusNot(
                    user.getId(), from, to, AnnouncementStatus.DRAFT);
```

- [ ] **Step 4: Vert** — `./mvnw test -Dtest=AnnouncementServiceTest` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "fix(matching): la limite mensuelle d'annonces ignore les brouillons"`

---

### Task 3: Service `publishAnnouncement` (DRAFT → ACTIVE)

**Files:**
- Modify: `src/main/java/com/dony/api/matching/AnnouncementService.java`
- Test: `src/test/java/com/dony/api/matching/AnnouncementServiceTest.java`

**Interfaces:**
- Produces: `public AnnouncementDetailResponse publishAnnouncement(UUID id, String firebaseUid)` — même type de retour que `getAnnouncementDetail`.

- [ ] **Step 1: Tests qui échouent** (un test par contrôle)

```java
@Test
void publishAnnouncement_draft_becomesActive_andAuditsPublication() {
    UserEntity user = verifiedProUser(); // KYC VERIFIED
    AnnouncementEntity draft = draftEntityOwnedBy(user); // status=DRAFT, departureDate=demain
    when(userRepository.findByFirebaseUid("uid")).thenReturn(Optional.of(user));
    when(announcementRepository.findById(draft.getId())).thenReturn(Optional.of(draft));
    when(announcementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    service.publishAnnouncement(draft.getId(), "uid");

    assertThat(draft.getStatus()).isEqualTo(AnnouncementStatus.ACTIVE);
    verify(auditService).log(eq("USER"), eq(user.getId()),
            eq("ANNOUNCEMENT_PUBLISHED"), eq(draft.getId()), anyMap());
}

@Test
void publishAnnouncement_notADraft_throws422() {
    // entity status=ACTIVE → code "not-a-draft", HttpStatus.UNPROCESSABLE_ENTITY
}

@Test
void publishAnnouncement_notOwner_throws() {
    // findById renvoie une annonce d'un autre travelerId → 404/403 selon le pattern ownership existant du service (imiter updateAnnouncement)
}

@Test
void publishAnnouncement_kycNotVerified_throws403KycNotVerified() {
    // user.kycStatus=PENDING (avec enforceKyc=true) → code "kyc-not-verified"
}

@Test
void publishAnnouncement_publishingSuspended_throws403() {
    // user.publishingSuspended=true → code "publishing-suspended"
}

@Test
void publishAnnouncement_nonProMonthlyLimitReached_throws403ProLimitReached() {
    // countByTravelerIdAndCreatedAtBetweenAndStatusNot >= monthlyAnnouncements → "pro-limit-reached"
}

@Test
void publishAnnouncement_departureDatePassed_throws422() {
    // draft.departureDate = hier → code "departure-date-passed", le statut RESTE DRAFT
}
```

- [ ] **Step 2: Vérifier l'échec** — compilation (`publishAnnouncement` absent).

- [ ] **Step 3: Implémenter**

```java
    @Transactional
    public AnnouncementDetailResponse publishAnnouncement(UUID id, String firebaseUid) {
        UserEntity user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new DonyBusinessException(HttpStatus.NOT_FOUND,
                        "user-not-found", "User Not Found", "Utilisateur introuvable"));

        AnnouncementEntity announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new DonyBusinessException(HttpStatus.NOT_FOUND,
                        "announcement-not-found", "Not Found", "Annonce introuvable"));

        if (!announcement.getTravelerId().equals(user.getId())) {
            // imiter exactement le pattern ownership de updateAnnouncement (même statut/code)
            throw new DonyBusinessException(HttpStatus.FORBIDDEN, "not-owner",
                    "Forbidden", "Seul le propriétaire peut publier cette annonce");
        }

        if (announcement.getStatus() != AnnouncementStatus.DRAFT) {
            throw new DonyBusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "not-a-draft",
                    "Not A Draft", "Seul un brouillon peut être publié");
        }

        if (user.isPublishingSuspended()) {
            throw new DonyBusinessException(HttpStatus.FORBIDDEN, "publishing-suspended",
                    "Publishing Suspended",
                    "La publication de trajets est suspendue. Contactez le support.");
        }

        if (enforceKyc && user.getKycStatus() != KycStatus.VERIFIED) {
            throw new DonyBusinessException(HttpStatus.FORBIDDEN, "kyc-not-verified",
                    "KYC Not Verified", "Vérifiez votre identité pour publier un trajet.");
        }

        if (!user.isProAccount() && config.limits() != null) {
            YearMonth current = YearMonth.now();
            LocalDateTime from = current.atDay(1).atStartOfDay();
            LocalDateTime to = current.atEndOfMonth().atTime(23, 59, 59);
            long count = announcementRepository.countByTravelerIdAndCreatedAtBetweenAndStatusNot(
                    user.getId(), from, to, AnnouncementStatus.DRAFT);
            if (count >= config.limits().monthlyAnnouncements()) {
                throw new DonyBusinessException(HttpStatus.FORBIDDEN, "pro-limit-reached",
                        "Monthly announcement limit reached",
                        "Vous avez atteint votre limite de " + config.limits().monthlyAnnouncements()
                                + " annonces ce mois-ci. Passez en PRO pour continuer.");
            }
        }

        if (announcement.getDepartureDate() != null
                && announcement.getDepartureDate().isBefore(LocalDate.now())) {
            throw new DonyBusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "departure-date-passed",
                    "Departure Date Passed",
                    "La date de départ est passée. Modifiez le trajet avant de le publier.");
        }

        announcement.setStatus(AnnouncementStatus.ACTIVE);
        AnnouncementEntity saved = announcementRepository.save(announcement);

        auditService.log("USER", user.getId(), "ANNOUNCEMENT_PUBLISHED", saved.getId(),
                Map.of("departureCity", saved.getDepartureCity(),
                       "arrivalCity", saved.getArrivalCity(),
                       "departureDate", saved.getDepartureDate().toString()));

        return getAnnouncementDetail(saved.getId(), firebaseUid);
    }
```
Note : factoriser les 3 contrôles (suspension/KYC/limite mensuelle) dans un helper privé `assertCanPublish(UserEntity)` partagé avec `createAnnouncement` (DRY) — les tests des deux chemins existent déjà et verrouillent le comportement.

- [ ] **Step 4: Vert** — `./mvnw test -Dtest=AnnouncementServiceTest` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(matching): publication d'un brouillon (DRAFT→ACTIVE) avec contrôles"`

---

### Task 4: Endpoint `POST /announcements/{id}/publish` + tests d'intégration

**Files:**
- Modify: `src/main/java/com/dony/api/matching/AnnouncementController.java` (après `updateAnnouncement`)
- Test: `src/test/java/com/dony/api/matching/AnnouncementControllerIntegrationTest.java`

**Interfaces:**
- Consumes: `announcementService.publishAnnouncement(UUID, String)` (Task 3).
- Produces: route `POST /announcements/{id}/publish` → 200 `AnnouncementDetailResponse`.

- [ ] **Step 1: Tests MockMvc qui échouent** (suivre le setup du fichier d'intégration existant : users seedés, token mock)

```java
@Test
void publishDraft_returns200_andAnnouncementBecomesActive() throws Exception {
    UUID draftId = seedDraftAnnouncement(verifiedTraveler); // helper à créer sur le modèle des seeds existants
    mockMvc.perform(post("/announcements/" + draftId + "/publish")
                    .header("Authorization", bearer(verifiedTraveler)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACTIVE"));
}

@Test
void publishActive_returns422NotADraft() throws Exception {
    UUID activeId = seedActiveAnnouncement(verifiedTraveler);
    mockMvc.perform(post("/announcements/" + activeId + "/publish")
                    .header("Authorization", bearer(verifiedTraveler)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.type").value(org.hamcrest.Matchers.containsString("not-a-draft")));
}

@Test
void publishSomeoneElsesDraft_isRejected() throws Exception {
    UUID draftId = seedDraftAnnouncement(verifiedTraveler);
    mockMvc.perform(post("/announcements/" + draftId + "/publish")
                    .header("Authorization", bearer(otherTraveler)))
            .andExpect(status().is4xxClientError());
}

@Test
void createDraft_thenListMyDrafts_returnsIt() throws Exception {
    // POST /announcements body avec "saveAsDraft": true → 201, status DRAFT
    // GET /announcements/my?status=DRAFT → contient l'annonce
}

@Test
void draftIsInvisibleInPublicSearch() throws Exception {
    seedDraftAnnouncement(verifiedTraveler);
    // GET /announcements (recherche publique, params corridor du draft) → liste vide
}
```

- [ ] **Step 2: Vérifier l'échec** — `./mvnw test -Dtest=AnnouncementControllerIntegrationTest` → 404/erreurs.

- [ ] **Step 3: Implémenter le controller**

```java
    @PostMapping("/{id}/publish")
    public ResponseEntity<AnnouncementDetailResponse> publishAnnouncement(@PathVariable UUID id) {
        String firebaseUid = requireFirebaseUid();
        return ResponseEntity.ok(announcementService.publishAnnouncement(id, firebaseUid));
    }
```

- [ ] **Step 4: Vert** — `./mvnw test -Dtest=AnnouncementControllerIntegrationTest` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(matching): endpoint POST /announcements/{id}/publish"`

---

### Task 5: Audit anti-fuite — les DRAFT n'apparaissent nulle part publiquement

**Files:**
- Inspect/Modify: `src/main/java/com/dony/api/matching/TravelerStatsController.java:209` (+ la méthode service derrière `travelerAnnouncements`)
- Inspect: `src/main/java/com/dony/api/matching/AnnouncementInProgressScheduler` (transitions), `AnnouncementService:905` (stats), matching/alertes (`AlertService.findMatchingTrips`), `BidService` (création bid sur annonce non-ACTIVE, `AnnouncementService:818`)
- Test: `src/test/java/com/dony/api/matching/TravelerAnnouncementsControllerTest.java`, `src/test/java/com/dony/api/matching/AnnouncementInProgressSchedulerTest.java`

**Interfaces:** aucun nouveau symbole — garanties de non-régression.

- [ ] **Step 1: Tests qui échouent (ou passent déjà — les écrire quand même comme verrous)**

```java
// TravelerAnnouncementsControllerTest
@Test
void publicTravelerAnnouncements_excludeDrafts() throws Exception {
    seedDraftAnnouncement(traveler);
    seedActiveAnnouncement(traveler);
    mockMvc.perform(get("/travelers/" + traveler.getId() + "/announcements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
}

// AnnouncementInProgressSchedulerTest
@Test
void scheduler_neverTransitionsDrafts() {
    // draft avec departureAt passé → après le tick du scheduler, status reste DRAFT
}
```

- [ ] **Step 2: Lancer** — noter lesquels échouent. Chaque échec = fuite réelle à corriger.

- [ ] **Step 3: Corriger les fuites détectées** — pour chaque query fautive, ajouter le filtre statut (ex. `findByTravelerIdAndStatus(..., ACTIVE)` au lieu d'un `findByTravelerId`), en modifiant uniquement le call-site concerné. Vérifier aussi ligne :818 (bid sur annonce non-ACTIVE déjà bloqué → écrire le test `createBidOnDraft_rejected` si absent).

- [ ] **Step 4: Vert** — `./mvnw test -Dtest='TravelerAnnouncementsControllerTest,AnnouncementInProgressSchedulerTest,AnnouncementServiceTest'` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "test(matching): verrous anti-fuite des brouillons (public, scheduler, bids)"`

---

### Task 6: Suite complète + couverture + PR

- [ ] **Step 1:** `./mvnw test 2>&1 | tail -10` → BUILD SUCCESS, zéro test rouge.
- [ ] **Step 2:** `./mvnw test jacoco:report` → ouvrir `target/site/jacoco/index.html`, vérifier ≥ 90 % global et sur `AnnouncementService`.
- [ ] **Step 3:** Vérification manuelle (back lancé via `./start-dev.sh`) :
```bash
TOKEN=$(curl -s "http://localhost:8080/dev/token?role=TRAVELER" | jq -r .token) # endpoint dev existant
# créer un brouillon
curl -s -X POST http://localhost:8080/announcements -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{ ...body annonce valide..., "saveAsDraft": true }' | jq .status
# → "DRAFT" ; puis /publish → "ACTIVE" ; 2e brouillon non-pro → 403 draft-limit-reached
```
- [ ] **Step 4:** `git push -u origin feature/trip-draft-status && gh pr create --draft --title "feat(matching): statut DRAFT des trajets + publication" --body "<résumé + lien spec>"`

---

## Self-review (fait à l'écriture)

- Couverture spec : quota ✅ (T1), contrôles à la publication ✅ (T3), count mensuel hors DRAFT ✅ (T2), endpoint ✅ (T4), anti-fuite ✅ (T5), audit_log ✅ (T3), rétro-compat `saveAsDraft` nullable ✅ (T1), erreurs RFC 7807 ✅, zéro migration ✅.
- Types cohérents : `countByTravelerIdAndCreatedAtBetweenAndStatusNot` identique T2/T3 ; `publishAnnouncement(UUID, String)` identique T3/T4.
