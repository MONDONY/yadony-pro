// app/features/messagerie/types/index.ts

export interface ConversationParticipant {
  id: string
  name: string
  avatarUrl: string | null
}

export interface Conversation {
  id: string
  bidId: string | null
  firestoreConversationId: string
  otherParticipant: ConversationParticipant
  lastMessagePreview: string | null
  lastMessageAt: string | null
  hasUnread: boolean
  tripOrigin: string | null
  tripDestination: string | null
  tripDate: string | null
  tripWeightKg: number | null
  bidStatus: string | null
  readOnly: boolean
  deletedBySelf: boolean
}

export interface ConversationPage {
  content: Conversation[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
