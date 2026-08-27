import { DEFAULT_REMINDERS, type AppEvent, newId } from './types'

const EVENTS_KEY = 'alarm2.events.v1'
const AUTH_KEY = 'alarm2.auth.v1'
const FIRED_KEY = 'alarm2.fired.v1'

function isBrowser() {
  return typeof window !== 'undefined'
}

/* ---------- นัดหมาย ---------- */

/**
 * เติมฟิลด์ที่ขาดให้ครบ กันหน้าเว็บพังเวลาเจอข้อมูลเก่าหรือไฟล์ JSON ที่ผู้ใช้แก้มาเอง
 * คืน null ถ้าข้อมูลใช้ไม่ได้จริง ๆ (ไม่มีชื่อเรื่องหรือไม่มีวันเริ่ม)
 */
export function normalizeEvent(raw: unknown): AppEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Partial<AppEvent>

  const title = typeof e.title === 'string' ? e.title.trim() : ''
  const startDate = typeof e.startDate === 'string' ? e.startDate : ''
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null

  const endDate =
    typeof e.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.endDate) && e.endDate >= startDate
      ? e.endDate
      : startDate

  const allDay = e.allDay === true

  return {
    id: typeof e.id === 'string' && e.id ? e.id : newId(),
    title,
    category: typeof e.category === 'string' ? (e.category as AppEvent['category']) : 'other',
    startDate,
    endDate,
    allDay,
    startTime: !allDay && typeof e.startTime === 'string' ? e.startTime : undefined,
    endTime: !allDay && typeof e.endTime === 'string' ? e.endTime : undefined,
    location: typeof e.location === 'string' ? e.location : undefined,
    note: typeof e.note === 'string' ? e.note : undefined,
    reminders: Array.isArray(e.reminders) ? e.reminders : DEFAULT_REMINDERS,
    attachments: Array.isArray(e.attachments) ? e.attachments : [],
    createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
  }
}

export function normalizeEvents(raw: unknown): AppEvent[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeEvent).filter((e): e is AppEvent => e !== null)
}

export function loadEvents(): AppEvent[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY)
    if (!raw) return []
    return normalizeEvents(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveEvents(events: AppEvent[]): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch (err) {
    console.error('บันทึกนัดหมายไม่สำเร็จ', err)
  }
}

/* ---------- สถานะล็อกอิน ---------- */

export function isLoggedIn(): boolean {
  if (!isBrowser()) return false
  return window.localStorage.getItem(AUTH_KEY) === 'yes'
}

export function setLoggedIn(value: boolean): void {
  if (!isBrowser()) return
  if (value) window.localStorage.setItem(AUTH_KEY, 'yes')
  else window.localStorage.removeItem(AUTH_KEY)
}

/* ---------- คีย์แจ้งเตือนที่ยิงไปแล้ว ---------- */

export function loadFired(): string[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(FIRED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveFired(keys: string[]): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(keys))
  } catch {
    /* ไม่เป็นไร แค่จะเตือนซ้ำได้ */
  }
}

/** ล้างคีย์แจ้งเตือนของนัดนี้ทิ้ง (ใช้ตอนแก้ไข/ลบนัด) */
export function clearFiredFor(eventId: string): void {
  saveFired(loadFired().filter((k) => !k.startsWith(`${eventId}:`)))
}
