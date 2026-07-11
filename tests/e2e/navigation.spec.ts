import { test, expect } from '@playwright/test'

const FAKE_USER = {
  id: 'user-1',
  phoneNumber: '+33612345678',
  displayName: 'Jean Test',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

type AuthStore = {
  setSession: (token: string, user: typeof FAKE_USER) => void
}

async function fakeLogin(page: import('@playwright/test').Page, user = FAKE_USER) {
  // Seed the auth store on every navigation via init script (plugin reads it).
  await page.addInitScript((u) => {
    ;(window as unknown as { __donyAuthSeed: typeof u }).__donyAuthSeed = u
  }, user)
}

test('unauthenticated user is redirected to /login', async ({ page }) => {
  await page.goto('/cockpit')
  await expect(page).toHaveURL(/\/login$/)
})

test('non-pro user is redirected to /upgrade', async ({ page }) => {
  await fakeLogin(page, { ...FAKE_USER, isProAccount: false })
  await page.goto('/trajets')
  await expect(page).toHaveURL(/\/upgrade$/)
})

test('pro user navigates between 6 sections', async ({ page }) => {
  await fakeLogin(page)
  await page.goto('/cockpit')
  await expect(page.locator('h1').first()).toContainText('Centre de commandes')

  await page.getByRole('link', { name: 'Mes Trajets' }).first().click()
  await expect(page.locator('h1').first()).toContainText('Mes Trajets')

  await page.getByRole('link', { name: 'Mes Colis' }).first().click()
  await expect(page.locator('h1').first()).toContainText('Mes Colis')

  await page.getByRole('link', { name: 'Automatisations' }).first().click()
  await expect(page.locator('h1').first()).toContainText('Automatisations')

  await page.getByRole('link', { name: 'Demandes compatibles' }).first().click()
  await expect(page.locator('h1').first()).toContainText('Demandes compatibles')

  await page.getByRole('link', { name: /Mon Activit/ }).first().click({ force: true })
  await expect(page.locator('h1').first()).toContainText('Mon Activité')
})
