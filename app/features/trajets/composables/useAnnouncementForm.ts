import { reactive, computed, ref, watch } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import { useCommissionGrid } from '@/composables/useCommissionGrid'
import { minimumFor, type CommissionGrid } from '@/lib/commissionGrid'
import { usePreferencesStore } from '@/stores/preferences'
import { addDaysToDateInput, arrivalDateError, arrivalRangeError, daysBetweenDateInputs, deadlineToIso, MAX_TEMPLATE_ARRIVAL_OFFSET_DAYS } from '@/lib/dates'
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
    arrivalDateMax: '',
    departureDate: '',
    transportMode: null,
    pickupPlace: null,
    dropoffPlace: null,
    volumeCapacityM3: null,
    pricePerM3: null,
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

  // Grille de commission en vigueur, chargée sans bloquer le formulaire : sans
  // grille (ou back qui ne la sert pas), aucun minimum n'est annoncé.
  const commissionGrid = ref<CommissionGrid | null>(null)
  const { getGrid } = useCommissionGrid()
  getGrid().then((grid) => {
    commissionGrid.value = grid
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

  // Trajet bateau d'avant le lot 3 (au kilo, sans fourchette ni volume) : il reste modifiable
  // en kilos et la modification n'envoie aucun champ bateau, le back le laisse alors tel quel.
  const legacyBoat = ref(false)
  watch(() => form.transportMode, (mode) => {
    if (mode !== 'BOAT') legacyBoat.value = false
  }, { flush: 'sync' })
  const isLegacyBoatTrip = computed(() => form.transportMode === 'BOAT' && legacyBoat.value)
  /** Trajet vendu au m³ : bateau, hors trajet bateau d'avant le lot 3. */
  const isBoat = computed(() => form.transportMode === 'BOAT' && !legacyBoat.value)

  // Le prix au kilo saisi EST le net du voyageur : le backend le stocke tel quel et
  // les frais de service s'ajoutent côté expéditeur. Aucune conversion à faire ici.
  const netPrice = computed(() => roundToCurrency(form.pricePerKg, form.currency))

  /** Frais de service minimum dans la devise du trajet, `null` sans grille. */
  const minimumFee = computed(() => minimumFor(commissionGrid.value, form.currency))

  const svc = tripsService()

  // Un modèle porte un décalage de jours (arrivée un autre jour), pas une date : on l'applique
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
      return Math.min(Math.max(days, 0), MAX_TEMPLATE_ARRIVAL_OFFSET_DAYS)
    }
    return pendingArrivalOffset
  }

  function validate(): ValidationErrors {
    const errors: ValidationErrors = {}
    if (!form.departureCity) errors.departureCity = 'Ville de départ requise'
    if (!form.arrivalCity) errors.arrivalCity = "Ville d'arrivée requise"
    if (!form.departureDate) errors.departureDate = 'Date de départ requise'
    if (isBoat.value) {
      const rangeError = arrivalRangeError(form.departureDate, form.arrivalDate, form.arrivalDateMax, 'BOAT')
      if (rangeError) errors.arrivalDateMax = rangeError
      const volume = form.volumeCapacityM3
      if (volume === null || !Number.isFinite(volume) || volume < 0.1 || volume > 9999) {
        errors.volumeCapacityM3 = 'Volume requis, entre 0,1 et 9 999 m³'
      }
      const price = form.pricePerM3
      if (price === null || !Number.isFinite(price) || price < 0.01) {
        errors.pricePerM3 = 'Prix au m³ requis'
      }
    } else {
      const arrivalError = arrivalDateError(form.departureDate, form.departureTime, form.arrivalDate, form.arrivalTime, form.transportMode)
      if (arrivalError) errors.arrivalDate = arrivalError
    }
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
    const boat = isBoat.value
    const payload: CreateAnnouncementPayload = {
      departureCity: form.departureCity!.label,
      arrivalCity: form.arrivalCity!.label,
      departureDate: form.departureDate,
      departureTime: form.departureTime || null,
      arrivalTime: form.arrivalTime || null,
      arrivalDate: form.arrivalDate || null,
      transportMode: form.transportMode!,
      pickupAddress: { label: pickup.label, lat: pickup.lat, lng: pickup.lng },
      deliveryAddress: { label: dropoff.label, lat: dropoff.lat, lng: dropoff.lng },
      availableKg: boat ? null : form.availableWeightKg,
      // Au m³, l'unité de capacité est « kilo exact » : « kilo libre » est refusé avec un prix au m³.
      capacityUnit: boat ? 'KG_EXACT' : form.capacityUnit,
      pricingMode: boat ? 'KG' : form.pricingMode,
      negotiable: form.negotiable,
      currency: form.currency,
      pricePerKg: boat ? null : form.pricePerKg,
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
    if (boat) {
      payload.arrivalDateMax = form.arrivalDateMax
      payload.volumeCapacityM3 = form.volumeCapacityM3!
      payload.pricePerM3 = form.pricePerM3!
    }
    return payload
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
    form.arrivalDateMax = ''
    pendingArrivalOffset = trip.arrivalDate
      ? Math.max(0, daysBetweenDateInputs(trip.departureDate, trip.arrivalDate))
      : 0
    form.transportMode = trip.transportMode
    legacyBoat.value = trip.transportMode === 'BOAT'
      && trip.arrivalDateMax == null && trip.volumeCapacityM3 == null && trip.pricePerM3 == null
    form.volumeCapacityM3 = trip.volumeCapacityM3 ?? null
    form.pricePerM3 = trip.pricePerM3 ?? null
    form.pickupPlace = trip.pickupPlace
    form.dropoffPlace = trip.dropoffPlace
    form.availableWeightKg = trip.availableWeightKg ?? form.availableWeightKg
    form.capacityUnit = trip.capacityUnit ?? 'SUITCASE_23KG'
    form.pricingMode = trip.pricingMode ?? 'KG'
    form.negotiable = trip.negotiable ?? false
    form.currency = normalizeCurrency(trip.currency)
    currencyPinned = true
    form.pricePerKg = trip.pricePerKg ?? form.pricePerKg
    form.acceptedCategories = [...trip.acceptedCategories]
    form.refusedCategories = [...trip.refusedCategories]
    form.senderNote = trip.senderNote ?? ''
    form.cashAccepted = trip.cashAccepted
    form.handoverDeadline = isoToDateInput(trip.handoverDeadline)
    // Trajet au m³ : la fourchette d'arrivée se recopie telle quelle (décalage de jours des modèles inutilisé).
    if (trip.arrivalDateMax) {
      form.arrivalDate = trip.arrivalDate ?? ''
      form.arrivalDateMax = trip.arrivalDateMax
      pendingArrivalOffset = 0
    }
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
      transportMode: form.transportMode!,
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

  return { form, isBoat, isLegacyBoatTrip, currency, netPrice, minimumFee, validate, submit, submitEdit, applyTemplate, applyQuickTemplate, buildTemplatePayload }
}
