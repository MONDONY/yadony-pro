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

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'LOCATION'

export interface ChatMessage {
  id: string
  senderId: string
  body: string | null
  imageUrl: string | null
  type: ChatMessageType
  sentAt: string
  readAt: string | null
}

/** Maps a raw Firestore message document to a typed ChatMessage. */
export function mapFirestoreMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    senderId: typeof data.senderId === 'string' ? data.senderId : '',
    body: typeof data.body === 'string' ? data.body : null,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
    type: data.type === 'IMAGE' || data.type === 'LOCATION' ? data.type : 'TEXT',
    sentAt: typeof data.sentAt === 'string' ? data.sentAt : '',
    readAt: typeof data.readAt === 'string' ? data.readAt : null,
  }
}
