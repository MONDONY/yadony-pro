import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders slot content', () => {
    const w = mount(Badge, { slots: { default: 'En cours' } })
    expect(w.text()).toBe('En cours')
  })

  it('applies the semantic variant classes', () => {
    const w = mount(Badge, { props: { variant: 'success' }, slots: { default: 'Accepté' } })
    expect(w.classes().join(' ')).toContain('text-success')
  })

  it('info variant uses the accent, not a semantic colour', () => {
    const w = mount(Badge, { props: { variant: 'info' }, slots: { default: 'En séquestre' } })
    expect(w.classes().join(' ')).toContain('text-primary')
  })

  it('hides the dot when dot=false', () => {
    const w = mount(Badge, { props: { dot: false }, slots: { default: 'x' } })
    expect(w.classes().join(' ')).toContain('before:hidden')
  })
})
