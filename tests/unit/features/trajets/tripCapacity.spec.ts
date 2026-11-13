import { describe, it, expect } from 'vitest'
import { capacityView, isVolumeTrip, priceLabel } from '@/features/trajets/lib/tripCapacity'

const kgTrip = { availableWeightKg: 20, usedWeightKg: 15, volumeCapacityM3: null, availableVolumeM3: null, pricePerKg: 7, pricePerM3: null, currency: 'EUR' }
const boatTrip = { availableWeightKg: null, usedWeightKg: null, volumeCapacityM3: 12, availableVolumeM3: 7.5, pricePerKg: null, pricePerM3: 120, currency: 'EUR' }

describe('tripCapacity', () => {
  it('détecte un trajet au volume', () => {
    expect(isVolumeTrip(kgTrip)).toBe(false)
    expect(isVolumeTrip(boatTrip)).toBe(true)
  })

  it('capacité en kilos', () => {
    expect(capacityView(kgTrip)).toEqual({ pct: 75, label: '15 / 20 kg' })
    expect(capacityView({ ...kgTrip, availableWeightKg: 0, usedWeightKg: 0 }).pct).toBe(0)
  })

  it('capacité en m³', () => {
    expect(capacityView(boatTrip)).toEqual({ pct: 38, label: '4,5 / 12 m³' })
    expect(capacityView({ ...boatTrip, availableVolumeM3: null }).pct).toBe(0)
    expect(capacityView({ ...boatTrip, volumeCapacityM3: 0, availableVolumeM3: 0 }).pct).toBe(0)
  })

  it('capacité inconnue : libellé vide, jamais de null', () => {
    expect(capacityView({ ...kgTrip, availableWeightKg: null, volumeCapacityM3: null })).toEqual({ pct: 0, label: '' })
  })

  it('prix au kilo, au m³ ou tiret', () => {
    expect(priceLabel(kgTrip)).toContain('/kg')
    expect(priceLabel(boatTrip)).toContain('/m³')
    expect(priceLabel({ ...boatTrip, pricePerM3: null })).toBe('-')
  })
})
