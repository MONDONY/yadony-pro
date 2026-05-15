import { reactive, computed } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import type {
  AnnouncementFormData,
  ValidationErrors,
  Trip,
  CreateAnnouncementPayload,
} from '@/features/trajets/types/index'

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

  async function submit(status: 'DRAFT' | 'PUBLISHED'): Promise<Trip> {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      throw new Error('Formulaire invalide')
    }

    const dep = form.departureCity!
    const arr = form.arrivalCity!
    const pickup = form.pickupPlace!
    const dropoff = form.dropoffPlace!

    const payload: CreateAnnouncementPayload = {
      departureCityId: dep.placeId,
      departureCityLabel: dep.label,
      departureLat: dep.lat,
      departureLng: dep.lng,
      arrivalCityId: arr.placeId,
      arrivalCityLabel: arr.label,
      arrivalLat: arr.lat,
      arrivalLng: arr.lng,
      departureDate: form.departureDate,
      departureTime: form.departureTime || null,
      arrivalTime: form.arrivalTime || null,
      transportMode: form.transportMode!,
      pickupPlaceId: pickup.placeId,
      pickupPlaceLabel: pickup.label,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffPlaceId: dropoff.placeId,
      dropoffPlaceLabel: dropoff.label,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      availableWeightKg: form.availableWeightKg,
      pricePerKg: form.pricePerKg,
      acceptedCategories: form.acceptedCategories,
      refusedCategories: form.refusedCategories,
      senderNote: form.senderNote || null,
      cashAccepted: form.cashAccepted,
      status,
    }

    return svc.createAnnouncement(payload)
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
    form.pricePerKg = trip.pricePerKg
    form.acceptedCategories = [...trip.acceptedCategories]
    form.refusedCategories = [...trip.refusedCategories]
    form.senderNote = trip.senderNote ?? ''
    form.cashAccepted = trip.cashAccepted
  }

  return { form, netPrice, validate, submit, applyTemplate }
}
