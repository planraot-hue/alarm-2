'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCategory } from '@/lib/categories'
import { formatRange } from '@/lib/dates'
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

export default function ReminderHost({ events }: { events: AppEvent[] }) {
  const [banners, setBanners] = useState<DueReminder[]>([])
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

    // แบนเนอร์ในหน้าเว็บทำงานเสมอ แม้ผู้ใช้ไม่อนุญาต desktop notification
    setBanners((prev) => {
      const seen = new Set(prev.map((b) => b.key))
      return [...prev, ...due.filter((d) => !seen.has(d.key))]
    })
  }, [events])

  useEffect(() => {
    check()
    const id = window.setInterval(check, TICK_MS)
    return () => window.clearInterval(id)
  }, [check])

  async function askPermission() {
    setPermission(await requestNotificationPermission())
  }

  const showAskButton = permission === 'default' && typeof window !== 'undefined' && 'Notification' in window

  if (banners.length === 0 && !showAskButton) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 p-4">
      {showAskButton && (
        <button
          onClick={askPermission}
          className="btn pointer-events-auto text-[0.95rem]"
          style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
        >
          🔔 เปิดการแจ้งเตือนบนเครื่อง
        </button>
      )}

      {banners.map((item) => {
        const cat = getCategory(item.event.category)
        return (
          <div
            key={item.key}
            role="alert"
            className="animate-pop pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-3xl border-l-8 bg-white p-4"
            style={{ borderColor: cat.accent, boxShadow: '0 10px 30px rgba(74,64,56,0.18)' }}
          >
            <span className="animate-wiggle text-3xl" aria-hidden>⏰</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold" style={{ color: cat.accent }}>
                {OFFSET_LABEL[item.offset] ?? 'ใกล้ถึงนัดแล้ว'}
              </p>
              <p className="truncate text-lg font-bold">
                {cat.icon} {item.event.title}
              </p>
              <p className="text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
                {formatRange(item.event)}
                {item.event.location ? ` · ${item.event.location}` : ''}
              </p>
            </div>
            <button
              onClick={() => setBanners((prev) => prev.filter((b) => b.key !== item.key))}
              aria-label="ปิดการแจ้งเตือน"
              className="rounded-full px-3 py-1 font-bold"
              style={{ background: 'var(--color-cream)' }}
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
