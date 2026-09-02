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

/* ============ Mood Tracker ============ */

export interface MoodOption {
  emoji: string
  label: string
  color: string
}

export const MOODS: MoodOption[] = [
  { emoji: '😊', label: 'ดีมาก', color: '#FFE8A3' },
  { emoji: '🥳', label: 'ฟินสุด ๆ', color: '#FFC2D1' },
  { emoji: '😌', label: 'สงบ ๆ', color: '#C6F1D6' },
  { emoji: '😴', label: 'ง่วง/เพลีย', color: '#BEE3F8' },
  { emoji: '😐', label: 'เฉย ๆ', color: '#DCE5E4' },
  { emoji: '😟', label: 'กังวล', color: '#E2D6FF' },
  { emoji: '😭', label: 'แย่เลย', color: '#FFD8BE' },
]

export function getMoodOption(emoji: string): MoodOption | undefined {
  return MOODS.find((m) => m.emoji === emoji)
}

export interface Mood {
  /** 'YYYY-MM-DD' */
  day: string
  emoji: string
  note?: string
}

/* ============ Habit Tracker ============ */

export type PastelColor = 'pink' | 'sky' | 'mint' | 'lemon' | 'lilac' | 'peach'

export const PASTELS: Record<PastelColor, { bg: string; accent: string }> = {
  pink: { bg: '#FFC2D1', accent: '#C25A7C' },
  sky: { bg: '#BEE3F8', accent: '#3E7CA6' },
  mint: { bg: '#C6F1D6', accent: '#3E8C63' },
  lemon: { bg: '#FFE8A3', accent: '#B08A20' },
  lilac: { bg: '#E2D6FF', accent: '#6D55B0' },
  peach: { bg: '#FFD8BE', accent: '#B36C3C' },
}

export const PASTEL_KEYS = Object.keys(PASTELS) as PastelColor[]

export function getPastel(color: string) {
  return PASTELS[color as PastelColor] ?? PASTELS.pink
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: PastelColor
  sortOrder: number
}

/** ไอเดียนิสัยยอดฮิต ไว้ให้กดเพิ่มเร็ว ๆ ตอนยังไม่มีอะไรเลย */
export const HABIT_PRESETS: { name: string; icon: string; color: PastelColor }[] = [
  { name: 'ดื่มน้ำ 8 แก้ว', icon: '💧', color: 'sky' },
  { name: 'ออกกำลังกาย', icon: '🏃', color: 'mint' },
  { name: 'อ่านหนังสือ', icon: '📖', color: 'lilac' },
  { name: 'นอนก่อนเที่ยงคืน', icon: '🌙', color: 'peach' },
  { name: 'ยืดเส้นยืดสาย', icon: '🧘', color: 'pink' },
  { name: 'กินผัก', icon: '🥗', color: 'lemon' },
]

/** คีย์ของ habit log หนึ่งช่อง */
export function habitLogKey(habitId: string, day: string): string {
  return `${habitId}:${day}`
}

/* ============ Sticky Notes ============ */

export interface StickyNote {
  id: string
  body: string
  color: PastelColor
  sortOrder: number
}

/* ============ มุมมอง ============ */

export type ViewMode = 'day' | 'week' | 'month'

/* ============ Chat Bot ============ */

export interface ChatMessage {
  id: string
  /** 'model' คือฝั่ง AI — ใช้ชื่อตามที่ Gemini API กำหนด จะได้ส่งต่อได้เลยไม่ต้องแปลง */
  role: 'user' | 'model'
  body: string
  createdAt: number
}

/** ความยาวสูงสุดของข้อความที่ผู้ใช้พิมพ์ กันยิง prompt ใหญ่จนโควตาฟรีหมด */
export const MAX_CHAT_CHARS = 2000

/** จำนวนข้อความย้อนหลังที่ส่งไปให้ AI เป็นบริบท */
export const CHAT_HISTORY_LIMIT = 12
