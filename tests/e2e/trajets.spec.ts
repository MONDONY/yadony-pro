import { test, expect } from '@playwright/test'

const FAKE_USER = {
  id: 'user-1',
  phoneNumber: '+33612345678',
  displayName: 'Jean Test',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

async function fakeLogin(page: import('@playwright/test').Page) {
  await page.addInitScript((u) => {
    ;(window as unknown as { __donyAuthSeed: typeof u }).__donyAuthSeed = u
  }, FAKE_USER)
}

/** Block Firebase token-refresh network requests that fail in dev/test environments
 *  with auth/invalid-api-key when no real Firebase session exists. */
async function blockFirebaseAuthCalls(page: import('@playwright/test').Page) {
  await page.route('**/securetoken.googleapis.com/**', (route) => route.abort())
  await page.route('**/identitytoolkit.googleapis.com/**', (route) => route.abort())
}

async function mockApi(page: import('@playwright/test').Page) {
  await page.route('**/announcements**', async (route) => {
    const fakeTrips = [
      {
        id: 'trip-1', status: 'ACTIVE',
        departureCity: { placeId: 'p1', label: 'Paris', lat: 48.85, lng: 2.35 },
        arrivalCity: { placeId: 'p2', label: 'Dakar', lat: 14.69, lng: -17.44 },
        departureDate: '2026-08-01', departureTime: '10:00', arrivalTime: null,
        transportMode: 'AVION',
        pickupPlace: { placeId: 'pk', label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
        dropoffPlace: { placeId: 'dr', label: 'Aéroport DSS', lat: 14.73, lng: -17.49 },
        availableWeightKg: 20, usedWeightKg: 15, pricePerKg: 7,
        acceptedCategories: ['Vêtements'], refusedCategories: [],
        senderNote: null, cashAccepted: false,
        confirmedParcelCount: 3, pendingBidCount: 2, reservedRevenueEuros: 105,
        createdAt: '2026-05-01T00:00:00Z',
      },
    ]

    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      await route.fulfill({
        status: 201, contentType: 'application/json',
        body: JSON.stringify({ ...fakeTrips[0], id: 'trip-new', status: body.status }),
      })
      return
    }

    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ content: fakeTrips, totalElements: 1, totalPages: 1, number: 0, size: 50 }),
    })
  })

  await page.route('**/api/v1/addresses/autocomplete', async (route) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { placeId: 'p-lyon', mainText: 'Lyon', secondaryText: 'France' },
        { placeId: 'p-abidjan', mainText: 'Abidjan', secondaryText: "Côte d'Ivoire" },
      ]),
    })
  })

  await page.route('**/api/v1/addresses/details', async (route) => {
    const body = route.request().postDataJSON()
    const label = body.placeId === 'p-lyon' ? 'Lyon, France' : "Abidjan, Côte d'Ivoire"
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ label, lat: 45.75, lng: 4.85 }),
    })
  })
}

/** Navigate to /trajets via client-side navigation from the authenticated dashboard.
 *  /cockpit is used as the entry point so that Firebase initialises once
 *  (client-side plugin) and the auth seed is picked up by expose-auth.client.ts.
 *  We then follow the sidebar "Mes Trajets" link rather than doing a hard reload
 *  of /trajets, which avoids re-triggering Firebase's internal token-refresh flow.
 *  After navigation we wait for a TripCard to confirm the API data is loaded.
 */
async function gotoTrajets(page: import('@playwright/test').Page) {
  await page.goto('/cockpit')
  await page.getByRole('link', { name: 'Mes Trajets' }).first().click()
  await page.waitForURL(/\/trajets$/)
  // Wait for the initial fetchTrips() to complete and render at least one TripCard
  await page.locator('[data-test="capacity-bar"]').waitFor({ state: 'visible' })
}

/** Navigate to /trajets/nouvelle-annonce via client-side navigation.
 *  Wait for the form title heading to confirm the form has mounted.
 */
async function gotoNouvelleAnnonce(page: import('@playwright/test').Page) {
  await page.goto('/cockpit')
  await page.locator('[data-test="btn-nouvelle-annonce"]').first().click()
  await page.waitForURL(/\/trajets\/nouvelle-annonce$/)
  // Wait for the form section headings to appear
  await page.locator('h2').filter({ hasText: 'Trajet' }).waitFor({ state: 'visible' })
  // Wait for any pending API calls (e.g. fetchTemplates) to complete
  await page.waitForLoadState('networkidle')
}

test.describe('Mes Trajets — Liste', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page)
    await mockApi(page)
  })

  test('shows trip list with corridor and capacity bar', async ({ page }) => {
    await gotoTrajets(page)
    await expect(page.getByText('Paris')).toBeVisible()
    await expect(page.getByText('Dakar')).toBeVisible()
    await expect(page.locator('[data-test="capacity-bar"]')).toBeVisible()
  })

  test('filter tabs change the active filter', async ({ page }) => {
    await gotoTrajets(page)
    const actifTab = page.locator('[data-test="filter-ACTIFS"]')
    await actifTab.click()
    await expect(actifTab).toHaveClass(/bg-primary/)
  })

  test('toggle switches to calendar view', async ({ page }) => {
    await gotoTrajets(page)
    await page.getByRole('button', { name: 'Vue calendrier' }).click()
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    const calendarHeader = page.locator('h2').filter({ hasText: new RegExp(months.join('|')) })
    await expect(calendarHeader).toBeVisible()
  })

  test('"Nouvelle annonce" link navigates to form page', async ({ page }) => {
    await gotoTrajets(page)
    // Use first() because both the page CTA and the sidebar CTA carry this data-test
    await page.locator('[data-test="btn-nouvelle-annonce"]').first().click()
    await expect(page).toHaveURL(/\/trajets\/nouvelle-annonce$/)
  })
})

test.describe('Nouvelle annonce — Formulaire', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page)
    await mockApi(page)
  })

  test('page loads with form sections visible', async ({ page }) => {
    await gotoNouvelleAnnonce(page)
    // Use section headings (h2) to avoid matching nav labels
    await expect(page.locator('h2').filter({ hasText: 'Trajet' })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: 'Lieux de remise' })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: /Capacité & Prix/ })).toBeVisible()
    await expect(page.locator('[data-test="btn-publish"]')).toBeVisible()
    await expect(page.locator('[data-test="btn-draft"]')).toBeVisible()
  })

  test('selecting transport mode chip marks it active', async ({ page }) => {
    await gotoNouvelleAnnonce(page)
    await page.locator('[data-test="transport-AVION"]').click()
    await expect(page.locator('[data-test="transport-AVION"]')).toHaveClass(/border-primary/)
  })

  test('cash toggle changes aria-pressed state', async ({ page }) => {
    await gotoNouvelleAnnonce(page)
    const toggle = page.locator('[data-test="cash-toggle"]')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })
})
