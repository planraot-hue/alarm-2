'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AuthGate from '@/components/AuthGate'
import BackupBar from '@/components/BackupBar'
import CalendarMonth from '@/components/CalendarMonth'
import ConfigNotice from '@/components/ConfigNotice'
import DaySummary from '@/components/DaySummary'
import EventForm from '@/components/EventForm'
import BookingLinks from '@/components/BookingLinks'
import ReminderHost from '@/components/ReminderHost'
import { removeStorageFiles } from '@/lib/attachments'
import { deleteEvent, describeDbError, fetchEvents, upsertEvent } from '@/lib/db'
import { eventStartAt, fromKey, todayKey } from '@/lib/dates'
import { clearFiredFor } from '@/lib/storage'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AppEvent } from '@/lib/types'

export default function Page() {
  // ready กันปัญหา hydration — ทุกอย่างที่อ่านเวลาปัจจุบัน/session ต้องรอ mount ก่อน
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [dbError, setDbError] = useState('')
  const [selectedKey, setSelectedKey] = useState('2000-01-01')
  const [view, setView] = useState({ year: 2000, month: 0 })
  const [now, setNow] = useState(() => new Date(0))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AppEvent | null>(null)

  const userId = session?.user.id ?? ''

  useEffect(() => {
    const today = new Date()
    setSelectedKey(todayKey())
    setView({ year: today.getFullYear(), month: today.getMonth() })
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
    setLoadingEvents(true)
    setDbError('')
    try {
      setEvents(await fetchEvents())
    } catch (err) {
      console.error(err)
      setDbError(describeDbError(err))
    }
    setLoadingEvents(false)
  }, [])

  // ล็อกอินแล้วดึงนัดหมายของบัญชีนั้นมา, ล็อกเอาต์แล้วล้างทิ้ง
  useEffect(() => {
    if (!session) {
      setEvents([])
      return
    }
    reload()
  }, [session, reload])

  async function handleLogout() {
    await supabase.auth.signOut()
    setEvents([])
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(ev: AppEvent) {
    setEditing(ev)
    setFormOpen(true)
  }

  async function handleSave(ev: AppEvent) {
    setFormOpen(false)
    setEditing(null)
    setDbError('')

    // แสดงผลทันทีก่อน แล้วค่อยยืนยันกับเซิร์ฟเวอร์
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === ev.id)
      return exists ? prev.map((e) => (e.id === ev.id ? ev : e)) : [...prev, ev]
    })
    clearFiredFor(ev.id) // เวลานัดอาจเปลี่ยน ให้เตือนใหม่ตามเวลาที่แก้

    setSelectedKey(ev.startDate)
    const d = fromKey(ev.startDate)
    setView({ year: d.getFullYear(), month: d.getMonth() })

    try {
      await upsertEvent(ev, userId)
    } catch (err) {
      console.error(err)
      setDbError(`บันทึกไม่สำเร็จ: ${describeDbError(err)}`)
      await reload()
    }
  }

  async function handleDelete(ev: AppEvent) {
    if (!window.confirm(`ลบ "${ev.title}" ใช่ไหม?`)) return
    setDbError('')

    setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    clearFiredFor(ev.id)

    try {
      await deleteEvent(ev.id)
      // แถว metadata หายไปกับ CASCADE แล้ว เหลือลบตัวไฟล์ใน Storage
      await removeStorageFiles(ev.attachments.map((a) => a.storagePath))
    } catch (err) {
      console.error(err)
      setDbError(`ลบไม่สำเร็จ: ${describeDbError(err)}`)
      await reload()
    }
  }

  async function handleImport(imported: AppEvent[]) {
    for (const ev of imported) {
      await upsertEvent(ev, userId)
    }
    await reload()
  }

  /** นัดที่กำลังจะถึงในอนาคต 5 รายการแรก */
  const upcoming = useMemo(() => {
    return events
      .map((ev) => ({ ev, at: eventStartAt(ev) }))
      .filter((x) => x.at.getTime() >= now.getTime())
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, 5)
  }, [events, now])

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-wiggle text-5xl">🗓️</p>
      </main>
    )
  }

  if (!isSupabaseConfigured) return <ConfigNotice />
  if (!session) return <AuthGate />

  return (
    <main className="mx-auto max-w-6xl p-4 pb-32 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

      {dbError && (
        <p
          className="animate-pop mb-4 rounded-2xl px-4 py-3 text-center font-semibold"
          style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
          role="alert"
        >
          {dbError}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <CalendarMonth
            year={view.year}
            month={view.month}
            events={events}
            selectedKey={selectedKey}
            todayKey={todayKey()}
            onSelect={setSelectedKey}
            onMonthChange={(year, month) => setView({ year, month })}
          />

          <section className="card">
            <h3 className="mb-2 text-xl font-bold">⏳ นัดที่กำลังจะถึง</h3>
            {loadingEvents ? (
              <p style={{ color: 'var(--color-ink-soft)' }}>กำลังโหลด… ⏳</p>
            ) : upcoming.length === 0 ? (
              <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีนัดในอนาคตเลย 🍀</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {upcoming.map(({ ev }) => (
                  <li key={ev.id}>
                    <button
                      onClick={() => {
                        setSelectedKey(ev.startDate)
                        const d = fromKey(ev.startDate)
                        setView({ year: d.getFullYear(), month: d.getMonth() })
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

          <BookingLinks />
          <BackupBar events={events} onImport={handleImport} />
        </div>

        <DaySummary
          dateKey={selectedKey}
          events={events}
          now={now}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {formOpen && (
        <EventForm
          editing={editing}
          defaultDate={selectedKey}
          userId={userId}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      <ReminderHost events={events} />
    </main>
  )
}
