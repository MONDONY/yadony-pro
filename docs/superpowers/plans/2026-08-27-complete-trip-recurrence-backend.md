# Complete Trip Recurrence Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recurring trips period-aware, progressively published, editable, retryable, and duplicate-safe while preserving legacy Flutter requests.

**Architecture:** Extend the existing recurrence aggregate and API additively, isolate calendar rules in a pure Java class, and link generated announcements to their source recurrence. The daily scheduler scans a bounded publication window and relies on both an existence check and a database unique index for idempotence.

**Tech Stack:** Java 21, Spring Boot 3.5, Spring Data JPA, PostgreSQL, Flyway, JUnit 5, Mockito, MockMvc.

**Spec:** `/Users/aboubakardiakite/Desktop/dony/dony-pro/docs/superpowers/specs/2026-08-27-complete-trip-recurrence-design.md`

## Global Constraints

- New Dony Pro clients offer publication delays of exactly 7, 14, 21, or 30 days; legacy `horizonDays` remains accepted from 1 through 60.
- `startDate` is required for normalized data; `endDate` is optional and has no maximum duration.
- `weekInterval` is 1 through 4 and is anchored to the ISO week containing `startDate`.
- `handoverLeadDays` is 0 through 3, with 1 as the new-client default and 0 for legacy requests.
- Existing announcements never change when a recurrence is edited.
- Existing Flutter requests that only send `weekdays` and `horizonDays` must keep working.
- A generated announcement is unique by `(source_recurrence_id, departure_date)`.
- No technical exception detail is returned as a user-facing recurrence error.

---

### Task 1: Additive recurrence and announcement schema

**Files:**
- Create: `src/main/resources/db/migration/V233__complete_trip_recurrences.sql`
- Modify: `src/main/java/com/yadony/api/matching/TripRecurrenceEntity.java`
- Modify: `src/main/java/com/yadony/api/matching/AnnouncementEntity.java`
- Test: `src/test/java/com/yadony/api/migrations/V233CompleteTripRecurrencesMigrationTest.java`

**Interfaces:**
- Produces recurrence fields `startDate`, `endDate`, `weekInterval`, `publicationLeadDays`, `handoverLeadDays`, pricing data, description, and last-publication error data.
- Produces announcement field `sourceRecurrenceId: UUID` and the unique database invariant.

- [ ] **Step 1: Write the failing migration test**

Create a PostgreSQL migration test that migrates a schema containing one historical recurrence and verifies normalized defaults plus the unique index. The core assertions are:

```java
assertThat(row.get("start_date")).isNotNull();
assertThat(row.get("week_interval")).isEqualTo(1);
assertThat(row.get("publication_lead_days")).isEqualTo(14);
assertThat(row.get("handover_lead_days")).isEqualTo(0);
assertThat(row.get("end_date")).isNull();
assertThatThrownBy(() -> insertGeneratedAnnouncementTwice(recurrenceId, LocalDate.of(2026, 9, 7)))
        .isInstanceOf(DataIntegrityViolationException.class);
```

- [ ] **Step 2: Run the migration test to verify it fails**

Run:

```bash
./mvnw -Dtest=V233CompleteTripRecurrencesMigrationTest test --no-transfer-progress
```

Expected: FAIL because V233 and the new columns do not exist.

- [ ] **Step 3: Add the migration**

Add nullable columns first, backfill historical rows, then add checks/defaults. Include:

```sql
ALTER TABLE trip_recurrences
    ADD COLUMN start_date DATE,
    ADD COLUMN end_date DATE,
    ADD COLUMN week_interval INTEGER,
    ADD COLUMN publication_lead_days INTEGER,
    ADD COLUMN handover_lead_days INTEGER,
    ADD COLUMN pricing_mode VARCHAR(10),
    ADD COLUMN negotiable BOOLEAN,
    ADD COLUMN currency VARCHAR(3),
    ADD COLUMN refused_categories TEXT,
    ADD COLUMN description VARCHAR(500),
    ADD COLUMN last_publication_error_code VARCHAR(100),
    ADD COLUMN last_publication_error_message VARCHAR(255),
    ADD COLUMN last_publication_error_at TIMESTAMP;

UPDATE trip_recurrences
SET start_date = COALESCE(created_at::date, CURRENT_DATE),
    week_interval = 1,
    publication_lead_days = COALESCE(horizon_days, 14),
    handover_lead_days = 0,
    pricing_mode = 'KG',
    negotiable = FALSE,
    currency = 'EUR';

ALTER TABLE announcements ADD COLUMN source_recurrence_id UUID;
ALTER TABLE announcements
    ADD CONSTRAINT announcements_source_recurrence_fkey
    FOREIGN KEY (source_recurrence_id) REFERENCES trip_recurrences(id);
CREATE UNIQUE INDEX uq_announcements_recurrence_departure
    ON announcements(source_recurrence_id, departure_date)
    WHERE source_recurrence_id IS NOT NULL;
```

Add check constraints for interval, lead-day ranges, and `end_date >= start_date`. Preserve `horizon_days` and `last_generated_date`.

- [ ] **Step 4: Map the columns in the entities**

Add plain scalar fields and accessors. Use `UUID sourceRecurrenceId` in `AnnouncementEntity`, not a JPA association, so soft deletion of a recurrence cannot hide an announcement.

- [ ] **Step 5: Run the migration test and compile**

Run:

```bash
./mvnw -Dtest=V233CompleteTripRecurrencesMigrationTest test --no-transfer-progress
./mvnw -DskipTests compile --no-transfer-progress
```

Expected: PASS and BUILD SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add src/main/resources/db/migration/V233__complete_trip_recurrences.sql src/main/java/com/yadony/api/matching/TripRecurrenceEntity.java src/main/java/com/yadony/api/matching/AnnouncementEntity.java src/test/java/com/yadony/api/migrations/V233CompleteTripRecurrencesMigrationTest.java
git commit -m "feat(recurrence): add complete schedule schema"
```

### Task 2: Deterministic calendar rules

**Files:**
- Create: `src/main/java/com/yadony/api/matching/TripRecurrenceCalendar.java`
- Create: `src/test/java/com/yadony/api/matching/TripRecurrenceCalendarTest.java`

**Interfaces:**
- Produces `boolean matches(LocalDate candidate, LocalDate startDate, LocalDate endDate, String weekdays, int weekInterval)`.
- Produces `List<OccurrenceDate> nextOccurrences(LocalDate from, int count, Schedule schedule)` where `OccurrenceDate` contains `departureDate` and `publicationDate`.

- [ ] **Step 1: Write failing calendar tests**

Cover start/end inclusion, Monday-to-Sunday bit positions, 2/3/4-week intervals, year rollover, no end date, and publication-date subtraction. Include a fixed example:

```java
var schedule = new Schedule(
        LocalDate.of(2026, 9, 1), null, "1000100", 2, 14);

assertThat(calendar.nextOccurrences(LocalDate.of(2026, 8, 20), 3, schedule))
        .extracting(OccurrenceDate::departureDate)
        .containsExactly(
                LocalDate.of(2026, 9, 4),
                LocalDate.of(2026, 9, 14),
                LocalDate.of(2026, 9, 18));
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
./mvnw -Dtest=TripRecurrenceCalendarTest test --no-transfer-progress
```

Expected: FAIL because `TripRecurrenceCalendar` does not exist.

- [ ] **Step 3: Implement the pure calculator**

Use `WeekFields.ISO` or Monday-normalized `ChronoUnit.WEEKS` calculation. Reject malformed weekday strings and intervals outside 1 through 4 with `IllegalArgumentException`; do not read the system clock inside this class.

- [ ] **Step 4: Run the calendar tests**

```bash
./mvnw -Dtest=TripRecurrenceCalendarTest test --no-transfer-progress
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/yadony/api/matching/TripRecurrenceCalendar.java src/test/java/com/yadony/api/matching/TripRecurrenceCalendarTest.java
git commit -m "feat(recurrence): calculate scheduled occurrences"
```

### Task 3: Extend and normalize the recurrence API

**Files:**
- Modify: `src/main/java/com/yadony/api/matching/dto/TripRecurrenceRequest.java`
- Modify: `src/main/java/com/yadony/api/matching/dto/TripRecurrenceDto.java`
- Create: `src/main/java/com/yadony/api/matching/TripRecurrenceStatus.java`
- Modify: `src/main/java/com/yadony/api/matching/TripRecurrenceService.java`
- Modify: `src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java`
- Modify: `src/test/java/com/yadony/api/matching/TripRecurrenceControllerIntegrationTest.java`

**Interfaces:**
- Consumes `TripRecurrenceCalendar` from Task 2.
- Produces normalized request fields and response fields `status`, `nextDepartureDate`, `nextPublicationDate`, and safe error metadata.

- [ ] **Step 1: Add failing API compatibility tests**

Add one MockMvc test posting the new fields and asserting round-trip persistence. Add one legacy test omitting them and sending `horizonDays: 14`, asserting:

```java
jsonPath("$.weekInterval").value(1)
jsonPath("$.publicationLeadDays").value(14)
jsonPath("$.handoverLeadDays").value(0)
jsonPath("$.endDate").doesNotExist()
```

Also assert a 400 response for `endDate < startDate`, invalid interval, and a new-client publication delay outside `{7,14,21,30}`.

- [ ] **Step 2: Run the focused API tests to verify failure**

```bash
./mvnw -Dtest=TripRecurrenceControllerIntegrationTest test --no-transfer-progress
```

Expected: FAIL on missing fields and validation.

- [ ] **Step 3: Extend request and response records**

Use nullable wrappers on new request fields for legacy compatibility. Add an `@AssertTrue` method:

```java
@JsonIgnore
@AssertTrue(message = "La date de fin doit être postérieure ou égale à la date de début")
public boolean isPeriodValid() {
    return startDate == null || endDate == null || !endDate.isBefore(startDate);
}
```

Normalize once in `applyFields`: new requests use their explicit values; legacy requests use current date, weekly interval, `horizonDays` or 14, and handover lead 0. Persist `pricingMode`, `negotiable`, `currency`, refused categories, and description.

- [ ] **Step 4: Derive list status and next occurrence**

Add a package-private mapper overload taking `LocalDate today` for deterministic tests. Return `TERMINATED`, `PAUSED`, `ACTION_REQUIRED`, `UPCOMING`, or `ACTIVE` in the priority defined by the spec. Use the calendar for the next departure/publication pair.

- [ ] **Step 5: Run service and controller tests**

```bash
./mvnw -Dtest=TripRecurrenceServiceTest,TripRecurrenceControllerIntegrationTest test --no-transfer-progress
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/yadony/api/matching/dto/TripRecurrenceRequest.java src/main/java/com/yadony/api/matching/dto/TripRecurrenceDto.java src/main/java/com/yadony/api/matching/TripRecurrenceStatus.java src/main/java/com/yadony/api/matching/TripRecurrenceService.java src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java src/test/java/com/yadony/api/matching/TripRecurrenceControllerIntegrationTest.java
git commit -m "feat(recurrence): expose complete schedule API"
```

### Task 4: Link generated announcements and enforce idempotence

**Files:**
- Modify: `src/main/java/com/yadony/api/matching/AnnouncementRepository.java`
- Modify: `src/main/java/com/yadony/api/matching/AnnouncementService.java`
- Modify: `src/test/java/com/yadony/api/matching/AnnouncementServiceTest.java`
- Modify: `src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java`

**Interfaces:**
- Produces `boolean existsBySourceRecurrenceIdAndDepartureDate(UUID recurrenceId, LocalDate departureDate)`.
- Produces `AnnouncementResponse createRecurringAnnouncement(String firebaseUid, AnnouncementRequest request, UUID recurrenceId)`.
- Existing `createAnnouncement(String, AnnouncementRequest)` remains unchanged for all public callers.

- [ ] **Step 1: Write failing announcement linkage tests**

Assert that normal creation persists `sourceRecurrenceId == null` and recurring creation persists the provided ID before matching events run. Add a recurrence-service test that skips creation when `existsBySourceRecurrenceIdAndDepartureDate` returns true.

- [ ] **Step 2: Run focused tests to verify failure**

```bash
./mvnw -Dtest=AnnouncementServiceTest,TripRecurrenceServiceTest test --no-transfer-progress
```

Expected: FAIL because the recurring entry point and repository method do not exist.

- [ ] **Step 3: Add the internal recurring creation path**

Refactor without changing public behavior:

```java
public AnnouncementResponse createAnnouncement(String uid, AnnouncementRequest request) {
    return createAnnouncement(uid, request, null);
}

public AnnouncementResponse createRecurringAnnouncement(
        String uid, AnnouncementRequest request, UUID recurrenceId) {
    return createAnnouncement(uid, request, recurrenceId);
}

private AnnouncementResponse createAnnouncement(
        String uid, AnnouncementRequest request, UUID recurrenceId) {
    // existing body; set sourceRecurrenceId before repository.save
}
```

Keep the existing KYC, Stripe, PRO-limit, price-grid snapshot, audit, and matching paths intact.

- [ ] **Step 4: Add repository existence lookup and use it before generation**

Use the database constraint as the final guard. Catch only the duplicate-key/data-integrity case caused by the recurrence/date unique index and treat it as already published; propagate unrelated integrity errors.

- [ ] **Step 5: Run focused tests**

```bash
./mvnw -Dtest=AnnouncementServiceTest,TripRecurrenceServiceTest test --no-transfer-progress
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/yadony/api/matching/AnnouncementRepository.java src/main/java/com/yadony/api/matching/AnnouncementService.java src/test/java/com/yadony/api/matching/AnnouncementServiceTest.java src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java
git commit -m "feat(recurrence): prevent duplicate publications"
```

### Task 5: Progressive generation, retry, and safe errors

**Files:**
- Modify: `src/main/java/com/yadony/api/matching/TripRecurrenceRepository.java`
- Modify: `src/main/java/com/yadony/api/matching/TripRecurrenceService.java`
- Modify: `src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java`

**Interfaces:**
- Consumes calendar matching and recurring announcement creation.
- Produces bounded daily generation and safe persisted failure state.

- [ ] **Step 1: Replace horizon tests with failing progressive-publication tests**

Use a fixed `today` overload and cover:

```java
int generateForRecurrence(TripRecurrenceEntity recurrence, LocalDate today)
```

Assert that only occurrences with `departureDate - publicationLeadDays <= today` are created; ended and paused recurrences are skipped; a failed occurrence is attempted again on the next run; already-linked occurrences are not recreated; and dates at or before historical `lastGeneratedDate` are skipped only for migrated records.

- [ ] **Step 2: Run recurrence tests to verify failure**

```bash
./mvnw -Dtest=TripRecurrenceServiceTest test --no-transfer-progress
```

Expected: FAIL against the old horizon-pointer algorithm.

- [ ] **Step 3: Implement the bounded scan**

Scan `[today, today + publicationLeadDays]`, filter with `TripRecurrenceCalendar`, and call `createRecurringAnnouncement`. Build `handoverDeadline` as the effective departure time (or noon) minus `handoverLeadDays`. Pass through pricing mode, negotiation, currency, description, accepted and refused categories.

- [ ] **Step 4: Persist safe error state and retry**

Map known `YadonyBusinessException.errorCode` values to stable French messages in a small private mapper. Store no raw exception text for unknown failures:

```java
default -> "La publication automatique a échoué. Elle sera retentée."
```

Clear the fields after any successful publication. Do not advance a checkpoint on failure.

- [ ] **Step 5: Restrict repository selection**

Replace `findByActiveTrue()` with a query that returns active, non-deleted recurrences whose `endDate` is null or not before today. Pass `today` explicitly from `generateDueTrips()`.

- [ ] **Step 6: Run focused tests**

```bash
./mvnw -Dtest=TripRecurrenceServiceTest,TripRecurrenceControllerIntegrationTest test --no-transfer-progress
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/main/java/com/yadony/api/matching/TripRecurrenceRepository.java src/main/java/com/yadony/api/matching/TripRecurrenceService.java src/test/java/com/yadony/api/matching/TripRecurrenceServiceTest.java
git commit -m "feat(recurrence): publish schedules progressively"
```

### Task 6: Backend verification

**Files:**
- Modify only files required by failures directly caused by Tasks 1 through 5.

**Interfaces:**
- Produces a backend branch ready for Dony Pro integration.

- [ ] **Step 1: Run recurrence and announcement tests together**

```bash
./mvnw -Dtest=TripRecurrenceCalendarTest,TripRecurrenceServiceTest,TripRecurrenceControllerIntegrationTest,AnnouncementServiceTest,V233CompleteTripRecurrencesMigrationTest test --no-transfer-progress
```

Expected: PASS.

- [ ] **Step 2: Run the complete backend gate**

```bash
./mvnw verify -Dspring.profiles.active=test --no-transfer-progress
```

Expected: BUILD SUCCESS with no test or JaCoCo failure.

- [ ] **Step 3: Run static analysis**

```bash
./mvnw test-compile spotbugs:check --no-transfer-progress
```

Expected: BUILD SUCCESS.

- [ ] **Step 4: Review the complete diff**

```bash
git diff --check
git status --short
git log --oneline --decorate -6
```

Expected: no whitespace errors and no uncommitted implementation changes.

