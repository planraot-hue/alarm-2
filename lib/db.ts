import { supabase } from './supabase'
import {
  DEFAULT_REMINDERS,
  type AppEvent,
  type Attachment,
  type Habit,
  type Mood,
  type ReminderOffset,
  type StickyNote,
  habitLogKey,
} from './types'

/** แถวในตาราง events (snake_case ตาม Postgres) */
interface EventRow {
  id: string
  user_id: string
  title: string
  category: string
  start_date: string
  end_date: string
  all_day: boolean
  start_time: string | null
  end_time: string | null
  location: string | null
  note: string | null
  reminders: number[] | null
  created_at: string
}

interface AttachmentRow {
  id: string
  event_id: string
  name: string
  mime_type: string | null
  size_bytes: number | null
  storage_path: string
}

/** Postgres คืนเวลาเป็น 'HH:MM:SS' แต่ <input type="time"> ต้องการ 'HH:MM' */
function trimTime(t: string | null): string | undefined {
  if (!t) return undefined
  return t.slice(0, 5)
}

function rowToEvent(row: EventRow, attachments: Attachment[]): AppEvent {
  return {
    id: row.id,
    title: row.title,
    category: row.category as AppEvent['category'],
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day,
    startTime: row.all_day ? undefined : trimTime(row.start_time),
    endTime: row.all_day ? undefined : trimTime(row.end_time),
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    reminders: (row.reminders?.length ? row.reminders : DEFAULT_REMINDERS) as ReminderOffset[],
    attachments,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function eventToRow(ev: AppEvent, userId: string) {
  return {
    id: ev.id,
    user_id: userId,
    title: ev.title,
    category: ev.category,
    start_date: ev.startDate,
    end_date: ev.endDate,
    all_day: ev.allDay,
    start_time: ev.allDay ? null : (ev.startTime ?? null),
    end_time: ev.allDay ? null : (ev.endTime ?? null),
    location: ev.location ?? null,
    note: ev.note ?? null,
    reminders: ev.reminders,
  }
}

function rowToAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    name: row.name,
    type: row.mime_type ?? '',
    size: Number(row.size_bytes ?? 0),
    storagePath: row.storage_path,
  }
}

/** โหลดนัดหมายทั้งหมดของผู้ใช้ปัจจุบัน (RLS กรอง user_id ให้เองอยู่แล้ว) */
export async function fetchEvents(): Promise<AppEvent[]> {
  const [eventsRes, attachRes] = await Promise.all([
    supabase.from('events').select('*').order('start_date', { ascending: true }),
    supabase.from('attachments').select('*'),
  ])

  if (eventsRes.error) throw eventsRes.error
  if (attachRes.error) throw attachRes.error

  const byEvent = new Map<string, Attachment[]>()
  for (const row of (attachRes.data ?? []) as AttachmentRow[]) {
    const list = byEvent.get(row.event_id) ?? []
    list.push(rowToAttachment(row))
    byEvent.set(row.event_id, list)
  }

  return ((eventsRes.data ?? []) as EventRow[]).map((row) =>
    rowToEvent(row, byEvent.get(row.id) ?? [])
  )
}

/**
 * เพิ่มหรือแก้ไขนัดหมาย พร้อมซิงก์รายการไฟล์แนบ
 * ไฟล์ถูกอัปโหลดไป Storage ตั้งแต่ตอนเลือกไฟล์แล้ว ตรงนี้บันทึกแค่ metadata
 */
export async function upsertEvent(ev: AppEvent, userId: string): Promise<void> {
  const { error } = await supabase.from('events').upsert(eventToRow(ev, userId))
  if (error) throw error

  const { data: existing, error: readErr } = await supabase
    .from('attachments')
    .select('id')
    .eq('event_id', ev.id)
  if (readErr) throw readErr

  const keepIds = new Set(ev.attachments.map((a) => a.id))
  const removed = (existing ?? []).filter((r) => !keepIds.has(r.id)).map((r) => r.id)
  const existingIds = new Set((existing ?? []).map((r) => r.id))
  const added = ev.attachments.filter((a) => !existingIds.has(a.id))

  if (removed.length) {
    const { error: delErr } = await supabase.from('attachments').delete().in('id', removed)
    if (delErr) throw delErr
  }

  if (added.length) {
    const { error: insErr } = await supabase.from('attachments').insert(
      added.map((a) => ({
        id: a.id,
        event_id: ev.id,
        user_id: userId,
        name: a.name,
        mime_type: a.type,
        size_bytes: a.size,
        storage_path: a.storagePath,
      }))
    )
    if (insErr) throw insErr
  }
}

/** ลบนัดหมาย — แถว attachments ถูกลบตามด้วย ON DELETE CASCADE */
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
/** แปลง error จาก Supabase เป็นข้อความไทยพร้อมบอกวิธีแก้ตามรหัสที่ได้จริง */
export function describeDbError(err: unknown): string {
  const e = err as { message?: string; code?: string; details?: string; hint?: string }
  const msg = e?.message ?? String(err)
  const code = e?.code ?? ''
  const lower = msg.toLowerCase()

  // ยังไม่ได้สร้างตาราง — สาเหตุที่พบบ่อยที่สุด
  if (code === '42P01' || code === 'PGRST205' || lower.includes('does not exist')) {
    return `ยังไม่มีตารางในฐานข้อมูล — ให้รัน supabase/schema.sql ใน SQL Editor ก่อน (${code || 'undefined table'}: ${msg})`
  }
  if (lower.includes('invalid api key') || lower.includes('jwt')) {
    return `anon key ไม่ถูกต้อง — เช็คค่า NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local (${msg})`
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'ต่อกับ Supabase ไม่ได้ — เช็คอินเทอร์เน็ตและค่า NEXT_PUBLIC_SUPABASE_URL'
  }
  // สองอันนี้รหัสเดียวกัน (42501) แต่คนละสาเหตุ ต้องแยกให้ชัด ไม่งั้นไล่แก้ผิดจุด
  if (lower.includes('permission denied')) {
    return `role authenticated ยังไม่ได้รับสิทธิ์บนตาราง — รัน schema.sql เวอร์ชันล่าสุดที่มีส่วน grant (${msg})`
  }
  if (code === '42501' || lower.includes('row-level security')) {
    return `RLS ปฏิเสธแถวนี้ — เช็คว่า policy ถูกสร้างครบตอนรัน schema.sql (${msg})`
  }
  return `${msg}${code ? ` (code ${code})` : ''}`
}

/* ============================================================
   Mood Tracker
   ============================================================ */

interface MoodRow {
  day: string
  emoji: string
  note: string | null
}

export async function fetchMoods(): Promise<Mood[]> {
  const { data, error } = await supabase.from('moods').select('day, emoji, note')
  if (error) throw error
  return ((data ?? []) as MoodRow[]).map((r) => ({
    day: r.day,
    emoji: r.emoji,
    note: r.note ?? undefined,
  }))
}

/** บันทึกอารมณ์ของวัน — primary key (user_id, day) ทำให้ upsert ทับของเดิมได้เลย */
export async function setMood(mood: Mood, userId: string): Promise<void> {
  const { error } = await supabase.from('moods').upsert({
    user_id: userId,
    day: mood.day,
    emoji: mood.emoji,
    note: mood.note ?? null,
  })
  if (error) throw error
}

export async function clearMood(day: string, userId: string): Promise<void> {
  const { error } = await supabase.from('moods').delete().eq('user_id', userId).eq('day', day)
  if (error) throw error
}

/* ============================================================
   Habit Tracker
   ============================================================ */

interface HabitRow {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, icon, color, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return ((data ?? []) as HabitRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color as Habit['color'],
    sortOrder: r.sort_order,
  }))
}

export async function upsertHabit(habit: Habit, userId: string): Promise<void> {
  const { error } = await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    sort_order: habit.sortOrder,
  })
  if (error) throw error
}

/** ลบนิสัย — habit_logs หายตามด้วย ON DELETE CASCADE */
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

/** คืนคีย์ 'habitId:day' ของวันที่ติ๊กแล้วทั้งหมด */
export async function fetchHabitLogs(): Promise<string[]> {
  const { data, error } = await supabase.from('habit_logs').select('habit_id, day')
  if (error) throw error
  return ((data ?? []) as { habit_id: string; day: string }[]).map((r) =>
    habitLogKey(r.habit_id, r.day)
  )
}

/** ติ๊ก = เพิ่มแถว, ติ๊กออก = ลบแถว */
export async function setHabitLog(
  habitId: string,
  day: string,
  done: boolean,
  userId: string
): Promise<void> {
  if (done) {
    const { error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, user_id: userId, day })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('day', day)
    if (error) throw error
  }
}

/* ============================================================
   Sticky Notes
   ============================================================ */

interface NoteRow {
  id: string
  body: string
  color: string
  sort_order: number
}

export async function fetchNotes(): Promise<StickyNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, body, color, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return ((data ?? []) as NoteRow[]).map((r) => ({
    id: r.id,
    body: r.body,
    color: r.color as StickyNote['color'],
    sortOrder: r.sort_order,
  }))
}

export async function upsertNote(note: StickyNote, userId: string): Promise<void> {
  const { error } = await supabase.from('notes').upsert({
    id: note.id,
    user_id: userId,
    body: note.body,
    color: note.color,
    sort_order: note.sortOrder,
  })
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
