// app/features/search/types/index.ts

export type SearchResultType = 'colis' | 'trajet' | 'tracking' | 'navigation'

export interface SearchResultItem {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  to: string
}

export interface GlobalSearchResults {
  colis: SearchResultItem[]
  trajets: SearchResultItem[]
  tracking: SearchResultItem | null
}

/** Raccourcis de navigation proposés dans la palette. */
export const NAV_SHORTCUTS: SearchResultItem[] = [
  { id: 'nav-cockpit', type: 'navigation', title: 'Cockpit', to: '/cockpit' },
  { id: 'nav-trajets', type: 'navigation', title: 'Trajets', to: '/trajets' },
  { id: 'nav-colis', type: 'navigation', title: 'Colis', to: '/colis' },
  { id: 'nav-demandes', type: 'navigation', title: 'Demandes', to: '/demandes' },
  { id: 'nav-negociations', type: 'navigation', title: 'Négociations', to: '/negociations' },
  { id: 'nav-messages', type: 'navigation', title: 'Messages', to: '/messages' },
  { id: 'nav-activite', type: 'navigation', title: 'Activité', to: '/activite' },
  { id: 'nav-notifications', type: 'navigation', title: 'Notifications', to: '/notifications' },
  { id: 'nav-tarifs', type: 'navigation', title: 'Grille tarifaire', to: '/tarifs' },
  { id: 'nav-assistant-prix', type: 'navigation', title: 'Assistant de prix', to: '/assistant-prix' },
  { id: 'nav-automatisations', type: 'navigation', title: 'Automatisations', to: '/automatisations' },
  { id: 'nav-recurrences', type: 'navigation', title: 'Récurrences', to: '/recurrences' },
  { id: 'nav-parametres', type: 'navigation', title: 'Paramètres', to: '/parametres' },
  { id: 'nav-parrainage', type: 'navigation', title: 'Parrainage', to: '/parrainage' },
  { id: 'nav-mon-profil', type: 'navigation', title: 'Mon profil', to: '/mon-profil' },
]
