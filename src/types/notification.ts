export type NotificationType =
  | 'announcement'
  | 'obituary'
  | 'event'
  | 'dues_new'
  | 'dues_verified'
  | 'dues_rejected'
  | 'panic'
  | 'booking_approved'
  | 'booking_rejected'
  | 'complaint_update'
  | 'broadcast'
  | 'campaign'
  | 'visitor_status'
  | 'chat_private'
  | 'chat_group'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  entityId: string | null
  read: boolean
  waktu: string
  createdAt: number
}

export interface NotificationListResponse {
  items: Notification[]
  unread: number
}

export interface ChatUnreadSummary {
  groups: number
  private: number
  total: number
}
