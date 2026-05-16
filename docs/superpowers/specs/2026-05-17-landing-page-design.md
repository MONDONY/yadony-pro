# Landing page dony PRO — Spec design

**Date :** 2026-05-17  
**Statut :** Approuvé  
**Projet :** dony-pro (Nuxt 3 + Tailwind CSS)

---

## 1. Contexte

dony PRO est l'espace web professionnel réservé aux voyageurs vérifiés de l'application mobile dony. Ce n'est pas un produit indépendant : l'accès s'active depuis l'app mobile après validation KYC. La landing page s'adresse donc principalement à des utilisateurs existants de l'app dony qui cherchent à passer au niveau pro, et secondairement à des inconnus qui découvrent le service.

**Objectif de la page :** inspirer confiance, expliquer la valeur du workspace PRO, et rediriger vers l'app mobile pour l'activation.

---

## 2. Décisions de design

| Décision | Choix retenu | Raison |
|---|---|---|
| Layout général | Product-first (split texte/visuel) | Montre l'app directement, crédibilité par la démonstration |
| Hero variant | Full immersif — glow radial bleu, mascottes prominentes | Impact visuel maximal, cohérent avec l'identité dony |
| Headline | "Gérez. Encaissez. Soyez payés." | Triptyque direct, pas de chiffres fictifs |
| Structure | 6 sections + FAQ | Lève toutes les objections, parcours complet de conviction |
| Navbar | Logo + badge PRO + border bleue + Se connecter / Rejoindre | Badge PRO renforce le positionnement premium |
| Thème | Light / Dark + détection système par défaut | Cohérence avec le design system de l'app mobile |

---

## 3. Design system — tokens exacts de l'app dony

Les tokens sont ceux de `dony_app/lib/core/design/tokens/color_tokens.dart`. Le dark mode utilise les variantes `neutralDark*` / `blueDark*` / `terraDark*`.

### 3.1 Mode sombre (défaut si système = dark)

```css
--bg:          #0A0E14;   /* neutralDark0   */
--surface:     #161B23;   /* neutralDark100  */
--surface-el:  #222932;   /* neutralDark200  */
--border:      #2D333D;   /* neutralDark300  */
--primary:     #4D8AFF;   /* blueDark500 — recalibré WCAG AA sur fond sombre */
--primary-h:   #6699FF;   /* blueDark600     */
--accent:      #E8865B;   /* terraDark500    */
--accent-h:    #B95524;   /* terraDark700    */
--text:        #F5F0E8;   /* neutralDark700  */
--muted:       #B5AFA5;   /* neutralDark500  */
--subtle:      #7E7972;   /* neutralDark400  */
--success:     #2DA677;   /* successDark500  */
--warning:     #F0B84A;   /* warningDark500  */
--danger:      #EF5048;   /* dangerDark500   */
```

### 3.2 Mode clair (défaut si système = light)

```css
--bg:          #FAFAF8;   /* neutral50       */
--surface:     #FFFFFF;   /* white           */
--surface-el:  #F2F1ED;   /* neutral100      */
--border:      #E8E5DF;   /* neutral200      */
--primary:     #0B5FFF;   /* blue500         */
--primary-h:   #0A4DD9;   /* blue600         */
--accent:      #D96A3A;   /* terra500        */
--accent-h:    #B95524;   /* terra600        */
--text:        #0A2540;   /* ink800          */
--muted:       #54504A;   /* neutral600      */
--subtle:      #797367;   /* neutral500      */
--success:     #0E8A5F;   /* success500      */
--warning:     #E8A23B;   /* warning500      */
--danger:      #D9342B;   /* danger500       */
```

### 3.3 Typographie

| Rôle | Police | Weights | Usage |
|---|---|---|---|
| Display | Hanken Grotesk | 700, 800 | Titres, headlines, chiffres |
| Body | Plus Jakarta Sans | 400, 500, 600, 700 | Paragraphes, labels, boutons, nav |

**Import Google Fonts requis :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.4 Border-radius

| Token | Valeur | Usage |
|---|---|---|
| `--radius-card` | 16px | Cards, sections, modals |
| `--radius-btn` | 14px | Boutons principaux |
| `--radius-sm` | 8px | Inputs, small badges |
| `--radius-full` | 999px | Pills, badges ronds |

### 3.5 Mise à jour de `tailwind.config.ts`

Le fichier doit être mis à jour pour refléter les tokens dark/light exacts. Le mode `darkMode: 'class'` reste. Les nouvelles valeurs CSS vars sont injectées via le plugin `addBase` de Tailwind ou directement dans `app.css`.

---

## 4. Thème — détection système + bouton de bascule

### Comportement

- **Au chargement :** détecter `prefers-color-scheme` via `window.matchMedia`. Appliquer la classe `dark` sur `<html>` si dark, rien sinon.
- **Préférence sauvegardée :** stocker le choix manuel dans `localStorage` sous la clé `dony-theme`. Prend le pas sur le système.
- **Bouton dans la navbar :** icône soleil/lune, positionné entre "Se connecter" et "Rejoindre dony PRO".
- **Transition :** `transition: background-color 0.3s ease, color 0.2s ease` sur `body`.

### Composant `ThemeToggle.vue`

```
app/components/ui/ThemeToggle.vue
```

```vue
<script setup lang="ts">
const isDark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('dony-theme')
  isDark.value = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme()
})

function toggle() {
  isDark.value = !isDark.value
  localStorage.setItem('dony-theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>
```

---

## 5. Structure de la page — 7 blocs

```
app/pages/landing.vue          ← nouvelle page publique
app/features/landing/
  components/
    LandingNav.vue
    LandingHero.vue
    LandingAppBridge.vue       ← bandeau "Tu utilises déjà dony ?"
    LandingSteps.vue
    LandingTestimonials.vue
    LandingFeatures.vue
    LandingFaq.vue
    LandingCta.vue
    LandingFooter.vue
```

### Bloc 1 — Navbar (`LandingNav.vue`)

- Sticky, `backdrop-filter: blur(12px)`, border-bottom couleur primary à 20% d'opacité.
- **Gauche :** logo `logo-white-orange.png` (dark) / `logo-blue-orange.png` (light) + badge pill "PRO".
- **Centre :** liens "Comment ça marche", "Fonctionnalités", "FAQ" (ancres internes).
- **Droite :** `ThemeToggle` + bouton ghost "Se connecter" → `/login` + bouton primary "Rejoindre dony PRO" → `/login`.
- Mobile : hamburger menu, liens en drawer.

### Bloc 2 — Hero (`LandingHero.vue`)

Layout split deux colonnes (flex, gap 40px, max-width 1100px) :

**Colonne gauche (flex: 1) :**
1. Badge pill animé : `badge-dot` pulsé + texte "Paris · Lyon · Marseille → Dakar · Abidjan · Bamako"
2. Headline `<h1>` Hanken Grotesk 800, ~50px : "Gérez. Encaissez. **Soyez payés.**" (accent sur le 3e mot)
3. Sous-titre 15px muted, max-width 440px
4. CTA row : bouton primary "Accéder au cockpit →" + bouton outline "Voir la démo"
5. Trust chips : 🔒 Paiements Stripe · ✓ KYC vérifié · 🛡 Fonds en séquestre

**Colonne droite (flex: 0 0 500px, height 480px, position relative) :**
- `sur_avion.png` (400px) — mascotte principale, `position: absolute; right: 0; bottom: 0; z-index: 3`
- App cockpit mockup (230px wide) — `position: absolute; top: 0; left: 0; z-index: 5; transform: perspective(800px) rotateY(-6deg)`
- Notification flottante "Nouveau match ! · Paris → Dakar · 4.2 kg" — `z-index: 20; animation: float`
- `pouce_leve.png` (100px) — mascotte secondaire animée, `position: absolute; bottom: 20px; left: 220px; z-index: 6`

**Fond héro :**
```css
background: radial-gradient(
  ellipse at 70% 30%,
  rgba(primary, 0.14) 0%,
  rgba(accent, 0.05) 40%,
  var(--bg) 65%
);
```
+ 2 blobs `glow` (div ronde filtrée blur 70px) en arrière-plan.

### Bloc 3 — Bandeau app mobile (`LandingAppBridge.vue`)

Fond : `linear-gradient(135deg, rgba(accent, 0.08), rgba(primary, 0.06))`, border top/bottom accent 15% opacité.

**Contenu (flex, space-between) :**
- Gauche : icône 📱 + titre "Active ton espace PRO depuis l'application mobile" + sous-titre
- Droite : 3 étapes en ligne (Ouvre l'app → Profil → PRO → Active) + bouton accent "📲 Télécharger l'app dony" → `https://dony.app`

### Bloc 4 — Comment ça marche (`LandingSteps.vue`)

3 cards en grid (1fr 1fr 1fr), gap 24px. Chaque card :
- Border-top 2px dégradé (bleu / accent / vert selon l'étape)
- Numéro pill coloré
- Mascotte :
  - Étape 1 : `tenant_colis.png` (80px)
  - Étape 2 : `dans_avion.png` (80px)
  - Étape 3 : `colis_livre.png` (80px)
- Titre + description

### Bloc 5 — Témoignages (`LandingTestimonials.vue`)

3 cards en grid, fond `section-wrap-alt`. Chaque card :
- Étoiles ★★★★★ (#F59E0B)
- Citation avec guillemet décoratif (color primary, font-size 26px)
- Avatar avec initiale + nom + rôle "Voyageur Paris → Dakar · 3 ans"

> **Note :** Remplacer par de vrais témoignages dès qu'ils sont disponibles. Les 3 exemples (Amadou D., Fatoumata K., Moussa C.) sont des placeholders réalistes.

### Bloc 6 — Fonctionnalités (`LandingFeatures.vue`)

3 feature rows en alternance (texte gauche/droite) :

| # | Titre | Icône | Mascotte UI |
|---|---|---|---|
| 1 | Cockpit opérationnel | 📊 | Mockup KPIs + trajets |
| 2 | Matching & négociation | 🤝 | Bulle de conversation |
| 3 | Paiements sécurisés | 🔒 | État séquestre → virement |

Chaque row : `feature-text` (flex 1) + `feature-visual` (flex 0 0 380px). Row 2 : `flex-direction: row-reverse`.

### Bloc 7 — FAQ (`LandingFaq.vue`)

Layout 2 colonnes : texte intro fixe (240px) + liste accordéon.

5 questions :
1. C'est quoi dony PRO ?
2. Comment accéder à dony PRO ?
3. Comment fonctionne le paiement sécurisé ?
4. Quelle commission prend dony ?
5. Que se passe-t-il en cas de litige ?

L'accordéon est géré par `v-show` + transition CSS. Pas de librairie externe.

### Bloc 8 — CTA finale (`LandingCta.vue`)

Fond : `linear-gradient(135deg, rgba(primary, 0.12), rgba(accent, 0.06))`, border-top primary 15%.
- Gauche : titre "Prêt à gérer ton activité comme un pro ?" + sous-titre + bouton "Accéder au cockpit →" + trust chip
- Droite : `pouce_leve.png` (200px)

### Bloc 9 — Footer (`LandingFooter.vue`)

- Gauche : logo + copyright
- Centre : liens Confidentialité · CGU · Contact · 📱 App mobile dony
- Droite : badge 🔒 Paiements Stripe

---

## 6. Routing & middleware

La landing page est **publique** — pas de middleware auth.

```ts
// auth.global.ts — ajouter '/landing' aux routes publiques
const PUBLIC_ROUTES = ['/login', '/upgrade', '/landing']
```

La page d'index `/` reste le cockpit (redirigé vers `/login` si non authentifié). La landing est accessible sur `/landing` (ou `/` si on décide de la mettre en page d'accueil publique — à décider lors de l'implémentation).

---

## 7. Assets utilisés

| Fichier | Usage |
|---|---|
| `assets/logos/logo-white-orange.png` | Navbar dark mode |
| `assets/logos/logo-blue-orange.png` | Navbar light mode |
| `assets/mascottes/sur_avion.png` | Hero — mascotte principale |
| `assets/mascotte/joyeux.png` | Fallback mascotte hero |
| `assets/mascotte/tenant_le_colis.png` | Étape 1 |
| `assets/mascottes/dans_avion.png` | Étape 2 |
| `assets/mascottes/colis_livre.png` | Étape 3 |
| `assets/mascottes/pouce_leve.png` | Hero secondaire + CTA finale |

Les images sont servies depuis le dossier `public/` de Nuxt. Copier les assets Flutter dans `dony-pro/public/mascots/` et `dony-pro/public/logos/`.

---

## 8. Responsive

| Breakpoint | Comportement |
|---|---|
| `< 768px` | Hero en colonne (mascotte réduite à 220px, app mockup masqué) |
| `768–1024px` | Hero split conservé, features en colonne |
| `> 1024px` | Layout full tel que spécifié |

La navbar passe en hamburger sous 768px.

---

## 9. Accessibilité

- Contraste WCAG AA vérifié sur tous les tokens (primary dark `#4D8AFF` sur `#0A0E14` → ratio 4.6:1 ✓)
- `alt` descriptif sur toutes les mascottes
- Focus visible sur boutons et liens (outline primary)
- `prefers-reduced-motion` : désactiver les animations float/pulse si activé

---

## 10. Ce qui n'est pas dans ce spec

- **Animations d'entrée** au scroll (intersection observer) — ajout optionnel en phase polish
- **Vidéo de démo** — bouton "Voir la démo" pointe pour l'instant vers `#` 
- **Vrais témoignages** — à remplacer dès disponibles
- **i18n** — page en français uniquement pour le MVP
