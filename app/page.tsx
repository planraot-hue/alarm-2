'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import BackupBar from '@/components/BackupBar'
import CalendarMonth from '@/components/CalendarMonth'
import DaySummary from '@/components/DaySummary'
import EventForm from '@/components/EventForm'
import FlightLinks from '@/components/FlightLinks'
import LoginGate from '@/components/LoginGate'
import ReminderHost from '@/components/ReminderHost'
import { deleteFiles } from '@/lib/attachments'
import { eventStartAt, fromKey, todayKey } from '@/lib/dates'
import { clearFiredFor, isLoggedIn, loadEvents, saveEvents, setLoggedIn } from '@/lib/storage'
import type { AppEvent } from '@/lib/types'

export default function Page() {
  // ready กันปัญหา hydration — ทุกอย่างที่อ่าน localStorage/เวลาปัจจุบันต้องรอ mount ก่อน
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [selectedKey, setSelectedKey] = useState('2000-01-01')
  const [view, setView] = useState({ year: 2000, month: 0 })
  const [now, setNow] = useState(() => new Date(0))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AppEvent | null>(null)

  useEffect(() => {
    const today = new Date()
    setSelectedKey(todayKey())
    setView({ year: today.getFullYear(), month: today.getMonth() })
    setNow(today)
    setAuthed(isLoggedIn())
    setEvents(loadEvents())
    setReady(true)
  }, [])

  // อัปเดตเวลาทุกนาที เพื่อให้ข้อความนับถอยหลังสดเสมอ
  useEffect(() => {
    if (!ready) return
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [ready])

  const persist = useCallback((next: AppEvent[]) => {
    setEvents(next)
    saveEvents(next)
  }, [])

  function handleLogin() {
    setLoggedIn(true)
    setAuthed(true)
  }

  function handleLogout() {
    setLoggedIn(false)
    setAuthed(false)
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(ev: AppEvent) {
    setEditing(ev)
    setFormOpen(true)
  }

  function handleSave(ev: AppEvent) {
    const exists = events.some((e) => e.id === ev.id)
    const next = exists ? events.map((e) => (e.id === ev.id ? ev : e)) : [...events, ev]

    // แก้ไขนัด = ล้างประวัติการเตือน เพื่อให้เตือนตามเวลาใหม่
    if (exists) clearFiredFor(ev.id)

    persist(next)
    setFormOpen(false)
    setEditing(null)
    setSelectedKey(ev.startDate)
    const d = fromKey(ev.startDate)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  function handleDelete(ev: AppEvent) {
    if (!window.confirm(`ลบ "${ev.title}" ใช่ไหม?`)) return
    deleteFiles(ev.attachments.map((a) => a.id))
    clearFiredFor(ev.id)
    persist(events.filter((e) => e.id !== ev.id))
  }

  function handleImport(imported: AppEvent[]) {
    const byId = new Map(events.map((e) => [e.id, e]))
    for (const ev of imported) byId.set(ev.id, ev)
    persist([...byId.values()])
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

  if (!authed) return <LoginGate onSuccess={handleLogin} />

  return (
    <main className="mx-auto max-w-6xl p-4 pb-32 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">🗓️ สมุดนัดน่ารัก</h1>
          <p className="text-[0.95rem]" style={{ color: 'var(--color-ink-soft)' }}>
            เตือนล่วงหน้า 3 วัน · 1 วัน · 1 ชั่วโมง ก่อนถึงนัด
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn text-[0.95rem]"
          style={{ background: 'white', color: 'var(--color-ink-soft)' }}
        >
          ออกจากระบบ 👋
        </button>
      </header>

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

          <FlightLinks />
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
