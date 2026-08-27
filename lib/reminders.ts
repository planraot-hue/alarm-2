import { eventStartAt } from './dates'
import type { AppEvent, ReminderOffset } from './types'

export interface DueReminder {
  key: string
  event: AppEvent
  offset: ReminderOffset
  /** เวลาที่ควรเตือน */
  dueAt: Date
}

export const OFFSET_LABEL: Record<number, string> = {
  4320: 'อีก 3 วันจะถึงนัด',
  1440: 'พรุ่งนี้มีนัดแล้วนะ',
  60: 'อีก 1 ชั่วโมงถึงเวลานัด',
}

/** ไม่เตือนย้อนหลังเกินช่วงนี้ กันแบนเนอร์เด้งพรวดตอนเปิดเว็บครั้งแรก */
const GRACE_MS = 12 * 60 * 60 * 1000

export function reminderKey(eventId: string, offset: ReminderOffset): string {
  return `${eventId}:${offset}`
}

/**
 * หา reminder ที่ถึงกำหนดแล้วและยังไม่เคยยิง
 * เงื่อนไข: now >= dueAt, ยังไม่เลยเวลานัดจริง และ dueAt ไม่เก่ากว่า GRACE_MS
 */
export function findDueReminders(events: AppEvent[], fired: Set<string>, now: Date): DueReminder[] {
  const due: DueReminder[] = []

  for (const ev of events) {
    const startAt = eventStartAt(ev)
    for (const offset of ev.reminders ?? []) {
      const key = reminderKey(ev.id, offset)
      if (fired.has(key)) continue

      const dueAt = new Date(startAt.getTime() - offset * 60_000)
      const elapsed = now.getTime() - dueAt.getTime()
      if (elapsed < 0) continue // ยังไม่ถึงเวลาเตือน
      if (elapsed > GRACE_MS) continue // เก่าเกินไป
      if (now.getTime() > startAt.getTime()) continue // เลยเวลานัดไปแล้ว

      due.push({ key, event: ev, offset, dueAt })
    }
  }

  return due.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
}

/** ขอสิทธิ์แจ้งเตือน — ต้องเรียกจากการกดปุ่มของผู้ใช้เท่านั้น */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/** ยิง desktop notification ถ้าได้รับอนุญาต (แบนเนอร์ในหน้าเว็บทำแยกเสมอ) */
export function fireSystemNotification(item: DueReminder): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const time = item.event.allDay ? 'ทั้งวัน' : `${item.event.startTime ?? ''} น.`
  try {
    new Notification(`⏰ ${OFFSET_LABEL[item.offset] ?? 'ใกล้ถึงนัดแล้ว'}`, {
      body: `${item.event.title}\n${time}${item.event.location ? ` · ${item.event.location}` : ''}`,
      tag: item.key,
    })
  } catch {
    /* บางเบราว์เซอร์บล็อก constructor นี้ — แบนเนอร์ในหน้ายังทำงานปกติ */
  }
}
