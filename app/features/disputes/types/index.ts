// app/features/disputes/types/index.ts

export interface Dispute {
  id: string
  bidId: string
  type: string
  status: string
  refundFrozen: boolean
  createdAt: string
}

export const DISPUTE_TYPE_LABELS: Record<string, string> = {
  DAMAGED: 'Colis endommagé',
  LOST: 'Colis perdu',
  LATE: 'Retard de livraison',
  CONTENT_MISMATCH: 'Contenu non conforme',
  OTHER: 'Autre',
}

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En cours d’examen',
  RESOLVED: 'Résolu',
  REJECTED: 'Rejeté',
}
