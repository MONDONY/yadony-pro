# Page de connexion dony PRO — Spec design

**Date :** 2026-05-17
**Statut :** Approuvé
**Projet :** dony-pro (Nuxt 3 + Tailwind CSS)

---

## 1. Contexte

La page de connexion actuelle (`/login`) est un simple formulaire centré sans identité visuelle forte. Elle doit être redesignée pour :
- Renforcer la confiance avant même la connexion (rassurance sécurité)
- Refléter l'identité dony PRO (design system, mascotte)
- Mieux servir les utilisateurs de la diaspora (sélecteur de pays avec indicatifs FR/SN/CI/ML)
- Offrir une saisie OTP plus intuitive (6 cases individuelles)

---

## 2. Décisions de design

| Décision | Choix retenu | Raison |
|---|---|---|
| Layout | Split screen 50/50 | Professionnel, espace pour le branding à gauche |
| Panneau gauche | Logo + mascotte `sécurisé.png` + 3 messages de réassurance | La mascotte tient un bouclier — parfaite pour la sécurité |
| Saisie téléphone | Sélecteur pays + champ numéro + raccourcis FR/SN/CI/ML | Adapté à la diaspora africaine, pas d'indicatif à mémoriser |
| Saisie OTP | 6 cases individuelles avec focus automatique | Premium, progression visible, idéal mobile |
| Navigation entre étapes | Indicateur d'étapes 1→2 (points + ligne de progression) | Clarté sur l'avancement du processus |
| Thème | Light/Dark selon `localStorage` `dony-theme` (déjà implémenté) | Cohérence avec le reste de l'app |
| Retour | Lien "← Accueil" vers `/` sur l'étape 1 · "← Changer de numéro" sur l'étape 2 | Navigation claire, ne piège pas l'utilisateur |

---

## 3. Structure des fichiers

```
app/
  pages/
    login.vue                              ← page principale (layout: auth)
  layouts/
    auth.vue                               ← modifié : split screen au lieu de carte centrée
  features/
    auth/
      components/
        LoginLeftPanel.vue                 ← nouveau : panneau gauche (mascotte + sécurité)
        PhoneNumberForm.vue                ← modifié : sélecteur pays + raccourcis
        OtpForm.vue                        ← modifié : 6 cases OTP individuelles
        CountrySelector.vue                ← nouveau : dropdown indicatifs pays
        OtpInput.vue                       ← nouveau : composant 6 cases
```

---

## 4. Layout — `auth.vue`

Le layout passe d'une simple div centrée à un split screen pleine hauteur.

```
┌─────────────────────────┬──────────────────────────┐
│   LoginLeftPanel        │   Formulaire (slot)       │
│   (50% ou 420px fixe)   │   (flex: 1)               │
│                         │                           │
│  Logo + badge PRO       │  [← Accueil]   [🌙]      │
│                         │                           │
│  Mascotte sécurisé.png  │  Titre + sous-titre        │
│  (200px, centrée)       │                           │
│                         │  Indicateur d'étapes      │
│  3 items de réassurance │  ──────────────────       │
│                         │  Formulaire               │
│                         │                           │
└─────────────────────────┴──────────────────────────┘
```

**`auth.vue` — structure :**
```vue
<template>
  <div class="min-h-screen flex">
    <LoginLeftPanel class="hidden lg:flex" />
    <div class="flex-1 flex flex-col justify-center px-8 py-12 relative bg-surface">
      <slot />
    </div>
  </div>
</template>
```

Le panneau gauche est masqué sous `lg` (< 1024px) — sur mobile, seul le formulaire est affiché.

---

## 5. Panneau gauche — `LoginLeftPanel.vue`

**Fond :** `bg-bg` avec 2 blobs glow en arrière-plan (primary 0.10 + accent 0.07, blur 60px).

**Contenu (flex-col, justify-between) :**

1. **Logo row (haut) :**
   - Texte "dony" en Hanken Grotesk 800
   - Badge pill "PRO" (couleur primary, background primary/15)

2. **Mascotte (centre, flex: 1) :**
   - `<img src="/mascots/securise.png" alt="Mascotte dony — sécurité vérifiée" />`
   - Taille : 200px width, object-fit: contain

3. **Liste de réassurance (bas) — 3 items :**

   | Icône | Titre | Sous-titre |
   |---|---|---|
   | 🔒 (bg primary/12) | Paiements sécurisés via Stripe | Fonds en séquestre jusqu'à la livraison confirmée |
   | ✓ (bg success/12) | Identité vérifiée (KYC) | Tous les membres sont validés avant d'accéder à la plateforme |
   | 📱 (bg accent/12) | Connexion par code SMS | Sans mot de passe — plus simple, plus sûr |

   Chaque item : `flex gap-3 p-3 rounded-card bg-surface-el border border-border`.

---

## 6. Indicateur d'étapes

Affiché dans le panneau droit, en haut du formulaire.

```
● ───── ○       (étape 1 : téléphone actif, SMS inactif)
● ───── ●       (étape 2 : téléphone done en vert, SMS actif en bleu)
```

- Point actif : `bg-primary text-white`
- Point complété : `bg-success/20 text-success` + icône ✓
- Point inactif : `bg-surface-el border border-border text-subtle`
- Ligne de connexion : `bg-border` → `bg-primary` quand étape 2

Passé en prop depuis `login.vue` : `:step="step"` (`'phone' | 'otp'`).

---

## 7. Formulaire téléphone — `PhoneNumberForm.vue` (modifié)

**Sélecteur de pays + champ numéro :**

```
┌──────────┬────────────────────────────┐
│ 🇫🇷 +33 ▾│  6 12 34 56 78            │
└──────────┴────────────────────────────┘
```

- Le sélecteur ouvre `CountrySelector.vue` (dropdown).
- Le champ accepte uniquement les chiffres (sans indicatif).
- À la soumission : concaténation `dialCode + localNumber` → envoi à `sendOtp()`.

**Raccourcis pays (chips) :**

```
[🇫🇷 France]  [🇸🇳 Sénégal]  [🇨🇮 Côte d'Ivoire]  [🇲🇱 Mali]
```

- Cliquer sur un raccourci met à jour le sélecteur et focus le champ numéro.
- Le pays actif a un style `border-primary bg-primary/10 text-primary`.

**`CountrySelector.vue` — données :**
```ts
const COUNTRIES = [
  { code: 'FR', flag: '🇫🇷', name: 'France',        dial: '+33'  },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',       dial: '+221' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire", dial: '+225' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',          dial: '+223' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroun',      dial: '+237' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinée',        dial: '+224' },
]
```

**Validation :** le numéro local doit contenir 7 à 12 chiffres. La regex finale appliquée au numéro complet : `/^\+\d{8,15}$/`.

**CTA :** bouton primary pleine largeur "Recevoir le code par SMS →".

---

## 8. Formulaire OTP — `OtpInput.vue` (nouveau composant)

6 cases individuelles `<input>` de type `text`, `inputmode="numeric"`, `maxlength="1"`.

**Comportement :**
- Focus avance automatiquement après chaque chiffre saisi.
- Backspace sur une case vide recule le focus à la case précédente.
- Coller (paste) distribue les chiffres dans les cases.
- Auto-complétion SMS (OTP via `autocomplete="one-time-code"` sur la première case).

**Visuel :**
- Case inactive : `border-border bg-surface-el`
- Case active (focus) : `border-primary ring-2 ring-primary/15`
- Case remplie : `border-primary bg-surface-el text-text font-bold`
- Barre de progression sous les cases : `width = (filledCount / 6) * 100%`, couleur primary.

**Props/emits :**
```ts
const emit = defineEmits<{ complete: [code: string] }>()
```
Émet `complete` avec le code complet dès que les 6 cases sont remplies.

**`OtpForm.vue` (modifié) :** utilise `OtpInput` et écoute `@complete` pour déclencher `submit()` automatiquement.

---

## 9. Éléments communs au panneau droit

**Lien retour (top-left) :**
- Étape `phone` : "← Accueil" → `navigateTo('/')`
- Étape `otp` : "← Changer de numéro" → revient à l'étape `phone`

**Bouton ThemeToggle (top-right) :**
- Composant `ThemeToggle.vue` déjà implémenté, réutilisé tel quel.

**Message d'aide (bas du formulaire, étape `phone`) :**
```
Pas encore de compte ? Télécharge l'app dony pour créer ton profil.
```

---

## 10. Responsive

| Breakpoint | Comportement |
|---|---|
| `< 1024px` | Panneau gauche masqué (`hidden lg:flex`). Le formulaire occupe toute la largeur. Logo dony PRO affiché en haut du formulaire à la place. |
| `≥ 1024px` | Split screen complet. |

---

## 11. Accessibilité

- `aria-label` sur chaque case OTP : "Chiffre 1 sur 6", etc.
- `aria-live="polite"` sur les messages d'erreur.
- Focus visible sur tous les éléments interactifs (outline primary).
- `autocomplete="one-time-code"` pour l'auto-complétion SMS.

---

## 12. Ce qui n'est pas dans ce spec

- **Autres pays** : la liste peut être étendue plus tard. Les 6 pays définis couvrent le MVP.
- **Biométrie / magic link** : connexion par téléphone uniquement pour le MVP.
- **Animation d'entrée** : transitions de page optionnelles en phase polish.
