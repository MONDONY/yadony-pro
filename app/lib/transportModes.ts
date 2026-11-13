import { Plane, Ship, Car, Route } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { TransportMode } from '@/features/trajets/types/index'

/**
 * La création et l'édition de trajets bateau dans Yadony Pro arrivent avec le lot 5
 * (m³, fourchette d'arrivée, paiement au dépôt). Tant que ce drapeau est faux, le bateau
 * n'est jamais proposé, même interrupteur serveur allumé.
 */
export const PRO_BOAT_TRIP_CREATION_READY = false

export const BOAT_NOT_VERIFIED_MESSAGE =
  'Le bateau est réservé aux entreprises et aux transporteurs vérifiés.'

/** Profil du transporteur tel que lu sur `/auth/me`. */
export interface CarrierProfile {
  gpPro: boolean
  proAccount: boolean
}

/** Transporteur vérifié = badge GP Pro ou compte PRO (même règle que le back). */
export function isVerifiedCarrier(profile: CarrierProfile | null | undefined): boolean {
  return !!profile && (profile.gpPro === true || profile.proAccount === true)
}

export interface TransportModesFlags {
  road: boolean
  boat: boolean
}

/** Ordre d'affichage des puces : Avion, Bateau, Route, puis Train, Autre. */
const DISPLAY_ORDER: TransportMode[] = ['PLANE', 'BOAT', 'CAR', 'BUS', 'TRAIN', 'OTHER']

export function transportModeLabel(mode: string | null | undefined): string {
  if (mode === null || mode === undefined) return 'Peu importe'
  switch (mode) {
    case 'PLANE':
      return 'Avion'
    case 'BOAT':
      return 'Bateau'
    case 'CAR':
    case 'BUS':
      return 'Route'
    case 'TRAIN':
      return 'Train'
    case 'OTHER':
      return 'Autre'
    default:
      return 'Transport'
  }
}

/** Icône du mode ; `Route` (icône neutre « trajet ») pour train, autre, absent ou inconnu. Jamais l'avion par défaut. */
export function transportModeIcon(mode: string | null | undefined): Component {
  switch (mode) {
    case 'PLANE':
      return Plane
    case 'BOAT':
      return Ship
    case 'CAR':
    case 'BUS':
      return Car
    default:
      return Route
  }
}

export function isRoad(mode: string | null | undefined): boolean {
  return mode === 'CAR' || mode === 'BUS'
}

/** Pourquoi le bateau ne peut pas être choisi, ou null s'il le peut. */
export function boatBlockedReason(
  flags: TransportModesFlags,
  profile: CarrierProfile | null | undefined,
): string | null {
  if (!flags.boat) return "Le mode Bateau n'est pas encore ouvert."
  if (!isVerifiedCarrier(profile)) return BOAT_NOT_VERIFIED_MESSAGE
  return null
}

/** Modes que l'on peut choisir à la création. Avion toujours, Route si ouverte, Bateau si ouvert et transporteur vérifié. */
export function proposableModes(flags: TransportModesFlags, profile?: CarrierProfile | null): TransportMode[] {
  const modes: TransportMode[] = ['PLANE']
  if (flags.road) modes.push('CAR')
  if (flags.boat && PRO_BOAT_TRIP_CREATION_READY && isVerifiedCarrier(profile)) modes.push('BOAT')
  return sortModes(modes)
}

/** Modes proposables plus le mode courant d'un trajet existant, afin qu'il reste affiché et renvoyé tel quel. */
export function chipModes(
  flags: TransportModesFlags,
  current: TransportMode | null,
  profile?: CarrierProfile | null,
): TransportMode[] {
  const modes = proposableModes(flags, profile)
  if (current && !modes.includes(current)) modes.push(current)
  return sortModes(modes)
}

function sortModes(modes: TransportMode[]): TransportMode[] {
  return [...modes].sort((a, b) => DISPLAY_ORDER.indexOf(a) - DISPLAY_ORDER.indexOf(b))
}
