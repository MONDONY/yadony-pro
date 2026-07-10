import { describe, it, expect } from 'vitest'
import { mapFirestoreMessage } from '@/features/messagerie/types/index'

describe('mapFirestoreMessage', () => {
  it('maps a text message', () => {
    const m = mapFirestoreMessage('m1', {
      senderId: 'uid-1', body: 'Salut', imageUrl: null, type: 'TEXT',
      sentAt: '2026-05-27T10:00:00.000Z', readAt: null,
    })
    expect(m).toEqual({
      id: 'm1', senderId: 'uid-1', body: 'Salut', imageUrl: null,
      type: 'TEXT', sentAt: '2026-05-27T10:00:00.000Z', readAt: null,
    })
  })

  it('maps an image message', () => {
    const m = mapFirestoreMessage('m2', {
      senderId: 'uid-1', body: null, imageUrl: 'https://x/y.jpg', type: 'IMAGE',
      sentAt: '2026-05-27T10:00:00.000Z', readAt: '2026-05-27T10:05:00.000Z',
    })
    expect(m.type).toBe('IMAGE')
    expect(m.imageUrl).toBe('https://x/y.jpg')
    expect(m.readAt).toBe('2026-05-27T10:05:00.000Z')
  })

  it('defaults unknown/missing fields safely (type → TEXT, missing → null/empty)', () => {
    const m = mapFirestoreMessage('m3', { type: 'SOMETHING_ELSE' })
    expect(m.type).toBe('TEXT')
    expect(m.senderId).toBe('')
    expect(m.body).toBeNull()
    expect(m.imageUrl).toBeNull()
    expect(m.sentAt).toBe('')
    expect(m.readAt).toBeNull()
  })

  it('keeps LOCATION type', () => {
    const m = mapFirestoreMessage('m4', { type: 'LOCATION', senderId: 'u', sentAt: 's' })
    expect(m.type).toBe('LOCATION')
  })
})
