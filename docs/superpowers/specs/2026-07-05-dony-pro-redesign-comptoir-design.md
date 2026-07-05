# dony PRO — Redesign « Comptoir » (design spec)

**Date** : 2026-07-05
**Statut** : validé (direction + accent + typo + découpage)
**Direction retenue** : *Comptoir* — famille financier/raffiné, inspiration Stripe.

## Problème

L'UI actuelle de dony PRO lit « générique / IA slop » : une seule string de card
(`bg-surface border border-border rounded-card p-5`) copiée partout, shadcn brut,
bleu SaaS générique `#0B5FFF`, emoji en guise d'icônes, landing pleine de clichés
(blobs floutés, hero dégradé, mascottes, features en zig-zag), élévation plate,
aucune hiérarchie typographique, pas de `tabular-nums` sur les montants, motion
limitée au hover. Cf. audit visuel du 2026-07-05.

## Objectif

Un système visuel distinctif, épuré et pro — outil financier crédible (il manipule
des fonds en séquestre). Surfaces qui flottent (ombres douces en couches), coins
généreusement arrondis, respiration, un seul accent bleu approfondi, chiffres
monospace tabular, motion sobre, zéro emoji décoratif.

---

## Système de design « Comptoir »

### Couleur (tokens CSS custom properties)

Neutres tièdes (choisis, pas un gris plat par défaut).

**Light**
| Token | Hex |
|---|---|
| `--bg` | `#FAFAF9` |
| `--surface` | `#FFFFFF` |
| `--surface-el` | `#F5F4F1` |
| `--border` | `#ECEBE7` |
| `--border-strong` | `#DEDCD6` |
| `--text` | `#17181C` |
| `--muted` | `#5B606C` |
| `--subtle` | `#8A8E98` |
| `--primary` (accent) | `#1E49C7` |
| `--primary-hover` | `#1A3FAD` |
| `--success` | `#1B7A57` |
| `--warning` | `#A9781E` |
| `--danger` | `#A83A32` |

**Dark**
| Token | Hex |
|---|---|
| `--bg` | `#0C0D10` |
| `--surface` | `#15171C` |
| `--surface-el` | `#1B1E24` |
| `--border` | `#23262D` |
| `--border-strong` | `#2E323A` |
| `--text` | `#F3F2EF` |
| `--muted` | `#A0A4AD` |
| `--subtle` | `#71757E` |
| `--primary` | `#6E93FF` |
| `--primary-hover` | `#8AA8FF` |
| `--success` | `#3FB488` |
| `--warning` | `#E0A94A` |
| `--danger` | `#E5695F` |

Règles : l'accent `--primary` est **le seul** bleu de marque ; la couleur
sémantique (success/warning/danger) est distincte et ne sert jamais d'accent.
Chaque token expose une variante `--*-rgb` (canaux) pour les modificateurs
d'opacité Tailwind, comme aujourd'hui. On **supprime** l'ancien `--accent`
terracotta (plus utilisé après refonte landing).

### Typographie

Familles auto-hébergées (pas de CDN) :
- **Geist Sans** — UI, titres, corps. Weights 400/500/600/700.
- **Geist Mono** — tous les chiffres (montants, poids, dates, tabular-nums),
  labels de données, code.

Chargement : polices installées via package (`geist` npm ou fichiers woff2 dans
`public/fonts/`), déclarées en `@font-face` dans `assets/css/main.css`. On retire
l'`@import` Google Fonts (Hanken/Plus Jakarta).

Échelle de type (rem base 16) :
| Rôle | Taille / poids / tracking |
|---|---|
| Titre page (`h1`) | 28px / 600 / -0.02em |
| Titre section (`h2`) | 20px / 600 / -0.01em |
| Section-label (eyebrow) | 11px / 650 / uppercase, +0.12em |
| Valeur KPI | 24px / 640 / mono tabular |
| Corps | 14px / 400 |
| Petit / meta | 12px / mono pour les chiffres |

`font-variant-numeric: tabular-nums` sur toute donnée chiffrée alignée.
`text-wrap: balance` sur les titres.

### Surfaces & élévation (la signature)

Ombres en 2 couches :
```
--elev-card:  0 1px 2px rgba(20,25,45,.06), 0 12px 28px -12px rgba(20,25,45,.18);
--elev-btn:   0 1px 2px rgba(30,73,199,.25);
--elev-pop:   0 2px 4px rgba(20,25,45,.08), 0 20px 40px -16px rgba(20,25,45,.24);
```
Dark : mêmes formes, `rgba(0,0,0,.4/.55)`.

Rayons : `--r-card: 16px`, `--r-el: 12px`, `--r-btn: 12px`, `--r-input: 10px`,
`--r-pill: 999px`. (On garde `sheet: 24px`.)

Cartes : bordure quasi invisible (`--border` à faible contraste) + ombre portée
→ elles « flottent ». Hover = léger lift (translate -1px + ombre renforcée).

Rythme d'espace : blocs de section espacés à 26px, padding cartes 18–20px,
gap KPI 14px. Généreux, pas serré.

### Motion

Sobre, au service de la lecture :
- Entrée de page / listes : fondu + montée 8px, 150ms, stagger 30ms.
- Hover cartes/boutons : micro-lift 120ms.
- Transitions de statut (pill qui change) : cross-fade 150ms.
- Respecte `prefers-reduced-motion: reduce` (désactive translate/stagger).

### Iconographie

`lucide-vue-next` (déjà présent), trait, 16–18px, jamais dans des pastilles
colorées. **Fin des emoji** dans headings, bullets, empty states, trust chips.

---

## Primitives UI (Phase 1 — fondations)

Nouvelles/refondues dans `app/components/ui/` :

1. **`Card`** — `Card`, `CardHeader`, `CardTitle`, `CardBody`, `CardFooter`.
   Remplace la string copiée partout. Props : `elevated` (ombre) vs `flat` (filet).
2. **`StatTile`** — label + valeur mono tabular + delta (▲/▼ sémantique) + sparkline
   optionnel. Utilisé par le cockpit.
3. **`Badge`** (statut/pill) — variantes `info | success | warning | danger | neutral`,
   point coloré + fond teinté 8–12%. Remplace les pills ad-hoc.
4. **`Button`** — refonte du cva : élévation `--elev-btn` sur `default`, focus ring
   2px offset soigné, rayon 12px. Variantes `default | ghost | outline | subtle`.
5. **`Input` / `Field`** — rayon 10px, focus ring accent, label + hint + erreur.
6. **`DataTable`** (léger) — en-têtes uppercase tracked, colonnes `.num`
   right-aligned mono tabular, lignes à filet, hover ligne.
7. **`EmptyState`** — icône lucide en trait + titre + texte + action. Zéro emoji.
8. **`SectionLabel`** — eyebrow réutilisable.

Tokens exposés en classes Tailwind (config étendue) : `rounded-card/el/btn/input`,
`shadow-card/pop`, couleurs via CSS-vars existantes.

---

## Découpage (3 phases, 3 specs/plans)

### Phase 1 — Fondations *(cette spec, priorité)*
- Tokens couleur/typo/ombre/radius dans `main.css` + `tailwind.config.ts`.
- Polices Geist auto-hébergées.
- Primitives UI ci-dessus + tests (vitest + éventuels snapshots).
- Une page « kitchen sink » interne (`/design`) montrant toutes les primitives
  clair/sombre, pour revue visuelle.
- **Sortie** : le back-office continue de marcher (primitives adoptées progressivement).

### Phase 2 — Back-office
Appliquer les primitives écran par écran, dans l'ordre :
cockpit → trajets → colis → demandes → négociations → activité → automations.
Layout (sidebar/topbar) rafraîchi. Suppression des strings de card ad-hoc,
des emoji, des hex en dur. Chiffres → mono tabular partout.

### Phase 3 — Landing
Refonte marketing : virer blobs/mascottes/hero-dégradé/zig-zag/emoji.
Hero éditorial (thèse : « expédiez avec les voyageurs, en toute confiance »),
preuve produit réelle (capture cockpit redesignée), sections sobres.

---

## Tests & qualité

- `pnpm test` (vitest) vert ; nouveaux tests unitaires pour chaque primitive
  (rendu variantes, classes, a11y focus).
- `pnpm lint` vert.
- Contraste AA sur texte/accent, clair **et** sombre.
- `prefers-reduced-motion` respecté.
- Pas de régression fonctionnelle (les écrans font toujours ce qu'ils faisaient).

## Non-objectifs

- Pas de changement de logique métier / API / routing.
- Pas de nouvelle feature produit.
- La palette terracotta d'origine est abandonnée (plus de double-accent).
