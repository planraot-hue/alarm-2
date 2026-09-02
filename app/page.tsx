'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AuthGate from '@/components/AuthGate'
import BackupBar from '@/components/BackupBar'
import BookingLinks from '@/components/BookingLinks'
import CalendarMonth from '@/components/CalendarMonth'
import ChatBot from '@/components/ChatBot'
import ConfigNotice from '@/components/ConfigNotice'
import DaySummary from '@/components/DaySummary'
import EventForm from '@/components/EventForm'
import HabitTracker from '@/components/HabitTracker'
import MoodPicker from '@/components/MoodPicker'
import ReminderHost from '@/components/ReminderHost'
import StickyBoard from '@/components/StickyBoard'
import ViewSwitcher from '@/components/ViewSwitcher'
import WeekView from '@/components/WeekView'
import { removeStorageFiles } from '@/lib/attachments'
import {
  clearMood,
  deleteEvent,
  deleteHabit,
  deleteNote,
  describeDbError,
  fetchEvents,
  fetchHabitLogs,
  fetchHabits,
  fetchMoods,
  fetchNotes,
  setHabitLog,
  setMood,
  upsertEvent,
  upsertHabit,
  upsertNote,
} from '@/lib/db'
import { addDaysKey, eventStartAt, fromKey, todayKey } from '@/lib/dates'
import { clearFiredFor } from '@/lib/storage'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  type AppEvent,
  type Habit,
  type Mood,
  type StickyNote,
  type ViewMode,
  habitLogKey,
} from '@/lib/types'

export default function Page() {
  // ready กันปัญหา hydration — ทุกอย่างที่อ่านเวลาปัจจุบัน/session ต้องรอ mount ก่อน
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [dbError, setDbError] = useState('')

  const [events, setEvents] = useState<AppEvent[]>([])
  const [moods, setMoods] = useState<Mood[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitLogs, setHabitLogs] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<StickyNote[]>([])

  const [view, setView] = useState<ViewMode>('month')
  const [selectedKey, setSelectedKey] = useState('2000-01-01')
  const [monthView, setMonthView] = useState({ year: 2000, month: 0 })
  const [now, setNow] = useState(() => new Date(0))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AppEvent | null>(null)

  const userId = session?.user.id ?? ''

  useEffect(() => {
    const today = new Date()
    setSelectedKey(todayKey())
    setMonthView({ year: today.getFullYear(), month: today.getMonth() })
    setNow(today)

    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // อัปเดตเวลาทุกนาที เพื่อให้ข้อความนับถอยหลังสดเสมอ
  useEffect(() => {
    if (!ready) return
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [ready])

  const reload = useCallback(async () => {
    setLoading(true)
    setDbError('')
    try {
      const [ev, md, hb, lg, nt] = await Promise.all([
        fetchEvents(),
        fetchMoods(),
        fetchHabits(),
        fetchHabitLogs(),
        fetchNotes(),
      ])
      setEvents(ev)
      setMoods(md)
      setHabits(hb)
      setHabitLogs(new Set(lg))
      setNotes(nt)
    } catch (err) {
      console.error(err)
      setDbError(describeDbError(err))
    }
    setLoading(false)
  }, [])

  // ล็อกอินแล้วดึงข้อมูลของบัญชีนั้นมา, ล็อกเอาต์แล้วล้างทิ้ง
  useEffect(() => {
    if (!session) {
      setEvents([])
      setMoods([])
      setHabits([])
      setHabitLogs(new Set())
      setNotes([])
      return
    }
    reload()
  }, [session, reload])

  /** เขียนขึ้นเซิร์ฟเวอร์ ถ้าพลาดให้ดึงข้อมูลจริงกลับมาแทนค่าที่แสดงไว้ล่วงหน้า */
  const push = useCallback(
    async (label: string, run: () => Promise<void>) => {
      setDbError('')
      try {
        await run()
      } catch (err) {
        console.error(err)
        setDbError(`${label}ไม่สำเร็จ: ${describeDbError(err)}`)
        await reload()
      }
    },
    [reload]
  )

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  /* ---------- นัดหมาย ---------- */

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(ev: AppEvent) {
    setEditing(ev)
    setFormOpen(true)
  }

  async function handleSaveEvent(ev: AppEvent) {
    setFormOpen(false)
    setEditing(null)

    // แสดงผลทันทีก่อน แล้วค่อยยืนยันกับเซิร์ฟเวอร์
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === ev.id)
      return exists ? prev.map((e) => (e.id === ev.id ? ev : e)) : [...prev, ev]
    })
    clearFiredFor(ev.id) // เวลานัดอาจเปลี่ยน ให้เตือนใหม่ตามเวลาที่แก้

    setSelectedKey(ev.startDate)
    const d = fromKey(ev.startDate)
    setMonthView({ year: d.getFullYear(), month: d.getMonth() })

    await push('บันทึกนัดหมาย', () => upsertEvent(ev, userId))
  }

  async function handleDeleteEvent(ev: AppEvent) {
    if (!window.confirm(`ลบ "${ev.title}" ใช่ไหม?`)) return
    setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    clearFiredFor(ev.id)

    await push('ลบนัดหมาย', async () => {
      await deleteEvent(ev.id)
      // แถว metadata หายไปกับ CASCADE แล้ว เหลือลบตัวไฟล์ใน Storage
      await removeStorageFiles(ev.attachments.map((a) => a.storagePath))
    })
  }

  async function handleImport(imported: AppEvent[]) {
    for (const ev of imported) await upsertEvent(ev, userId)
    await reload()
  }

  /* ---------- อารมณ์ ---------- */

  async function handleSetMood(day: string, emoji: string) {
    const mood: Mood = { day, emoji }
    setMoods((prev) => [...prev.filter((m) => m.day !== day), mood])
    await push('บันทึกอารมณ์', () => setMood(mood, userId))
  }

  async function handleClearMood(day: string) {
    setMoods((prev) => prev.filter((m) => m.day !== day))
    await push('ล้างอารมณ์', () => clearMood(day, userId))
  }

  /* ---------- นิสัย ---------- */

  async function handleAddHabit(habit: Habit) {
    setHabits((prev) => [...prev, habit])
    await push('เพิ่มนิสัย', () => upsertHabit(habit, userId))
  }

  async function handleDeleteHabit(habit: Habit) {
    setHabits((prev) => prev.filter((h) => h.id !== habit.id))
    setHabitLogs((prev) => {
      const next = new Set(prev)
      for (const k of prev) if (k.startsWith(`${habit.id}:`)) next.delete(k)
      return next
    })
    await push('ลบนิสัย', () => deleteHabit(habit.id))
  }

  async function handleToggleHabit(habitId: string, day: string, done: boolean) {
    const key = habitLogKey(habitId, day)
    setHabitLogs((prev) => {
      const next = new Set(prev)
      if (done) next.add(key)
      else next.delete(key)
      return next
    })
    await push('บันทึกนิสัย', () => setHabitLog(habitId, day, done, userId))
  }

  /* ---------- โน้ต ---------- */

  async function handleSaveNote(note: StickyNote) {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id)
      return exists ? prev.map((n) => (n.id === note.id ? note : n)) : [...prev, note]
    })
    await push('บันทึกโน้ต', () => upsertNote(note, userId))
  }

  async function handleDeleteNote(note: StickyNote) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    await push('ลบโน้ต', () => deleteNote(note.id))
  }

  /* ---------- ค่าที่คำนวณ ---------- */

  const moodMap = useMemo(() => new Map(moods.map((m) => [m.day, m])), [moods])

  /** นัดที่กำลังจะถึงในอนาคต 5 รายการแรก */
  const upcoming = useMemo(
    () =>
      events
        .map((ev) => ({ ev, at: eventStartAt(ev) }))
        .filter((x) => x.at.getTime() >= now.getTime())
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(0, 5),
    [events, now]
  )

  function goToday() {
    const t = todayKey()
    const d = fromKey(t)
    setSelectedKey(t)
    setMonthView({ year: d.getFullYear(), month: d.getMonth() })
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-wiggle text-5xl">🗓️</p>
      </main>
    )
  }

  if (!isSupabaseConfigured) return <ConfigNotice />
  if (!session) return <AuthGate />

  const isDay = view === 'day'

  return (
    <main className="mx-auto max-w-6xl p-4 pb-32 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">🗓️ My Planner</h1>
          <p className="text-[0.95rem]" style={{ color: 'var(--color-ink-soft)' }}>
            เตือนล่วงหน้า 3 วัน · 1 วัน · 1 ชั่วโมง ก่อนถึงนัด
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[0.9rem] sm:block" style={{ color: 'var(--color-ink-soft)' }}>
            {session.user.email}
          </span>
          <button
            onClick={handleLogout}
            className="btn text-[0.95rem]"
            style={{ background: 'white', color: 'var(--color-ink-soft)' }}
          >
            ออกจากระบบ 👋
          </button>
        </div>
      </header>

      <div className="mb-4">
        <ViewSwitcher value={view} onChange={setView} />
      </div>

      {dbError && (
        <p
          className="animate-pop mb-4 rounded-2xl px-4 py-3 text-center font-semibold"
          style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
          role="alert"
        >
          {dbError}
        </p>
      )}

      {loading && (
        <p className="mb-4 text-center" style={{ color: 'var(--color-ink-soft)' }}>
          กำลังโหลดข้อมูล… ⏳
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ---------- คอลัมน์ซ้าย ---------- */}
        <div className="flex flex-col gap-5">
          {view === 'month' && (
            <CalendarMonth
              year={monthView.year}
              month={monthView.month}
              events={events}
              moods={moodMap}
              selectedKey={selectedKey}
              todayKey={todayKey()}
              onSelect={setSelectedKey}
              onMonthChange={(year, month) => setMonthView({ year, month })}
            />
          )}

          {view === 'week' && (
            <WeekView
              anchorKey={selectedKey}
              todayKey={todayKey()}
              events={events}
              moods={moodMap}
              habits={habits}
              logs={habitLogs}
              onSelect={setSelectedKey}
              onShiftWeek={(days) => setSelectedKey((k) => addDaysKey(k, days))}
              onGoToday={goToday}
              onSetMood={handleSetMood}
              onClearMood={handleClearMood}
              onToggleHabit={handleToggleHabit}
            />
          )}

          {/* มุมมองรายวันเน้นลงรายละเอียด จึงยกอารมณ์กับนิสัยขึ้นมาไว้บนสุด */}
          {isDay && (
            <>
              <MoodPicker
                dateKey={selectedKey}
                mood={moodMap.get(selectedKey)}
                onPick={(emoji) => handleSetMood(selectedKey, emoji)}
                onClear={() => handleClearMood(selectedKey)}
              />
              <HabitTracker
                dateKey={selectedKey}
                habits={habits}
                logs={habitLogs}
                onToggle={handleToggleHabit}
                onAdd={handleAddHabit}
                onDelete={handleDeleteHabit}
              />
            </>
          )}

          {!isDay && (
            <section className="card">
              <h3 className="mb-2 text-xl font-bold">⏳ นัดที่กำลังจะถึง</h3>
              {upcoming.length === 0 ? (
                <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีนัดในอนาคตเลย 🍀</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {upcoming.map(({ ev }) => (
                    <li key={ev.id}>
                      <button
                        onClick={() => {
                          setSelectedKey(ev.startDate)
                          const d = fromKey(ev.startDate)
                          setMonthView({ year: d.getFullYear(), month: d.getMonth() })
                        }}
                        className="w-full rounded-2xl bg-white/70 px-3 py-2 text-left transition-transform hover:-translate-y-0.5"
                      >
                        <span className="font-semibold">{ev.title}</span>
                        <span className="ml-2 text-[0.88rem]" style={{ color: 'var(--color-ink-soft)' }}>
                          {ev.startDate} {ev.allDay ? '· ทั้งวัน' : `· ${ev.startTime} น.`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <StickyBoard notes={notes} onSave={handleSaveNote} onDelete={handleDeleteNote} />
          <BookingLinks />
          <BackupBar events={events} onImport={handleImport} />
        </div>

        {/* ---------- คอลัมน์ขวา: รายละเอียดของวันที่เลือก ---------- */}
        <div className="flex flex-col gap-5">
          <DaySummary
            dateKey={selectedKey}
            events={events}
            now={now}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDeleteEvent}
          />

          {/* มุมมองรายวันย้ายสองอันนี้ไปคอลัมน์ซ้ายแล้ว ไม่ต้องซ้ำ */}
          {!isDay && (
            <>
              <MoodPicker
                dateKey={selectedKey}
                mood={moodMap.get(selectedKey)}
                onPick={(emoji) => handleSetMood(selectedKey, emoji)}
                onClear={() => handleClearMood(selectedKey)}
              />
              <HabitTracker
                dateKey={selectedKey}
                habits={habits}
                logs={habitLogs}
                onToggle={handleToggleHabit}
                onAdd={handleAddHabit}
                onDelete={handleDeleteHabit}
              />
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <EventForm
          editing={editing}
          defaultDate={selectedKey}
          userId={userId}
          onSave={handleSaveEvent}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      <ReminderHost events={events} />

      <ChatBot
        userId={userId}
        events={events}
        moods={moods}
        habits={habits}
        habitLogs={habitLogs}
        notes={notes}
      />
    </main>
  )
}
