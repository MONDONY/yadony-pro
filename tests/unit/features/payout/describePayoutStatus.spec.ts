import { describe, it, expect } from 'vitest'
import { describePayoutStatus } from '@/features/payout/types/index'

describe('describePayoutStatus', () => {
  it('ONBOARDING_COMPLETE → success, no action, no refresh', () => {
    const d = describePayoutStatus('ONBOARDING_COMPLETE')
    expect(d.tone).toBe('success')
    expect(d.action).toBe('none')
    expect(d.canRefresh).toBe(false)
  })

  it('PENDING_ONBOARDING → warning, continue, refreshable', () => {
    const d = describePayoutStatus('PENDING_ONBOARDING')
    expect(d.tone).toBe('warning')
    expect(d.action).toBe('continue')
    expect(d.canRefresh).toBe(true)
  })

  it('REJECTED and DISABLED → error, no action', () => {
    expect(describePayoutStatus('REJECTED').tone).toBe('error')
    expect(describePayoutStatus('REJECTED').action).toBe('none')
    expect(describePayoutStatus('DISABLED').tone).toBe('error')
    expect(describePayoutStatus('DISABLED').action).toBe('none')
  })

  it('NOT_CREATED, null and unknown → neutral with setup action', () => {
    expect(describePayoutStatus('NOT_CREATED').action).toBe('setup')
    expect(describePayoutStatus(null).action).toBe('setup')
    expect(describePayoutStatus(undefined).tone).toBe('neutral')
  })
})
