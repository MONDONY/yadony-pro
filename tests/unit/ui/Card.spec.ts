import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('elevated by default (shadow-card, no hand-rolled string)', () => {
    const w = mount(Card, { slots: { default: 'x' } })
    const cls = w.classes().join(' ')
    expect(cls).toContain('shadow-card')
    expect(cls).toContain('rounded-card')
    expect(cls).toContain('bg-surface')
  })

  it('flat variant drops the shadow', () => {
    const w = mount(Card, { props: { variant: 'flat' }, slots: { default: 'x' } })
    expect(w.classes()).not.toContain('shadow-card')
  })

  it('interactive adds a hover lift that respects reduced motion', () => {
    const w = mount(Card, { props: { interactive: true }, slots: { default: 'x' } })
    const cls = w.classes().join(' ')
    expect(cls).toContain('hover:-translate-y-px')
    expect(cls).toContain('motion-reduce:hover:translate-y-0')
  })

  it('renders as a custom element via `as`', () => {
    const w = mount(Card, { props: { as: 'section' }, slots: { default: 'x' } })
    expect(w.element.tagName).toBe('SECTION')
  })
})
