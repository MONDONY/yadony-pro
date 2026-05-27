// app/features/tarifs/types/index.ts

export interface PriceGridItem {
  id: string
  label: string
  unitPriceNet: number
  unitPriceDisplay: number
  position: number
}

export interface PriceGridItemInput {
  label: string
  unitPriceNet: number
}

export type MoveDirection = 'up' | 'down'
