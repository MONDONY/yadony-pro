import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PresetRuleCard from '@/features/automations/components/PresetRuleCard.vue'
import type { PresetRule } from '@/features/automations/types/index'

function makeRule(overrides: Partial<PresetRule> = {}): PresetRule {
  return {
    id: 'auto_accept_trusted',
    ruleType: 'PRESET',
    enabled: true,
    label: 'Acceptation auto',
    description: 'Desc',
    isConfigurable: true,
    config: {},
    ...overrides,
  }
}

function mountCard(rule: PresetRule, isUpdating = false) {
  return mount(PresetRuleCard, {
    props: { rule, isUpdating },
  })
}

describe('PresetRuleCard', () => {
  it('does not render config inputs when isConfigurable is false', () => {
    const wrapper = mountCard(makeRule({ id: 'auto_reject_overweight', isConfigurable: false }))
    expect(wrapper.find('[data-test="config-min-rating"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="config-min-free-kg"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="config-min-free-hours"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="config-hours-before-departure"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders only the min-rating input for auto_accept_trusted', () => {
    const wrapper = mountCard(makeRule({ id: 'auto_accept_trusted', config: { minRating: 4.5 } }))
    expect(wrapper.find('[data-test="config-min-rating"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="config-min-free-kg"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="config-hours-before-departure"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders kg and hours inputs for alert_capacity_free', () => {
    const wrapper = mountCard(
      makeRule({ id: 'alert_capacity_free', config: { minFreeKg: 10, minFreeHours: 4 } }),
    )
    expect(wrapper.find('[data-test="config-min-free-kg"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="config-min-free-hours"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="config-min-rating"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders hours-before-departure input for alert_last_minute_bid', () => {
    const wrapper = mountCard(
      makeRule({ id: 'alert_last_minute_bid', config: { hoursBeforeDeparture: 48 } }),
    )
    expect(wrapper.find('[data-test="config-hours-before-departure"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits update-config with the rule id and edited minRating on change', async () => {
    const wrapper = mountCard(makeRule({ id: 'auto_accept_trusted', config: { minRating: 4 } }))
    const input = wrapper.find('[data-test="config-min-rating"]')
    await input.setValue('4.7')
    await input.trigger('change')
    const emitted = wrapper.emitted('update-config')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['auto_accept_trusted', { minRating: 4.7 }])
    wrapper.unmount()
  })

  it('emits update-config with both kg and hours for alert_capacity_free on change', async () => {
    const wrapper = mountCard(
      makeRule({ id: 'alert_capacity_free', config: { minFreeKg: 10, minFreeHours: 4 } }),
    )
    const kgInput = wrapper.find('[data-test="config-min-free-kg"]')
    await kgInput.setValue('20')
    await kgInput.trigger('change')
    const emitted = wrapper.emitted('update-config')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['alert_capacity_free', { minFreeKg: 20, minFreeHours: 4 }])
    wrapper.unmount()
  })

  it('updates local config inputs when the rule prop config changes', async () => {
    const wrapper = mountCard(makeRule({ id: 'auto_accept_trusted', config: { minRating: 4 } }))
    await wrapper.setProps({
      rule: makeRule({ id: 'auto_accept_trusted', config: { minRating: 4.9 } }),
    })
    const input = wrapper.find('[data-test="config-min-rating"]')
    expect((input.element as HTMLInputElement).value).toBe('4.9')
    wrapper.unmount()
  })
})
