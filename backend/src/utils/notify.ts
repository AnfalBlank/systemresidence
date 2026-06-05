import { db } from '../db/client.js'
import { newId } from './id.js'

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

interface NotifyArgs {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  entityId?: string
}

export async function notify(args: NotifyArgs): Promise<void> {
  await db.execute({
    sql: `INSERT INTO notifications (id, user_id, type, title, message, link, entity_id)
          VALUES (?,?,?,?,?,?,?)`,
    args: [
      newId('n'),
      args.userId,
      args.type,
      args.title,
      args.message,
      args.link ?? null,
      args.entityId ?? null,
    ],
  })
}

// Notify many users at once. Used for broadcasts, announcements, etc.
export async function notifyMany(
  userIds: string[],
  base: Omit<NotifyArgs, 'userId'>
): Promise<void> {
  for (const uid of userIds) {
    await notify({ ...base, userId: uid })
  }
}

// Get the active resident IDs matching a target spec
export async function resolveTargetUsers(
  targetType: 'Seluruh Warga' | 'Blok' | 'Lantai' | 'Unit' | 'Kelompok' | 'all',
  targetValue?: string | null
): Promise<string[]> {
  let sql = "SELECT id FROM residents WHERE account_status = 'Aktif'"
  const args: string[] = []
  if (targetType === 'Blok' && targetValue) {
    sql += ' AND blok = ?'; args.push(targetValue)
  } else if (targetType === 'Lantai' && targetValue) {
    sql += ' AND lantai = ?'; args.push(targetValue)
  } else if (targetType === 'Unit' && targetValue) {
    const parts = targetValue.split('-')
    if (parts.length === 3) {
      sql += ' AND blok = ? AND lantai = ? AND nomor_unit = ?'
      args.push(parts[0], parts[1], parts[2])
    }
  }
  const result = await db.execute({ sql, args })
  return result.rows.map((r) => String(r.id))
}
