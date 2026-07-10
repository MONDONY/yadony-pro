import { describe, it, expect } from 'vitest'
import { describeKycStatus } from '@/features/kyc/types/index'

describe('describeKycStatus', () => {
  it('maps VERIFIED to a success descriptor that cannot re-verify', () => {
    const d = describeKycStatus('VERIFIED')
    expect(d.tone).toBe('success')
    expect(d.canVerify).toBe(false)
  })

  it('maps PENDING and PROCESSING to a warning descriptor', () => {
    expect(describeKycStatus('PENDING').tone).toBe('warning')
    expect(describeKycStatus('processing').tone).toBe('warning')
    expect(describeKycStatus('PENDING').canVerify).toBe(false)
  })

  it('maps failure-like statuses to an error descriptor that can re-verify', () => {
    for (const s of ['REQUIRES_INPUT', 'FAILED', 'REJECTED', 'CANCELED']) {
      const d = describeKycStatus(s)
      expect(d.tone).toBe('error')
      expect(d.canVerify).toBe(true)
    }
  })

  it('treats unknown / empty / null as neutral "not verified" with action required', () => {
    expect(describeKycStatus(null).tone).toBe('neutral')
    expect(describeKycStatus(undefined).canVerify).toBe(true)
    expect(describeKycStatus('').tone).toBe('neutral')
    expect(describeKycStatus('SOMETHING_ELSE').canVerify).toBe(true)
  })
})
