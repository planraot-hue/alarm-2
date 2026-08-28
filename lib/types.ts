export type ReminderOffset = 4320 | 1440 | 60 // นาที: 3 วัน / 1 วัน / 1 ชั่วโมง

export const REMINDER_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: 4320, label: 'ล่วงหน้า 3 วัน' },
  { value: 1440, label: 'ล่วงหน้า 1 วัน' },
  { value: 60, label: 'ล่วงหน้า 1 ชั่วโมง' },
]

export const DEFAULT_REMINDERS: ReminderOffset[] = [4320, 1440, 60]

export type CategoryId =
  | 'meeting'
  | 'health'
  | 'study'
  | 'travel'
  | 'party'
  | 'work'
  | 'other'

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  /** path ของไฟล์ใน Supabase Storage bucket 'attachments' — {user_id}/{attachment_id} */
  storagePath: string
}

export interface AppEvent {
  id: string
  title: string
  category: CategoryId
  /** 'YYYY-MM-DD' */
  startDate: string
  /** 'YYYY-MM-DD' — เท่ากับ startDate ถ้าเป็นนัดวันเดียว */
  endDate: string
  allDay: boolean
  /** 'HH:mm' — ใช้เมื่อ allDay = false */
  startTime?: string
  endTime?: string
  location?: string
  note?: string
  reminders: ReminderOffset[]
  attachments: Attachment[]
  createdAt: number
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
