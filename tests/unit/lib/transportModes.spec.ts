import { describe, it, expect } from 'vitest'
import { Plane, Ship, Car, Route } from 'lucide-vue-next'
import {
  PRO_BOAT_TRIP_CREATION_READY,
  proposableModes,
  chipModes,
  transportModeLabel,
  transportModeIcon,
  isRoad,
  isVerifiedCarrier,
  boatBlockedReason,
  BOAT_NOT_VERIFIED_MESSAGE,
} from '@/lib/transportModes'

describe('transportModes', () => {
  it('vérifié = GP Pro ou compte PRO', () => {
    expect(isVerifiedCarrier({ gpPro: true, proAccount: false })).toBe(true)
    expect(isVerifiedCarrier({ gpPro: false, proAccount: true })).toBe(true)
    expect(isVerifiedCarrier({ gpPro: false, proAccount: false })).toBe(false)
    expect(isVerifiedCarrier(null)).toBe(false)
    expect(isVerifiedCarrier(undefined)).toBe(false)
  })

  it('raison du blocage bateau', () => {
    expect(boatBlockedReason({ road: true, boat: false }, { gpPro: true, proAccount: true }))
      .toBe("Le mode Bateau n'est pas encore ouvert.")
    expect(boatBlockedReason({ road: true, boat: true }, { gpPro: false, proAccount: false }))
      .toBe(BOAT_NOT_VERIFIED_MESSAGE)
    expect(boatBlockedReason({ road: true, boat: true }, { gpPro: true, proAccount: false })).toBeNull()
  })

  it('bateau proposable à un transporteur vérifié quand le serveur l’ouvre', () => {
    expect(proposableModes({ road: true, boat: true }, { gpPro: true, proAccount: false }))
      .toEqual(['PLANE', 'BOAT', 'CAR'])
    expect(proposableModes({ road: false, boat: true }, { gpPro: false, proAccount: true }))
      .toEqual(['PLANE', 'BOAT'])
    expect(proposableModes({ road: true, boat: true }, { gpPro: false, proAccount: false }))
      .toEqual(['PLANE', 'CAR'])
    expect(proposableModes({ road: true, boat: false }, { gpPro: true, proAccount: true }))
      .toEqual(['PLANE', 'CAR'])
  })

  it('profil absent : jamais de bateau', () => {
    expect(proposableModes({ road: true, boat: true })).toEqual(['PLANE', 'CAR'])
  })

  it('la création bateau est livrée', () => {
    expect(PRO_BOAT_TRIP_CREATION_READY).toBe(true)
  })

  it('route éteinte : avion seul', () => {
    expect(proposableModes({ road: false, boat: true })).toEqual(['PLANE'])
  })

  it('route allumée : avion et route, jamais bateau', () => {
    expect(proposableModes({ road: true, boat: true })).toEqual(['PLANE', 'CAR'])
  })

  it('le mode courant non proposable reste visible', () => {
    expect(chipModes({ road: false, boat: false }, 'BUS')).toEqual(['PLANE', 'BUS'])
    expect(chipModes({ road: false, boat: false }, 'TRAIN')).toEqual(['PLANE', 'TRAIN'])
    expect(chipModes({ road: false, boat: false }, 'BOAT')).toEqual(['PLANE', 'BOAT'])
    expect(chipModes({ road: true, boat: false }, 'CAR')).toEqual(['PLANE', 'CAR'])
    expect(chipModes({ road: true, boat: false }, null)).toEqual(['PLANE', 'CAR'])
  })

  it('libellés par mode', () => {
    expect(transportModeLabel('PLANE')).toBe('Avion')
    expect(transportModeLabel('BOAT')).toBe('Bateau')
    expect(transportModeLabel('CAR')).toBe('Route')
    expect(transportModeLabel('BUS')).toBe('Route')
    expect(transportModeLabel('TRAIN')).toBe('Train')
    expect(transportModeLabel('OTHER')).toBe('Autre')
    expect(transportModeLabel(null)).toBe('Peu importe')
    expect(transportModeLabel(undefined)).toBe('Peu importe')
    expect(transportModeLabel('XYZ')).toBe('Transport')
  })

  it('icônes : bateau Ship, train Route, jamais l’avion par défaut', () => {
    expect(transportModeIcon('PLANE')).toBe(Plane)
    expect(transportModeIcon('BOAT')).toBe(Ship)
    expect(transportModeIcon('CAR')).toBe(Car)
    expect(transportModeIcon('BUS')).toBe(Car)
    expect(transportModeIcon('TRAIN')).toBe(Route)
    expect(transportModeIcon(null)).toBe(Route)
    expect(transportModeIcon('XYZ')).toBe(Route)
  })

  it('isRoad : CAR et BUS', () => {
    expect(isRoad('CAR')).toBe(true)
    expect(isRoad('BUS')).toBe(true)
    expect(isRoad('PLANE')).toBe(false)
    expect(isRoad(null)).toBe(false)
  })
})
