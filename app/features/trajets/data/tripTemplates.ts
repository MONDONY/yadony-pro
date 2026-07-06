// app/features/trajets/data/tripTemplates.ts
import type { CapacityUnit, SelectedPlace, TransportMode } from '@/features/trajets/types/index'

export interface TripTemplate {
  id: string
  label: string
  emoji: string
  departureCity: SelectedPlace
  arrivalCity: SelectedPlace
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableWeightKg: number
  pricePerKg: number
  acceptedCategories: string[]
}

function city(label: string, lat: number, lng: number): SelectedPlace {
  return { placeId: '', label, lat, lng }
}

const PARIS = city('Paris', 48.8566, 2.3522)
const LYON = city('Lyon', 45.764, 4.8357)
const MARSEILLE = city('Marseille', 43.2965, 5.3698)

const DEFAULT_CATEGORIES = ['Vêtements', 'Documents', 'Cosmétiques']

/**
 * Modèles de trajet prédéfinis : corridor + transport + capacité + prix + contenu.
 * La date et les adresses de remise/récupération restent à compléter (personnelles).
 */
export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'paris-dakar',
    label: 'Paris → Dakar',
    emoji: '🇸🇳',
    departureCity: PARIS,
    arrivalCity: city('Dakar', 14.7167, -17.4677),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 8,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-abidjan',
    label: 'Paris → Abidjan',
    emoji: '🇨🇮',
    departureCity: PARIS,
    arrivalCity: city('Abidjan', 5.36, -4.0083),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 8,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-bamako',
    label: 'Paris → Bamako',
    emoji: '🇲🇱',
    departureCity: PARIS,
    arrivalCity: city('Bamako', 12.6392, -8.0029),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 8,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-conakry',
    label: 'Paris → Conakry',
    emoji: '🇬🇳',
    departureCity: PARIS,
    arrivalCity: city('Conakry', 9.6412, -13.5784),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 9,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-douala',
    label: 'Paris → Douala',
    emoji: '🇨🇲',
    departureCity: PARIS,
    arrivalCity: city('Douala', 4.0511, 9.7679),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 9,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'lyon-abidjan',
    label: 'Lyon → Abidjan',
    emoji: '🇨🇮',
    departureCity: LYON,
    arrivalCity: city('Abidjan', 5.36, -4.0083),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 8,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'marseille-dakar',
    label: 'Marseille → Dakar',
    emoji: '🇸🇳',
    departureCity: MARSEILLE,
    arrivalCity: city('Dakar', 14.7167, -17.4677),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 8,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-ouagadougou',
    label: 'Paris → Ouagadougou',
    emoji: '🇧🇫',
    departureCity: PARIS,
    arrivalCity: city('Ouagadougou', 12.3714, -1.5197),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 9,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-yaounde',
    label: 'Paris → Yaoundé',
    emoji: '🇨🇲',
    departureCity: PARIS,
    arrivalCity: city('Yaoundé', 3.848, 11.5021),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 9,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
  {
    id: 'paris-kinshasa',
    label: 'Paris → Kinshasa',
    emoji: '🇨🇩',
    departureCity: PARIS,
    arrivalCity: city('Kinshasa', -4.4419, 15.2663),
    transportMode: 'PLANE',
    capacityUnit: 'SUITCASE_23KG',
    availableWeightKg: 23,
    pricePerKg: 10,
    acceptedCategories: DEFAULT_CATEGORIES,
  },
]
