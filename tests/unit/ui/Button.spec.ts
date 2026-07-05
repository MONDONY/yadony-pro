import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button', () => {
  it('renders slot content in a button by default', () => {
    const w = mount(Button, { slots: { default: 'Accepter' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.text()).toBe('Accepter')
  })

  it('default variant is elevated (shadow) and uses the accent', () => {
    const w = mount(Button, { slots: { default: 'x' } })
    const cls = w.classes().join(' ')
    expect(cls).toContain('bg-primary')
    expect(cls).toContain('shadow-btn')
  })

  it('danger variant is separate from the accent', () => {
    const cls = buttonVariants({ variant: 'danger' })
    expect(cls).toContain('bg-danger')
    expect(cls).not.toContain('bg-primary')
  })

  it('has an accessible focus ring', () => {
    const cls = buttonVariants({})
    expect(cls).toContain('focus-visible:ring-2')
    expect(cls).toContain('focus-visible:ring-offset-2')
  })

  it('renders as a custom element via `as`', () => {
    const w = mount(Button, { props: { as: 'a' }, slots: { default: 'lien' } })
    expect(w.element.tagName).toBe('A')
  })
})
