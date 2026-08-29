import {
  LayoutDashboard, Route, Repeat, Bot, BellRing, Calculator, Table2,
  PackageSearch, Handshake, MessagesSquare, Package, Scale, Activity,
  UserRound, Gift, BellDot,
  type LucideIcon,
} from 'lucide-vue-next'

export interface ProOfferItem {
  label: string
  detail: string
}

export interface ProOfferGroup {
  key: string
  icon: LucideIcon
  title: string
  summary: string
  items: ProOfferItem[]
}

/**
 * Le catalogue PRO, énoncé depuis ce que l'abonnement ouvre réellement.
 *
 * Chaque entrée correspond à une page du portail gardée par `middleware/pro-only`, et
 * porte le libellé exact de la barre latérale : la page de vente et le produit livré
 * doivent nommer les mêmes choses, sinon la promesse et l'usage divergent dès la première
 * minute. Ajouter une entrée sans page derrière serait une promesse creuse — la garde est
 * le test `proOffer.spec.ts`, qui compare cette liste aux libellés de `AppSidebar`.
 */
export const PRO_OFFER: readonly ProOfferGroup[] = [
  {
    key: 'piloter',
    icon: LayoutDashboard,
    title: 'Piloter',
    summary: 'Une vue d\'ensemble de ton activité, chiffrée et à jour.',
    items: [
      { label: 'Centre de commandes', detail: 'Revenus, colis en cours et alertes sur un seul écran' },
      { label: 'Mon Activité', detail: 'Historique complet de tes trajets et de tes gains' },
      { label: 'Notifications', detail: 'Ce qui demande ton attention, trié par urgence' },
    ],
  },
  {
    key: 'publier',
    icon: Route,
    title: 'Publier et tarifer',
    summary: 'Mets tes trajets en ligne vite, et au bon prix.',
    items: [
      { label: 'Mes Trajets', detail: 'Publication, modification et suivi depuis un grand écran' },
      { label: 'Trajets récurrents', detail: 'Un trajet qui revient se publie une fois, pas dix' },
      { label: 'Grille tarifaire', detail: 'Tes tarifs par corridor, appliqués automatiquement' },
      { label: 'Assistant de prix', detail: 'Le prix pratiqué sur ton corridor, avant de publier' },
    ],
  },
  {
    key: 'negocier',
    icon: Handshake,
    title: 'Trouver et négocier',
    summary: 'Les bons expéditeurs viennent à toi, la négociation reste chez toi.',
    items: [
      { label: 'Demandes compatibles', detail: 'Les colis qui correspondent à ton trajet, sans chercher' },
      { label: 'Alertes corridor', detail: 'Prévenu dès qu\'une demande s\'ouvre sur ta ligne' },
      { label: 'Négociations', detail: 'Contre-propositions suivies, sans perdre le fil' },
      { label: 'Messagerie', detail: 'Toutes tes conversations au clavier, pas au pouce' },
    ],
  },
  {
    key: 'suivre',
    icon: Package,
    title: 'Automatiser et suivre',
    summary: 'Le travail répétitif se fait sans toi, le reste se règle proprement.',
    items: [
      { label: 'Automatisations', detail: 'Des règles qui acceptent ou refusent à ta place' },
      { label: 'Mes Colis', detail: 'Chaque colis, son statut et sa preuve de remise' },
      { label: 'Litiges', detail: 'Un dossier structuré quand ça se passe mal' },
      { label: 'Mon profil public', detail: 'La page que voient les expéditeurs avant de te confier un colis' },
      { label: 'Parrainage', detail: 'Tes invitations et ce qu\'elles t\'ont rapporté' },
    ],
  },
]

/** Icônes par entrée, pour les listes qui en affichent une par ligne. */
export const PRO_ITEM_ICONS: Record<string, LucideIcon> = {
  'Centre de commandes': LayoutDashboard,
  'Mon Activité': Activity,
  'Notifications': BellDot,
  'Mes Trajets': Route,
  'Trajets récurrents': Repeat,
  'Grille tarifaire': Table2,
  'Assistant de prix': Calculator,
  'Demandes compatibles': PackageSearch,
  'Alertes corridor': BellRing,
  'Négociations': Handshake,
  'Messagerie': MessagesSquare,
  'Automatisations': Bot,
  'Mes Colis': Package,
  'Litiges': Scale,
  'Mon profil public': UserRound,
  'Parrainage': Gift,
}
