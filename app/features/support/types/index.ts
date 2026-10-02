// app/features/support/types/index.ts

export type SupportCategory = 'ACCOUNT' | 'KYC' | 'PAYMENT' | 'TRIP' | 'PACKAGE' | 'DELIVERY' | 'OTHER'

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  ACCOUNT: 'Mon compte',
  KYC: 'Vérification d’identité',
  PAYMENT: 'Paiement et versements',
  TRIP: 'Mes trajets',
  PACKAGE: 'Un colis',
  DELIVERY: 'Livraison',
  OTHER: 'Autre',
}

export type SupportTicketStatus = 'NEW' | 'ASSIGNED' | 'WAITING_USER' | 'WAITING_SUPPORT' | 'RESOLVED'

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  NEW: 'Envoyé',
  ASSIGNED: 'Pris en charge',
  WAITING_USER: 'Réponse attendue de ta part',
  WAITING_SUPPORT: 'En cours de traitement',
  RESOLVED: 'Résolu',
}

export interface SupportAttachment {
  id: string
  url: string
  contentType: string
  sizeBytes: number
}

export interface SupportMessage {
  id: string
  /** USER ou ADMIN. */
  authorType: string
  content: string | null
  createdAt: string
  attachments: SupportAttachment[]
}

export interface SupportTicket {
  id: string
  category: string
  subject: string
  status: SupportTicketStatus | string
  createdAt: string
  lastMessageAt: string | null
  resolvedAt: string | null
  /** Présents sur le détail d'un ticket seulement. */
  messages?: SupportMessage[]
  unreadCount: number
  lastMessagePreview?: string | null
  lastMessageFromAdmin?: boolean | null
}

export interface SupportTicketPage {
  content: SupportTicket[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SupportPredefinedReply {
  code: string
  category: string
  question: string
  answer: string
}

export interface CreateSupportTicketPayload {
  category: SupportCategory
  subject: string
  message: string
}
