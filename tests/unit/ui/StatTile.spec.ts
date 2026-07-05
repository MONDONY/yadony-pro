import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { StatTile } from '@/components/ui/stat'

describe('StatTile', () => {
  it('renders label and value', () => {
    const w = mount(StatTile, { props: { label: 'En séquestre', value: '4 820,00 €' } })
    expect(w.text()).toContain('En séquestre')
    expect(w.text()).toContain('4 820,00 €')
  })

  it('the value uses tabular mono figures', () => {
    const w = mount(StatTile, { props: { label: 'x', value: '3' } })
    const val = w.get('p.font-mono')
    expect(val.classes()).toContain('tabular-nums')
  })

  it('shows an up delta in the success colour', () => {
    const w = mount(StatTile, { props: { label: 'x', value: '1', trend: 'up', trendValue: '12,4 %' } })
    expect(w.html()).toContain('text-success')
    expect(w.text()).toContain('12,4 %')
  })

  it('shows a down delta in the danger colour', () => {
    const w = mount(StatTile, { props: { label: 'x', value: '1', trend: 'down', trendValue: '1' } })
    expect(w.html()).toContain('text-danger')
  })

  it('renders no delta row when trend is neutral and no sub', () => {
    const w = mount(StatTile, { props: { label: 'x', value: '1', trend: 'neutral' } })
    expect(w.html()).not.toContain('text-success')
    expect(w.html()).not.toContain('text-danger')
  })
})
