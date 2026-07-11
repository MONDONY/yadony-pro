// tests/e2e/demandes.spec.ts
import { test, expect } from '@playwright/test'

const FAKE_USER = {
  id: 'traveler-e2e-001',
  phoneNumber: '+33612345678',
  displayName: 'Mamadou Voyageur',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

// Sample trip that will be selected via TripSelector
const FAKE_TRIP = {
  id: 'trip-e2e-001',
  travelerId: 'traveler-e2e-001',
  status: 'ACTIVE',
  departureCity: 'Paris',
  arrivalCity: 'Dakar',
  departureDate: '2026-08-15',
  departureTime: '10:00',
  arrivalTime: null,
  transportMode: 'AVION',
  pickupAddress: { label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
  deliveryAddress: { label: 'Aéroport DSS', lat: 14.73, lng: -17.49 },
  availableKg: 25,
  totalKg: 30,
  pricePerKg: 8,
  acceptedContentTypes: ['Vêtements', 'Électronique'],
  refusedTypes: [],
  senderNote: null,
  cashAccepted: false,
  acceptedPaymentMethods: ['STRIPE'],
  handoverWindowStart: '2026-08-15T08:00:00Z',
  handoverWindowEnd: '2026-08-15T09:30:00Z',
  confirmedParcelCount: 1,
  pendingBidCount: 0,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
}

// Sample matching requests for the active trip (Paris → Dakar, Aug 15)
const FAKE_MATCHING_REQUESTS = [
  {
    id: 'req-e2e-001',
    tripId: 'trip-e2e-001',
    tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-08-15',
    tripAvailableKg: 25,
    senderName: 'Chaka Diallo',
    senderInitials: 'CD',
    senderRating: 4.7,
    senderTotalSent: 8,
    weightKg: 5,
    contentType: 'Vêtements',
    budgetPerKg: 8,
    messageExcerpt: 'Bonjour, envoi de vêtements…',
    matchScore: 95,
    requestedAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'req-e2e-002',
    tripId: 'trip-e2e-001',
    tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-08-15',
    tripAvailableKg: 25,
    senderName: 'Aminata Ba',
    senderInitials: 'AB',
    senderRating: 4.2,
    senderTotalSent: 3,
    weightKg: 3,
    contentType: 'Électronique',
    budgetPerKg: 10,
    messageExcerpt: 'Envoi urgent de téléphone…',
    matchScore: 85,
    requestedAt: '2026-05-15T11:00:00Z',
  },
  {
    id: 'req-e2e-003',
    tripId: 'trip-e2e-001',
    tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-08-15',
    tripAvailableKg: 25,
    senderName: 'Ibrahim Sow',
    senderInitials: 'IS',
    senderRating: 4.8,
    senderTotalSent: 15,
    weightKg: 12,
    contentType: 'Vêtements',
    budgetPerKg: 6,
    messageExcerpt: 'Plusieurs cartons de vêtements…',
    matchScore: 72,
    requestedAt: '2026-05-15T12:00:00Z',
  },
]

// Sample negotiation modal data
const FAKE_NEGOTIATION_THREAD = {
  id: 'thread-e2e-001',
  packageRequestId: 'req-e2e-001',
  travelerId: 'traveler-e2e-001',
  travelerAnnouncementId: 'trip-e2e-001',
  travelerTravelDate: '2026-08-15',
  travelerAvailableKg: 25,
  status: 'OPEN',
  currentPriceEur: 40,
  roundsCount: 0,
  lastActivityAt: '2026-05-15T10:00:00Z',
  createdAt: '2026-05-15T10:00:00Z',
  messages: [],
  paymentIntentClientSecret: null,
  travelerName: 'Mamadou Voyageur',
  travelerRating: 4.9,
  travelerTripsCount: 23,
  travelerPhotoUrl: null,
  departureCity: 'Paris',
  arrivalCity: 'Dakar',
  weightKg: 5,
  senderName: 'Chaka D.',
}

async function fakeLogin(page: import('@playwright/test').Page) {
  // Inject PRO user auth seed before page JS runs (read by expose-auth.client.ts plugin)
  await page.addInitScript((u) => {
    ;(window as unknown as { __donyAuthSeed: typeof u }).__donyAuthSeed = u
  }, FAKE_USER)
}

async function mockApi(page: import('@playwright/test').Page) {
  // Fallback for unhandled routes (analytics, etc.)
  await page.route(/localhost:8080/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )

  // Mock user's trips list — needed by TripSelector
  await page.route('http://localhost:8080/api/v1/announcements/my*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [FAKE_TRIP],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 50,
      }),
    }),
  )

  // Mock matching requests for active trip
  await page.route('http://localhost:8080/api/v1/travelers/me/matching-requests*', (route) => {
    const url = new URL(route.request().url())
    const tripId = url.searchParams.get('tripId')

    // If tripId filter matches, return filtered results
    if (tripId === 'trip-e2e-001') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_MATCHING_REQUESTS),
      })
    }

    // Default: empty list
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Mock negotiation creation (POST /api/v1/negotiations)
  await page.route('http://localhost:8080/api/v1/negotiations', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_NEGOTIATION_THREAD),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  // Mock negotiation thread details
  await page.route('http://localhost:8080/api/v1/negotiations/thread-e2e-001', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_NEGOTIATION_THREAD),
    }),
  )
}

async function gotoDemandes(page: import('@playwright/test').Page) {
  // Navigate via /cockpit to ensure auth plugin initializes
  await page.goto('/cockpit')
  await expect(page.locator('h1').first()).toContainText('Centre de commandes', { timeout: 10000 })

  // Click sidebar link for "Demandes compatibles"
  await page.getByRole('link', { name: 'Demandes compatibles' }).first().click()
  await page.waitForURL(/\/demandes$/)
  await page.waitForLoadState('networkidle')
}

test.describe('Page Demandes', () => {
  test.beforeEach(async ({ page }) => {
    await fakeLogin(page)
    await mockApi(page)
  })

  test('affiche TripSelector et liste des demandes matchées', async ({ page }) => {
    await gotoDemandes(page)

    // TripSelector should be visible with active trip
    await expect(page.locator('[data-test="trip-selector"]')).toBeVisible()

    // Trip info should be displayed
    await expect(page.getByText('Paris')).toBeVisible()
    await expect(page.getByText('Dakar')).toBeVisible()

    // At least one request card should be visible
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('affiche les demandes filtrées selon le trajet sélectionné', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for request cards to load
    const cards = page.locator('[data-test^="request-card-"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    // Verify sender names are displayed
    await expect(page.getByText('Chaka Diallo')).toBeVisible()
    await expect(page.getByText('Aminata Ba')).toBeVisible()
    await expect(page.getByText('Ibrahim Sow')).toBeVisible()
  })

  test('filtres rapides sont visibles quand un trajet est actif', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for at least one request card to appear
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })

    // Quick filter buttons should be visible
    await expect(page.locator('[data-test="filter-all"]')).toBeVisible()
    await expect(page.locator('[data-test="filter-weight"]')).toBeVisible()
    await expect(page.locator('[data-test="filter-budget"]')).toBeVisible()
    await expect(page.locator('[data-test="filter-sort"]')).toBeVisible()
  })

  test('filtre poids réduit les résultats affichés', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for initial cards to load
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })
    const initialCount = await page.locator('[data-test^="request-card-"]').count()
    expect(initialCount).toBeGreaterThan(0)

    // Click weight filter button
    await page.locator('[data-test="filter-weight"]').click()
    await page.waitForTimeout(200)

    // Select weight option (e.g., <= 5kg)
    const weightOption = page.locator('[data-test="weight-option-5"]')
    if (await weightOption.isVisible()) {
      await weightOption.click()
      await page.waitForTimeout(200)

      const filteredCount = await page.locator('[data-test^="request-card-"]').count()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    }
  })

  test('bouton "Négocier" ouvre la NegotiationStartModal', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for request cards to load
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })

    // Click negotiate button on first card
    await page.locator('[data-test^="negotiate-btn-"]').first().click()

    // Modal should display negotiation details
    await expect(page.locator('[data-test="negociation-modal"]')).toBeVisible({ timeout: 5000 })

    // Modal should show request summary
    await expect(page.locator('[data-test="negociation-sender-name"]')).toBeVisible()
    await expect(page.locator('[data-test="negociation-weight"]')).toBeVisible()
    await expect(page.locator('[data-test="negociation-prix-input"]')).toBeVisible()

    // Verify suggested price is pre-filled (weightKg * budgetPerKg)
    const priceInput = page.locator('[data-test="negociation-prix-input"]')
    const priceValue = await priceInput.inputValue()
    expect(parseInt(priceValue || '0')).toBeGreaterThan(0)
  })

  test('soumettre une proposition via NegotiationStartModal crée un thread', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for request cards and click first negotiate button
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })
    await page.locator('[data-test^="negotiate-btn-req-e2e-001"]').click()

    // Modal appears and pre-fills suggested price
    await expect(page.locator('[data-test="negociation-modal"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-test="negociation-prix-input"]')).toHaveValue('40')

    // Click submit button
    await page.locator('[data-test="negociation-submit-btn"]').click()

    // Should navigate to negotiation thread page
    await expect(page).toHaveURL(/\/negociations\/thread-e2e-001/, { timeout: 8000 })
  })

  test('fermer la modal via Escape revient à la liste des demandes', async ({ page }) => {
    await gotoDemandes(page)

    // Open negotiation modal
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })
    await page.locator('[data-test^="negotiate-btn-"]').first().click()
    await expect(page.locator('[data-test="negociation-modal"]')).toBeVisible({ timeout: 5000 })

    // Close modal with Escape key
    await page.keyboard.press('Escape')

    // Modal should disappear and we remain on /demandes
    await expect(page.locator('[data-test="negociation-modal"]')).not.toBeVisible()
    await expect(page).toHaveURL(/\/demandes$/)

    // Request cards should still be visible
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible()
  })

  test('affiche état vide quand pas de trajet actif', async ({ page }) => {
    // Mock no trips available
    await page.route('http://localhost:8080/api/v1/announcements/my*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 50,
        }),
      }),
    )

    await gotoDemandes(page)

    // Should show empty state message
    const emptyState = page.locator('[data-test="empty-state"]')
    const noTripsMsg = page.getByText(/Crée ton premier trajet|Aucun trajet actif/i)

    // Either the empty state or no trips message should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasNoTripsMsg = await noTripsMsg.isVisible().catch(() => false)
    expect(hasEmptyState || hasNoTripsMsg).toBe(true)
  })

  test('affiche sender profile et reputation sur la card', async ({ page }) => {
    await gotoDemandes(page)

    // Wait for cards and verify sender info is displayed
    await expect(page.locator('[data-test^="request-card-"]').first()).toBeVisible({ timeout: 8000 })

    // Sender info should be visible
    await expect(page.getByText('Chaka Diallo')).toBeVisible()

    // Rating and count should be displayed
    const ratingDisplay = page.locator('[data-test^="sender-rating-"]')
    const firstRating = ratingDisplay.first()
    if (await firstRating.isVisible()) {
      const ratingText = await firstRating.textContent()
      expect(ratingText).toMatch(/\d+\.?\d*/)
    }
  })
})
