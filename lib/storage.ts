/**
 * localStorage เก็บเฉพาะสถานะที่เป็นของ "เครื่องนี้" เท่านั้น
 * นัดหมายและไฟล์แนบย้ายไปอยู่ Supabase หมดแล้ว (ดู lib/db.ts)
 */

const FIRED_KEY = 'alarm2.fired.v1'

function isBrowser() {
  return typeof window !== 'undefined'
}

/* ---------- คีย์แจ้งเตือนที่ยิงไปแล้ว ---------- */
// เก็บฝั่งเครื่องโดยตั้งใจ: แจ้งเตือนเป็นเรื่องของเบราว์เซอร์ที่เปิดอยู่
// ถ้าเก็บรวมใน Supabase เปิดเว็บอีกเครื่องจะไม่ได้รับเตือนเลย

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
