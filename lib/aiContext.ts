/**
 * แปลงข้อมูลของผู้ใช้เป็นข้อความสั้น ๆ ให้ Gemini อ่าน
 *
 * ต้องจำกัดขนาดให้แน่นอน คนที่มีนัดเป็นพันรายการจะทำให้ prompt ใหญ่จน
 * โควตาฟรีหมดตั้งแต่คำถามแรก จึงตัดเฉพาะช่วงที่เกี่ยวข้องกับ "ตอนนี้"
 */
import { addDaysKey, formatRange, formatLongDateTH, shortDate } from './dates'
import {
  type AppEvent,
  type Habit,
  type Mood,
  type StickyNote,
  getMoodOption,
  habitLogKey,
} from './types'

/** ช่วงนัดหมายที่ส่งให้ AI — ย้อนหลังไว้ตอบ "เมื่อวานมีอะไร" ได้ด้วย */
export const CONTEXT_DAYS_BACK = 7
export const CONTEXT_DAYS_AHEAD = 30
export const MAX_CONTEXT_EVENTS = 40
export const MAX_CONTEXT_NOTES = 20
const MOOD_DAYS = 14
const HABIT_STREAK_DAYS = 7

export interface ContextInput {
  today: string
  events: AppEvent[]
  moods: Mood[]
  habits: Habit[]
  habitLogs: Set<string> | string[]
  notes: StickyNote[]
}

function eventLine(ev: AppEvent): string {
  const bits = [`- ${ev.title} (${formatRange(ev)})`]
  if (ev.location) bits.push(`สถานที่: ${ev.location}`)
  if (ev.note) bits.push(`โน้ต: ${ev.note}`)
  if (ev.attachments.length) bits.push(`ไฟล์แนบ ${ev.attachments.length} ไฟล์`)
  return bits.join(' | ')
}

export function buildUserContext(input: ContextInput): string {
  const { today, events, moods, habits, notes } = input
  const logs = input.habitLogs instanceof Set ? input.habitLogs : new Set(input.habitLogs)

  const from = addDaysKey(today, -CONTEXT_DAYS_BACK)
  const to = addDaysKey(today, CONTEXT_DAYS_AHEAD)

  const sections: string[] = []

  sections.push(`# วันนี้\n${formatLongDateTH(today)} (${today})`)

  /* ---------- นัดหมาย ---------- */
  // นัดหลายวันนับว่าอยู่ในช่วงถ้ามีวันไหนก็ได้ทับกับช่วงที่สนใจ
  const inRange = events
    .filter((ev) => {
      const end = ev.endDate && ev.endDate >= ev.startDate ? ev.endDate : ev.startDate
      return end >= from && ev.startDate <= to
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))

  const shown = inRange.slice(0, MAX_CONTEXT_EVENTS)
  const past = shown.filter((ev) => (ev.endDate || ev.startDate) < today)
  const todayEvents = shown.filter(
    (ev) => ev.startDate <= today && (ev.endDate || ev.startDate) >= today
  )
  const future = shown.filter((ev) => ev.startDate > today)

  const eventLines: string[] = []
  eventLines.push(`# นัดหมาย (${shortDate(from)} ถึง ${shortDate(to)})`)
  if (shown.length === 0) {
    eventLines.push('ไม่มีนัดหมายในช่วงนี้')
  } else {
    if (todayEvents.length) eventLines.push(`\n## วันนี้\n${todayEvents.map(eventLine).join('\n')}`)
    if (future.length) eventLines.push(`\n## ที่กำลังจะถึง\n${future.map(eventLine).join('\n')}`)
    if (past.length) eventLines.push(`\n## ที่ผ่านมาแล้ว\n${past.map(eventLine).join('\n')}`)
    if (inRange.length > shown.length) {
      eventLines.push(`\n(มีอีก ${inRange.length - shown.length} นัดที่ไม่ได้แสดงเพราะรายการยาวเกิน)`)
    }
  }
  sections.push(eventLines.join('\n'))

  /* ---------- อารมณ์ ---------- */
  const moodFrom = addDaysKey(today, -MOOD_DAYS)
  const recentMoods = moods
    .filter((m) => m.day >= moodFrom && m.day <= today)
    .sort((a, b) => b.day.localeCompare(a.day))

  sections.push(
    `# อารมณ์ ${MOOD_DAYS} วันล่าสุด\n` +
      (recentMoods.length === 0
        ? 'ยังไม่ได้บันทึกอารมณ์'
        : recentMoods
            .map((m) => `- ${m.day}: ${m.emoji} ${getMoodOption(m.emoji)?.label ?? ''}`.trimEnd())
            .join('\n'))
  )

  /* ---------- นิสัย ---------- */
  const habitDays = Array.from({ length: HABIT_STREAK_DAYS }, (_, i) => addDaysKey(today, -i))
  sections.push(
    `# นิสัยที่ติดตาม (สถิติ ${HABIT_STREAK_DAYS} วันล่าสุด)\n` +
      (habits.length === 0
        ? 'ยังไม่ได้ตั้งนิสัยอะไรไว้'
        : habits
            .map((h) => {
              const doneDays = habitDays.filter((d) => logs.has(habitLogKey(h.id, d)))
              const doneToday = logs.has(habitLogKey(h.id, today))
              return `- ${h.icon} ${h.name}: ทำไป ${doneDays.length}/${HABIT_STREAK_DAYS} วัน | วันนี้${doneToday ? 'ทำแล้ว' : 'ยังไม่ได้ทำ'}`
            })
            .join('\n'))
  )

  /* ---------- โน้ต ---------- */
  const shownNotes = notes.filter((n) => n.body.trim()).slice(0, MAX_CONTEXT_NOTES)
  sections.push(
    `# โน้ตบนกระดาน\n` +
      (shownNotes.length === 0
        ? 'ยังไม่มีโน้ต'
        : shownNotes.map((n) => `- ${n.body.replace(/\n/g, ' ')}`).join('\n'))
  )

  return sections.join('\n\n')
}
