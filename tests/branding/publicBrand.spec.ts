import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('public Yadony brand', () => {
  it('does not expose the former brand in active UI copy', () => {
    const files = [
      'app/components/layout/AppSidebar.vue',
      'app/features/auth/components/LoginLeftPanel.vue',
      'app/features/cash/components/CashCommissionCard.vue',
      'app/features/colis/components/BidDetailPanel.vue',
      'app/features/landing/components/LandingAppBridge.vue',
      'app/features/landing/components/LandingCta.vue',
      'app/features/landing/components/LandingFaq.vue',
      'app/features/landing/components/LandingFeatures.vue',
      'app/features/landing/components/LandingFooter.vue',
      'app/features/landing/components/LandingHero.vue',
      'app/features/landing/components/LandingNav.vue',
      'app/features/landing/components/LandingTestimonials.vue',
      'app/features/payout/types/index.ts',
      'app/features/trajets/components/NewAnnouncementForm.vue',
      'app/features/trajets/components/TripDetailRevenue.vue',
      'app/layouts/default.vue',
      'app/pages/design.vue',
      'app/pages/index.vue',
      'app/pages/litiges/index.vue',
      'app/pages/login.vue',
      'app/pages/upgrade.vue',
      'nuxt.config.ts',
    ]
    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8')
        .replaceAll(/dony-theme|dony-table|__donyAuth(?:Seed)?|dony_device_id|admin\.dony\.invalid|https?:\/\/dony\.app|@dony\.fr/gi, '')
      return /\bdony\b/i.test(source)
    })
    expect(offenders).toEqual([])
  })
})
