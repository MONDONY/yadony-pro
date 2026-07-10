import { reactive, computed } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import type {
  AnnouncementFormData,
  ValidationErrors,
  Trip,
  CreateAnnouncementPayload,
  CapacityUnit,
  UserTripTemplate,
  SaveTripTemplatePayload,
} from '@/features/trajets/types/index'
import type { TripTemplate } from '@/features/trajets/data/tripTemplates'

export function useAnnouncementForm() {
  const form = reactive<AnnouncementFormData>({
    departureCity: null,
    departureTime: '',
    arrivalCity: null,
    arrivalTime: '',
    departureDate: '',
    transportMode: null,
    pickupPlace: null,
    dropoffPlace: null,
    availableWeightKg: 15,
    capacityUnit: 'SUITCASE_23KG' as CapacityUnit,
    pricePerKg: 7,
    acceptedCategories: [],
    refusedCategories: [],
    senderNote: '',
    cashAccepted: false,
  })

  const netPrice = computed(() => Math.round(form.pricePerKg * 0.88 * 100) / 100)

  const svc = tripsService()

  function validate(): ValidationErrors {
    const errors: ValidationErrors = {}
    if (!form.departureCity) errors.departureCity = 'Ville de départ requise'
    if (!form.arrivalCity) errors.arrivalCity = "Ville d'arrivée requise"
    if (!form.departureDate) errors.departureDate = 'Date de départ requise'
    if (!form.transportMode) errors.transportMode = 'Mode de transport requis'
    if (!form.pickupPlace) errors.pickupPlace = 'Lieu de remise requis'
    if (!form.dropoffPlace) errors.dropoffPlace = 'Lieu de récupération requis'
    return errors
  }

  function buildPayload(): CreateAnnouncementPayload {
    const pickup = form.pickupPlace!
    const dropoff = form.dropoffPlace!
    const paymentMethods: string[] = ['STRIPE']
    if (form.cashAccepted) paymentMethods.push('CASH')
    return {
      departureCity: form.departureCity!.label,
      arrivalCity: form.arrivalCity!.label,
      departureDate: form.departureDate,
      departureTime: form.departureTime || null,
      arrivalTime: form.arrivalTime || null,
      transportMode: form.transportMode!,
      pickupAddress: { label: pickup.label, lat: pickup.lat, lng: pickup.lng },
      deliveryAddress: { label: dropoff.label, lat: dropoff.lat, lng: dropoff.lng },
      availableKg: form.availableWeightKg,
      capacityUnit: form.capacityUnit,
      pricePerKg: form.pricePerKg,
      description: form.senderNote || null,
      acceptedContentTypes: form.acceptedCategories,
      refusedTypes: form.refusedCategories,
      acceptedPaymentMethods: paymentMethods,
    }
  }

  async function submit(_status: 'DRAFT' | 'PUBLISHED'): Promise<Trip> {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      throw new Error('Formulaire invalide')
    }
    return svc.createAnnouncement(buildPayload())
  }

  async function submitEdit(tripId: string): Promise<Trip> {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      throw new Error('Formulaire invalide')
    }
    return svc.updateAnnouncement(tripId, buildPayload())
  }

  function applyTemplate(trip: Trip): void {
    form.departureCity = trip.departureCity
    form.arrivalCity = trip.arrivalCity
    form.departureDate = ''
    form.departureTime = trip.departureTime ?? ''
    form.arrivalTime = trip.arrivalTime ?? ''
    form.transportMode = trip.transportMode
    form.pickupPlace = trip.pickupPlace
    form.dropoffPlace = trip.dropoffPlace
    form.availableWeightKg = trip.availableWeightKg
    form.capacityUnit = trip.capacityUnit ?? 'SUITCASE_23KG'
    form.pricePerKg = trip.pricePerKg
    form.acceptedCategories = [...trip.acceptedCategories]
    form.refusedCategories = [...trip.refusedCategories]
    form.senderNote = trip.senderNote ?? ''
    form.cashAccepted = trip.cashAccepted
  }

  /**
   * Pré-remplit le formulaire depuis un modèle prédéfini : corridor, transport,
   * capacité, prix et contenu accepté. Laisse la date et les adresses de remise/
   * récupération vides (personnelles au voyageur).
   */
  function applyQuickTemplate(t: TripTemplate | UserTripTemplate): void {
    form.departureCity = { ...t.departureCity }
    form.arrivalCity = { ...t.arrivalCity }
    form.transportMode = t.transportMode
    form.capacityUnit = t.capacityUnit
    form.availableWeightKg = t.availableWeightKg
    form.pricePerKg = t.pricePerKg
    form.acceptedCategories = [...t.acceptedCategories]
    if ('cashAccepted' in t) form.cashAccepted = t.cashAccepted
    if ('arrivalTime' in t) form.arrivalTime = t.arrivalTime ?? ''
  }

  /**
   * Construit le payload pour enregistrer le trajet courant comme modèle réutilisable.
   * Requiert au minimum les villes de départ et d'arrivée.
   */
  function buildTemplatePayload(label: string): SaveTripTemplatePayload {
    const dep = form.departureCity!
    const arr = form.arrivalCity!
    return {
      label,
      emoji: null,
      departureCity: dep.label,
      departureLat: dep.lat || null,
      departureLng: dep.lng || null,
      arrivalCity: arr.label,
      arrivalLat: arr.lat || null,
      arrivalLng: arr.lng || null,
      transportMode: form.transportMode ?? 'PLANE',
      capacityUnit: form.capacityUnit,
      availableKg: form.availableWeightKg,
      pricePerKg: form.pricePerKg,
      acceptedCategories: [...form.acceptedCategories],
      cashAccepted: form.cashAccepted,
      arrivalTime: form.arrivalTime || null,
    }
  }

  return { form, netPrice, validate, submit, submitEdit, applyTemplate, applyQuickTemplate, buildTemplatePayload }
}
