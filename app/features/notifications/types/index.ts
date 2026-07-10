// app/features/notifications/types/index.ts

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, string>
  read: boolean
  createdAt: string
}

export interface NotificationPage {
  content: AppNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
