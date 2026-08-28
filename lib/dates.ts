import type { AppEvent } from './types'

export const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

/** ตัวย่อเดือนแบบไทย — ตัดคำ 3 ตัวอักษรตรง ๆ จะได้ "สิง" ซึ่งไม่ใช่ตัวย่อที่ถูก */
export const MONTHS_TH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** แปลง Date -> 'YYYY-MM-DD' โดยอิงเวลาท้องถิ่น (ไม่ใช่ UTC) */
export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** แปลง 'YYYY-MM-DD' -> Date เวลาเที่ยงคืนท้องถิ่น */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDaysKey(key: string, days: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

/** ปฏิทินเดือน: คืน 42 ช่อง (6 สัปดาห์) เริ่มวันอาทิตย์ */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/** นัดนี้ครอบคลุมวันนั้นหรือไม่ (รองรับนัดหลายวัน) */
export function eventCoversDate(ev: AppEvent, dateKey: string): boolean {
  const end = ev.endDate && ev.endDate >= ev.startDate ? ev.endDate : ev.startDate
  return dateKey >= ev.startDate && dateKey <= end
}

export function eventsOnDate(events: AppEvent[], dateKey: string): AppEvent[] {
  return events
    .filter((ev) => eventCoversDate(ev, dateKey))
    .sort((a, b) => {
      // ทั้งวันขึ้นก่อน แล้วเรียงตามเวลาเริ่ม
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
      return (a.startTime ?? '').localeCompare(b.startTime ?? '')
    })
}

/** เวลาที่ใช้อ้างอิงสำหรับแจ้งเตือน — นัดทั้งวันถือว่าเริ่ม 09:00 */
export function eventStartAt(ev: AppEvent): Date {
  const d = fromKey(ev.startDate)
  if (ev.allDay || !ev.startTime) {
    d.setHours(9, 0, 0, 0)
    return d
  }
  const [h, m] = ev.startTime.split(':').map(Number)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d
}

/** เช่น "จันทร์ที่ 5 สิงหาคม 2568" */
export function formatLongDateTH(key: string): string {
  const d = fromKey(key)
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return `${dayNames[d.getDay()]}ที่ ${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`
}

/** ข้อความช่วงวัน–เวลาแบบย่อสำหรับการ์ด */
export function formatRange(ev: AppEvent): string {
  const multiDay = ev.endDate && ev.endDate > ev.startDate
  const datePart = multiDay
    ? `${shortDate(ev.startDate)} – ${shortDate(ev.endDate)}`
    : shortDate(ev.startDate)

  if (ev.allDay) return `${datePart} · ทั้งวัน`
  const timePart = ev.endTime ? `${ev.startTime} – ${ev.endTime} น.` : `${ev.startTime} น.`
  return `${datePart} · ${timePart}`
}

export function shortDate(key: string): string {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]}`
}

/** "อีก 2 วัน 3 ชม." / "ผ่านมาแล้ว" */
export function humanCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'ถึงเวลาแล้ว'
  const mins = Math.floor(diff / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const restMins = mins % 60
  if (days > 0) return `อีก ${days} วัน ${hours} ชม.`
  if (hours > 0) return `อีก ${hours} ชม. ${restMins} นาที`
  return `อีก ${restMins} นาที`
}

/** 7 วันของสัปดาห์ที่วันนั้นอยู่ เริ่มวันอาทิตย์ */
export function weekOf(dateKey: string): string[] {
  const d = fromKey(dateKey)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start)
    x.setDate(start.getDate() + i)
    return toKey(x)
  })
}

/** ข้อความหัวสัปดาห์ เช่น "31 ส.ค. – 6 ก.ย. 2568" */
export function formatWeekRange(days: string[]): string {
  const first = fromKey(days[0])
  const last = fromKey(days[days.length - 1])
  return `${shortDate(days[0])} – ${shortDate(days[days.length - 1])} ${
    first.getFullYear() === last.getFullYear() ? last.getFullYear() + 543 : ''
  }`.trim()
}

export const DAY_NAMES_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

export function weekdayShort(dateKey: string): string {
  return WEEKDAYS_TH[fromKey(dateKey).getDay()]
}
