import { test, expect } from '@playwright/test'

const PRO_USER = {
  id: 'traveler-abo-001',
  phoneNumber: '+33612345678',
  displayName: 'Mamadou Voyageur',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

const NON_PRO_USER = {
  ...PRO_USER,
  id: 'traveler-abo-002',
  isProAccount: false,
}

const ACTIVE_SUBSCRIPTION = {
  active: true,
  status: 'ACTIVE',
  source: 'STRIPE',
  billingCycle: 'MONTHLY',
  currentPeriodEnd: '2026-09-28T00:00:00Z',
  cancelAtPeriodEnd: false,
  graceExpiresAt: null,
}

const PAST_DUE_SUBSCRIPTION = {
  active: true,
  status: 'PAST_DUE',
  source: 'STRIPE',
  billingCycle: 'MONTHLY',
  currentPeriodEnd: '2026-08-20T00:00:00Z',
  cancelAtPeriodEnd: false,
  graceExpiresAt: null,
}

async function fakeLogin(page: import('@playwright/test').Page, user: typeof PRO_USER) {
  await page.addInitScript((u) => {
    ;(window as unknown as { __yadonyAuthSeed: typeof u }).__yadonyAuthSeed = u
  }, user)
}

/** Block Firebase token-refresh network requests that fail in dev/test environments
 *  with auth/invalid-api-key when no real Firebase session exists. */
async function blockFirebaseAuthCalls(page: import('@playwright/test').Page) {
  await page.route('**/securetoken.googleapis.com/**', (route) => route.abort())
  await page.route('**/identitytoolkit.googleapis.com/**', (route) => route.abort())
}

async function mockSubscription(
  page: import('@playwright/test').Page,
  subscription: typeof ACTIVE_SUBSCRIPTION,
) {
  await page.route('**/billing/subscription', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subscription) })
  })
}

/** Navigate to /parametres/abonnement via client-side navigation from the
 *  authenticated dashboard, following the pattern of the other suites: /cockpit
 *  is used as the entry point so Firebase initialises once and the auth seed
 *  is picked up by expose-auth.client.ts. */
async function gotoAbonnement(page: import('@playwright/test').Page) {
  await page.goto('/cockpit')
  await page.getByRole('link', { name: 'Abonnement' }).first().click()
  await page.waitForURL(/\/parametres\/abonnement$/)
  await page.locator('[data-test="subscription-status-card"]').waitFor({ state: 'visible' })
}

test.describe('Abonnement — Voyageur PRO', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page, PRO_USER)
    await mockSubscription(page, ACTIVE_SUBSCRIPTION)
  })

  test('la page de gestion affiche l\'état de son abonnement actif', async ({ page }) => {
    await gotoAbonnement(page)

    await expect(page.locator('[data-test="subscription-status-label"]')).toHaveText('Actif')
    // Le cycle affiché est la PÉRIODICITÉ souscrite ("Mensuel"), jamais le
    // tarif du catalogue courant : un abonné historique ou promotionnel ne
    // paie pas nécessairement 4,99 € / mois.
    await expect(page.locator('[data-test="subscription-status-cycle"]')).toHaveText('Mensuel')
    // Le bouton de gestion du Customer Portal n'apparaît que pour une source STRIPE.
    await expect(page.locator('[data-test="subscription-status-portal-button"]')).toBeVisible()
  })

  test('la page de gestion est accessible depuis la barre latérale', async ({ page }) => {
    await page.goto('/cockpit')
    await expect(page.getByRole('link', { name: 'Abonnement' }).first()).toBeVisible()
  })
})

// Correctif 3 : sur échec réseau, la carte affichait « Aucun abonnement » à
// côté du message d'erreur — à un utilisateur nécessairement PRO puisque la
// page est derrière pro-only. L'interface affirmait un état qu'elle n'avait
// pas pu lire.
test.describe('Abonnement — Page de gestion, échec réseau', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page, PRO_USER)
  })

  test("n'affirme jamais « Aucun abonnement » sur un échec réseau, et permet de réessayer", async ({ page }) => {
    // Le bandeau global (layout) ET la page de gestion appellent chacun leur
    // propre instance de useSubscription() : /billing/subscription est donc
    // interrogé plusieurs fois avant le clic sur "Réessayer". Un drapeau
    // partagé (plutôt qu'un compteur de premier appel) garantit que TOUS les
    // appels échouent jusqu'au réessai, et TOUS réussissent ensuite.
    let shouldFail = true
    await page.route('**/billing/subscription', async (route) => {
      if (shouldFail) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erreur serveur' }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ACTIVE_SUBSCRIPTION) })
      }
    })

    await page.goto('/cockpit')
    await page.getByRole('link', { name: 'Abonnement' }).first().click()
    await page.waitForURL(/\/parametres\/abonnement$/)

    await expect(page.locator('[data-test="subscription-page-error"]')).toBeVisible()
    // La carte de statut ne doit pas se monter du tout : elle ne peut pas
    // afficher un état qu'elle n'a pas pu lire.
    await expect(page.locator('[data-test="subscription-status-card"]')).not.toBeVisible()
    await expect(page.locator('[data-test="subscription-status-label"]')).not.toBeVisible()

    shouldFail = false
    await page.locator('[data-test="subscription-page-retry-button"]').click()
    await expect(page.locator('[data-test="subscription-status-label"]')).toHaveText('Actif')
    await expect(page.locator('[data-test="subscription-page-error"]')).not.toBeVisible()
  })
})

test.describe('Abonnement — Voyageur en impayé', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page, PRO_USER)
    await mockSubscription(page, PAST_DUE_SUBSCRIPTION)
  })

  test('le bandeau global alerte sur le paiement en échec', async ({ page }) => {
    await page.goto('/cockpit')

    const banner = page.locator('[data-test="subscription-banner"]')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveAttribute('role', 'alert')
    await expect(banner).toContainText('paiement a échoué')
  })

  // Correctif 1 : le bandeau ne menait nulle part. Un voyageur en grâce
  // historique — la cible même de ce bandeau — n'avait physiquement aucun
  // moyen de payer depuis le portail.
  test('le bandeau mène vers la page de vente', async ({ page }) => {
    await page.goto('/cockpit')

    await page.locator('[data-test="subscription-banner"]').click()
    await expect(page).toHaveURL(/\/upgrade$/)
  })
})

test.describe('Abonnement — Voyageur non-PRO sur la page de vente', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
    await fakeLogin(page, NON_PRO_USER)
  })

  test('affiche les deux formules et déclenche la souscription sans suivre Stripe', async ({ page }) => {
    // La redirection vers Stripe se ferait dans l'onglet courant (window.location.href) :
    // on bloque l'hôte Stripe pour ne jamais la suivre réellement dans le test.
    await page.route('https://checkout.stripe.com/**', (route) => route.abort())

    await page.route('**/billing/checkout-session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_e2e' }),
      })
    })

    await page.goto('/upgrade')

    const monthlyCard = page.locator('[data-test="pricing-card"]').filter({ hasText: 'Formule mensuelle' })
    const yearlyCard = page.locator('[data-test="pricing-card"]').filter({ hasText: 'Formule annuelle' })
    await expect(monthlyCard).toBeVisible()
    await expect(yearlyCard).toBeVisible()
    await expect(monthlyCard).toContainText('4,99 € / mois')
    await expect(yearlyCard).toContainText('47,90 € / an')
    // Le contenu est déjà visible via le rendu serveur ; attendre l'hydratation
    // complète avant de cliquer, sans quoi le bouton (un vrai <button>, pas un
    // lien) n'a pas encore son gestionnaire Vue attaché et le clic ne fait rien.
    await page.waitForLoadState('networkidle')

    const checkoutRequest = page.waitForRequest('**/billing/checkout-session*')
    await monthlyCard.locator('[data-test="pricing-card-subscribe-button"]').click()
    const request = await checkoutRequest

    expect(request.method()).toBe('POST')
    expect(request.url()).toContain('cycle=MONTHLY')
  })
})

test.describe('Abonnement — Retour de paiement Stripe (régression middleware)', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
  })

  test('une session encore périmée atteint la page de gestion après rafraîchissement, sans repasser par la page de vente', async ({ page }) => {
    // État client exact juste après un paiement Stripe réussi : la session
    // restaurée porte encore isProAccount=false, le webhook n'ayant pas eu le
    // temps d'être traité par le backend au moment où le navigateur revient.
    await fakeLogin(page, { ...PRO_USER, id: 'traveler-abo-003', isProAccount: false })

    let authMeCalled = false
    await page.route('**/auth/me', async (route) => {
      authMeCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PRO_USER, id: 'traveler-abo-003', isProAccount: true }),
      })
    })
    await mockSubscription(page, ACTIVE_SUBSCRIPTION)

    // Navigation complète (pas un clic interne) : reproduit fidèlement le
    // retour du navigateur depuis Stripe Checkout, avec le pipeline de
    // middleware réel (auth.global.ts puis pro-only) exécuté sur cette route,
    // exactement le scénario que la déviation de app/middleware/pro-only.ts
    // existe pour empêcher.
    await page.goto('/parametres/abonnement?success=1')
    // Le rafraîchissement (appel réseau à /auth/me) puis la décision du
    // middleware ne sont pas synchrones avec la navigation initiale : on
    // laisse le réseau se stabiliser avant de vérifier où on a atterri,
    // sans quoi l'assertion pourrait s'exécuter avant que le middleware
    // n'ait tranché.
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/parametres\/abonnement/, { timeout: 10000 })
    await expect(page.locator('[data-test="subscription-status-card"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-test="subscription-status-label"]')).toHaveText('Actif', { timeout: 10000 })
    expect(authMeCalled).toBe(true)
  })

  // Correctif 2 : symétrique du test précédent, mais le webhook ne finit
  // JAMAIS par atterrir dans cette exécution du middleware. C'est le chemin
  // RÉEL du bug B2 — Stripe redirige vers /parametres/abonnement?success=1,
  // jamais directement vers /upgrade?success=1 — donc c'est pro-only.ts qui
  // doit préserver le paramètre en rebondissant, sous peine que l'état
  // d'attente de app/pages/upgrade.vue ne reçoive jamais le signal qui le
  // déclenche.
  test('un webhook qui ne répond jamais atterrit sur la page de vente en état d\'attente, jamais sur la grille tarifaire sans un mot', async ({ page }) => {
    await fakeLogin(page, { ...PRO_USER, id: 'traveler-abo-006', isProAccount: false })

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PRO_USER, id: 'traveler-abo-006', isProAccount: false }),
      })
    })

    await page.goto('/parametres/abonnement?success=1')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/upgrade/, { timeout: 10000 })
    await expect(page.locator('[data-test="upgrade-payment-pending"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-test="upgrade-pricing"]')).toHaveCount(0)
  })
})

test.describe('Abonnement — Visiteur non connecté', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
  })

  test('voit les tarifs mais est renvoyé vers la connexion en tentant de souscrire', async ({ page }) => {
    await page.goto('/upgrade')

    await expect(page.locator('[data-test="pricing-card"]')).toHaveCount(2)
    await page.waitForLoadState('networkidle')

    let checkoutCalled = false
    await page.route('**/billing/checkout-session*', async (route) => {
      checkoutCalled = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: '' }) })
    })

    const monthlyCard = page.locator('[data-test="pricing-card"]').filter({ hasText: 'Formule mensuelle' })
    await monthlyCard.locator('[data-test="pricing-card-subscribe-button"]').click()

    await expect(page).toHaveURL(/\/login$/)
    expect(checkoutCalled).toBe(false)
  })
})

test.describe('Abonnement — Retour de paiement sur la page de vente, webhook Stripe en retard', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebaseAuthCalls(page)
  })

  test('affiche un état d\'activation en cours plutôt que la grille tarifaire, avec un bouton pour revérifier', async ({ page }) => {
    // État client exact juste après un paiement Stripe réussi : le webhook
    // n'a pas encore atterri, le profil restauré est donc encore non-PRO.
    await fakeLogin(page, { ...PRO_USER, id: 'traveler-abo-004', isProAccount: false })

    let authMeCallCount = 0
    await page.route('**/auth/me', async (route) => {
      authMeCallCount += 1
      // Le webhook tarde toujours : le rafraîchissement ne change rien.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PRO_USER, id: 'traveler-abo-004', isProAccount: false }),
      })
    })

    await page.goto('/upgrade?success=1')
    await page.waitForLoadState('networkidle')

    // Le paiement est passé : ne jamais revoir la grille tarifaire sans un mot.
    await expect(page.locator('[data-test="upgrade-payment-pending"]')).toBeVisible()
    await expect(page.locator('[data-test="upgrade-pricing"]')).toHaveCount(0)
    expect(authMeCallCount).toBeGreaterThanOrEqual(1)

    // Le bouton de revérification relance le rafraîchissement du profil.
    const callsBeforeRetry = authMeCallCount
    await page.locator('[data-test="upgrade-check-activation-button"]').click()
    await page.waitForLoadState('networkidle')
    expect(authMeCallCount).toBeGreaterThan(callsBeforeRetry)
    // Toujours non-PRO : on reste sur l'état d'attente, jamais un retour à la grille.
    await expect(page.locator('[data-test="upgrade-payment-pending"]')).toBeVisible()
  })

  test('bascule vers la page de gestion dès que la revérification confirme l\'activation', async ({ page }) => {
    await fakeLogin(page, { ...PRO_USER, id: 'traveler-abo-005', isProAccount: false })
    let isProNow = false
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...PRO_USER, id: 'traveler-abo-005', isProAccount: isProNow }),
      })
    })
    await mockSubscription(page, ACTIVE_SUBSCRIPTION)

    await page.goto('/upgrade?success=1')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-test="upgrade-payment-pending"]')).toBeVisible()

    // Le webhook a fini par atterrir entre-temps.
    isProNow = true
    await page.locator('[data-test="upgrade-check-activation-button"]').click()

    await expect(page).toHaveURL(/\/parametres\/abonnement/, { timeout: 10000 })
    await expect(page.locator('[data-test="subscription-status-card"]')).toBeVisible({ timeout: 10000 })
  })
})

