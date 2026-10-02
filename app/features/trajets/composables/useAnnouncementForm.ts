import { reactive, computed, ref, watch } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import { useCommissionRate, FALLBACK_COMMISSION_RATE } from '@/composables/useCommissionRate'
import { usePreferencesStore } from '@/stores/preferences'
import { addDaysToDateInput, arrivalDateError, daysBetweenDateInputs, deadlineToIso, MAX_ARRIVAL_DAYS_AFTER_DEPARTURE } from '@/lib/dates'
import { defaultPricePerKg, normalizeCurrency, paymentMethodsFor, roundToCurrency } from '@/lib/money'
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

// Convertit un ISO UTC ("2026-06-01T18:00:00.000Z") en valeur locale pour
// <input type="date"> ("2026-06-01"). null → chaîne vide.
function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function useAnnouncementForm() {
  // Devise active du voyageur : c'est celle dans laquelle le backend publie un
  // trajet quand le client n'en impose pas. « EUR » en dur publiait en euros
  // le trajet d'un voyageur en francs CFA.
  const prefs = usePreferencesStore()
  const form = reactive<AnnouncementFormData>({
    departureCity: null,
    departureTime: '',
    arrivalCity: null,
    arrivalTime: '',
    arrivalDate: '',
    departureDate: '',
    transportMode: null,
    pickupPlace: null,
    dropoffPlace: null,
    availableWeightKg: 15,
    capacityUnit: 'SUITCASE_23KG' as CapacityUnit,
    pricingMode: 'KG',
    negotiable: false,
    currency: prefs.currency,
    pricePerKg: defaultPricePerKg(prefs.currency),
    acceptedCategories: [],
    refusedCategories: [],
    senderNote: '',
    cashAccepted: false,
    handoverDeadline: '',
  })

  const commissionRate = ref(FALLBACK_COMMISSION_RATE)
  const { getRate } = useCommissionRate()
  // Chargement non bloquant : le fallback s'affiche puis le taux réel prend le relais.
  getRate().then((rate) => {
    commissionRate.value = rate
  })

  // Un modèle ou un trajet en édition fixe sa propre devise : la devise active
  // ne l'écrase pas quand elle arrive après coup.
  let currencyPinned = false
  prefs.load().then((code) => {
    if (currencyPinned) return
    const untouchedPrice = form.pricePerKg === defaultPricePerKg(form.currency)
    form.currency = code
    if (untouchedPrice) form.pricePerKg = defaultPricePerKg(code)
  })

  const currency = computed(() => form.currency)

  const netPrice = computed(
    () => roundToCurrency(form.pricePerKg * (1 - commissionRate.value), form.currency),
  )

  const svc = tripsService()

  // Un modèle porte un décalage de jours (vol de nuit), pas une date : on l'applique
  // à la date d'arrivée dès que le voyageur choisit sa date de départ.
  let pendingArrivalOffset = 0
  watch(() => form.departureDate, (date) => {
    if (date && pendingArrivalOffset > 0 && !form.arrivalDate) {
      form.arrivalDate = addDaysToDateInput(date, pendingArrivalOffset)
    }
  })

  /** Décalage départ → arrivée en jours (0 à 3), repli sur celui du modèle appliqué. */
  function currentArrivalDayOffset(): number {
    if (form.departureDate && form.arrivalDate) {
      const days = daysBetweenDateInputs(form.departureDate, form.arrivalDate)
      return Math.min(Math.max(days, 0), MAX_ARRIVAL_DAYS_AFTER_DEPARTURE)
    }
    return pendingArrivalOffset
  }

  function validate(): ValidationErrors {
    const errors: ValidationErrors = {}
    if (!form.departureCity) errors.departureCity = 'Ville de départ requise'
    if (!form.arrivalCity) errors.arrivalCity = "Ville d'arrivée requise"
    if (!form.departureDate) errors.departureDate = 'Date de départ requise'
    const arrivalError = arrivalDateError(form.departureDate, form.departureTime, form.arrivalDate, form.arrivalTime)
    if (arrivalError) errors.arrivalDate = arrivalError
    if (!form.transportMode) errors.transportMode = 'Mode de transport requis'
    if (!form.pickupPlace) errors.pickupPlace = 'Lieu de remise requis'
    if (!form.dropoffPlace) errors.dropoffPlace = 'Lieu de récupération requis'

    if (!form.handoverDeadline) {
      errors.handoverDeadline = 'La date limite de dépôt est obligatoire'
    } else if (form.departureDate && form.handoverDeadline > form.departureDate) {
      errors.handoverDeadline = 'La date limite de dépôt doit précéder le départ'
    }

    return errors
  }

  function buildPayload(): CreateAnnouncementPayload {
    const pickup = form.pickupPlace!
    const dropoff = form.dropoffPlace!
    // Rails de la devise du trajet : carte hors zone CFA, mobile money et espèces
    // en zone CFA ; le backend refuse la carte en francs CFA et n'accepte plus
    // les anciens rails Wave et Orange Money.
    const paymentMethods = paymentMethodsFor(form.currency, { cash: form.cashAccepted })
    return {
      departureCity: form.departureCity!.label,
      arrivalCity: form.arrivalCity!.label,
      departureDate: form.departureDate,
      departureTime: form.departureTime || null,
      arrivalTime: form.arrivalTime || null,
      arrivalDate: form.arrivalDate || null,
      transportMode: form.transportMode!,
      pickupAddress: { label: pickup.label, lat: pickup.lat, lng: pickup.lng },
      deliveryAddress: { label: dropoff.label, lat: dropoff.lat, lng: dropoff.lng },
      availableKg: form.availableWeightKg,
      capacityUnit: form.capacityUnit,
      pricingMode: form.pricingMode,
      negotiable: form.negotiable,
      currency: form.currency,
      pricePerKg: form.pricePerKg,
      description: form.senderNote || null,
      acceptedContentTypes: form.acceptedCategories,
      refusedTypes: form.refusedCategories,
      acceptedPaymentMethods: paymentMethods,
      handoverDeadline: deadlineToIso(
        form.handoverDeadline,
        form.departureDate,
        form.departureTime,
      ),
    }
  }

  async function submit(status: 'DRAFT' | 'PUBLISHED'): Promise<Trip> {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      throw new Error('Formulaire invalide')
    }
    return svc.createAnnouncement(buildPayload(), { saveAsDraft: status === 'DRAFT' })
  }

  async function submitEdit(tripId: string, status: 'DRAFT' | 'PUBLISHED'): Promise<Trip> {
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      throw new Error('Formulaire invalide')
    }
    const updated = await svc.updateAnnouncement(tripId, buildPayload())
    if (status === 'PUBLISHED' && updated.status === 'DRAFT') {
      return svc.publishAnnouncement(tripId)
    }
    return updated
  }

  function applyTemplate(trip: Trip): void {
    form.departureCity = trip.departureCity
    form.arrivalCity = trip.arrivalCity
    form.departureDate = ''
    form.departureTime = trip.departureTime ?? ''
    form.arrivalTime = trip.arrivalTime ?? ''
    // La date de départ est ressaisie : on garde le décalage de l'arrivée pour la recaler.
    form.arrivalDate = ''
    pendingArrivalOffset = trip.arrivalDate
      ? Math.max(0, daysBetweenDateInputs(trip.departureDate, trip.arrivalDate))
      : 0
    form.transportMode = trip.transportMode
    form.pickupPlace = trip.pickupPlace
    form.dropoffPlace = trip.dropoffPlace
    form.availableWeightKg = trip.availableWeightKg
    form.capacityUnit = trip.capacityUnit ?? 'SUITCASE_23KG'
    form.pricingMode = trip.pricingMode ?? 'KG'
    form.negotiable = trip.negotiable ?? false
    form.currency = normalizeCurrency(trip.currency)
    currencyPinned = true
    form.pricePerKg = trip.pricePerKg
    form.acceptedCategories = [...trip.acceptedCategories]
    form.refusedCategories = [...trip.refusedCategories]
    form.senderNote = trip.senderNote ?? ''
    form.cashAccepted = trip.cashAccepted
    form.handoverDeadline = isoToDateInput(trip.handoverDeadline)
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
    if ('pricingMode' in t) form.pricingMode = t.pricingMode
    if ('negotiable' in t) form.negotiable = t.negotiable
    if ('currency' in t && t.currency) {
      form.currency = normalizeCurrency(t.currency)
      currencyPinned = true
    }
    if ('refusedCategories' in t) form.refusedCategories = [...t.refusedCategories]
    if ('handoverDeadline' in t) form.handoverDeadline = isoToDateInput(t.handoverDeadline)
    if ('cashAccepted' in t) form.cashAccepted = t.cashAccepted
    if ('arrivalTime' in t) form.arrivalTime = t.arrivalTime ?? ''
    pendingArrivalOffset = 'arrivalDayOffset' in t ? (t.arrivalDayOffset ?? 0) : 0
    form.arrivalDate = ''
    if (pendingArrivalOffset > 0 && form.departureDate) {
      form.arrivalDate = addDaysToDateInput(form.departureDate, pendingArrivalOffset)
    }
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
      pricingMode: form.pricingMode,
      negotiable: form.negotiable,
      currency: form.currency,
      acceptedCategories: [...form.acceptedCategories],
      refusedCategories: [...form.refusedCategories],
      cashAccepted: form.cashAccepted,
      handoverDeadline: form.handoverDeadline || null,
      arrivalTime: form.arrivalTime || null,
      arrivalDayOffset: currentArrivalDayOffset(),
    }
  }

  return { form, currency, netPrice, commissionRate, validate, submit, submitEdit, applyTemplate, applyQuickTemplate, buildTemplatePayload }
}
