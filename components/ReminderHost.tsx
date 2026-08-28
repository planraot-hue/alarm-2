'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCategory } from '@/lib/categories'
import { eventStartAt, formatRange, humanCountdown } from '@/lib/dates'
import {
  type DueReminder,
  OFFSET_LABEL,
  findDueReminders,
  fireSystemNotification,
  requestNotificationPermission,
} from '@/lib/reminders'
import { loadFired, saveFired } from '@/lib/storage'
import type { AppEvent } from '@/lib/types'

const TICK_MS = 30_000

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export default function ReminderHost({ events }: { events: AppEvent[] }) {
  // คิวแจ้งเตือนที่ยังไม่ได้กดรับทราบ — แสดงทีละอัน อันแรกในคิวคือป็อบอัปที่เห็นอยู่
  const [queue, setQueue] = useState<DueReminder[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermission(Notification.permission)
  }, [])

  const check = useCallback(() => {
    const fired = new Set(loadFired())
    const due = findDueReminders(events, fired, new Date())
    if (due.length === 0) return

    for (const item of due) {
      fired.add(item.key)
      fireSystemNotification(item)
    }
    saveFired([...fired])

    // ป็อบอัปในหน้าเว็บทำงานเสมอ แม้ผู้ใช้ไม่อนุญาต desktop notification
    setQueue((prev) => {
      const seen = new Set(prev.map((b) => b.key))
      return [...prev, ...due.filter((d) => !seen.has(d.key))]
    })
  }, [events])

  useEffect(() => {
    check()
    const id = window.setInterval(check, TICK_MS)
    return () => window.clearInterval(id)
  }, [check])

  const current = queue[0]

  const dismiss = useCallback(() => setQueue((prev) => prev.slice(1)), [])

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!current) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, dismiss])

  async function askPermission() {
    setPermission(await requestNotificationPermission())
  }

  const showAskButton =
    permission === 'default' && typeof window !== 'undefined' && 'Notification' in window

  return (
    <>
      {showAskButton && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
          <button
            onClick={askPermission}
            className="btn text-[0.95rem]"
            style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
          >
            🔔 เปิดการแจ้งเตือนบนเครื่อง
          </button>
        </div>
      )}

      {current && <ReminderPopup item={current} remaining={queue.length - 1} onClose={dismiss} />}
    </>
  )
}

function ReminderPopup({
  item,
  remaining,
  onClose,
}: {
  item: DueReminder
  remaining: number
  onClose: () => void
}) {
  const cat = getCategory(item.event.category)
  const startAt = eventStartAt(item.event)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-label="แจ้งเตือนนัดหมาย"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-bounce-in w-full max-w-sm overflow-hidden rounded-[2rem] bg-white text-center"
        style={{ boxShadow: '0 20px 60px rgba(74,64,56,0.28)' }}
      >
        {/* แถบสีตามประเภทกิจกรรม */}
        <div className="px-6 pt-7 pb-5" style={{ background: cat.color }}>
          <div className="animate-wiggle mb-1 text-6xl" aria-hidden>
            ⏰
          </div>
          <p className="text-lg font-bold" style={{ color: cat.accent }}>
            {OFFSET_LABEL[item.offset] ?? 'ใกล้ถึงนัดแล้ว'}
          </p>
        </div>

        <div className="px-6 pt-5 pb-6">
          <p className="mb-1 text-2xl leading-snug font-bold break-words">
            {cat.icon} {item.event.title}
          </p>

          <p className="text-[0.95rem] font-semibold" style={{ color: cat.accent }}>
            🕒 {formatRange(item.event)}
          </p>

          <p className="mt-0.5 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
            {humanCountdown(startAt, new Date())}
          </p>

          {item.event.location && (
            <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[0.95rem]">
              <span>📍 {item.event.location}</span>
              <a
                href={mapsUrl(item.event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--color-sky)', color: 'var(--color-sky-deep)' }}
              >
                🗺️ เปิดแผนที่
              </a>
            </p>
          )}

          {item.event.note && (
            <p
              className="mt-3 rounded-2xl px-3 py-2 text-left text-[0.9rem] whitespace-pre-wrap"
              style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
            >
              📝 {item.event.note}
            </p>
          )}

          <button
            onClick={onClose}
            autoFocus
            className="btn mt-5 w-full text-lg"
            style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
          >
            รับทราบแล้ว 💖
          </button>

          {remaining > 0 && (
            <p className="mt-2 text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
              ยังมีอีก {remaining} รายการรออยู่
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
