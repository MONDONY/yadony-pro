import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  type Firestore,
} from 'firebase/firestore'
import { mapFirestoreMessage, type ChatMessage } from '@/features/messagerie/types/index'

/**
 * Firestore-backed chat, mirroring the mobile app data model:
 * conversations/{firestoreConversationId}/messages/{id}
 * with fields { senderId, body, imageUrl, type, sentAt, readAt }.
 */
export function firestoreChatService(db: Firestore) {
  function messagesCollection(firestoreConversationId: string) {
    return collection(db, 'conversations', firestoreConversationId, 'messages')
  }

  /** Subscribes to the 50 latest messages, delivered in chronological order. Returns an unsubscribe fn. */
  function subscribeMessages(
    firestoreConversationId: string,
    onMessages: (messages: ChatMessage[]) => void,
    onError?: (e: unknown) => void,
  ): () => void {
    const q = query(messagesCollection(firestoreConversationId), orderBy('sentAt', 'desc'), limit(50))
    return onSnapshot(
      q,
      (snap) => {
        const messages = snap.docs.map((d) => mapFirestoreMessage(d.id, d.data()))
        onMessages(messages.reverse())
      },
      (e) => onError?.(e),
    )
  }

  async function sendText(
    firestoreConversationId: string,
    senderFirebaseUid: string,
    body: string,
  ): Promise<void> {
    await addDoc(messagesCollection(firestoreConversationId), {
      senderId: senderFirebaseUid,
      body,
      imageUrl: null,
      type: 'TEXT',
      sentAt: new Date().toISOString(),
      readAt: null,
    })
  }

  return { subscribeMessages, sendText }
}
