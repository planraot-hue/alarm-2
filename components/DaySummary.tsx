'use client'

import EventCard from './EventCard'
import { eventsOnDate, formatLongDateTH, todayKey } from '@/lib/dates'
import type { AppEvent } from '@/lib/types'

interface Props {
  dateKey: string
  events: AppEvent[]
  now: Date
  onAdd: () => void
  onEdit: (ev: AppEvent) => void
  onDelete: (ev: AppEvent) => void
}

export default function DaySummary({ dateKey, events, now, onAdd, onEdit, onDelete }: Props) {
  const list = eventsOnDate(events, dateKey)
  const isToday = dateKey === todayKey()

  const timed = list.filter((e) => !e.allDay).length
  const allDay = list.length - timed

  return (
    <section className="card flex flex-col">
      <header className="mb-3">
        <p className="text-[0.9rem] font-semibold" style={{ color: 'var(--color-ink-soft)' }}>
          {isToday ? '📌 สรุปนัดหมายวันนี้' : '📅 สรุปนัดหมายของวัน'}
        </p>
        <h3 className="text-xl leading-snug font-bold">{formatLongDateTH(dateKey)}</h3>

        <p className="mt-1 text-[0.92rem]" style={{ color: 'var(--color-ink-soft)' }}>
          {list.length === 0
            ? 'ยังไม่มีนัดหมาย ว่างสบาย ๆ 🍃'
            : `มีทั้งหมด ${list.length} นัด${timed ? ` · ระบุเวลา ${timed}` : ''}${allDay ? ` · ทั้งวัน ${allDay}` : ''}`}
        </p>
      </header>

      <button
        onClick={onAdd}
        className="btn mb-4 w-full text-lg"
        style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
      >
        ➕ เพิ่มนัดหมายวันนี้
      </button>

      {list.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#f0e4da] py-10 text-center">
          <div className="mb-2 text-5xl">🌷</div>
          <p style={{ color: 'var(--color-ink-soft)' }}>วันนี้ยังไม่มีนัดอะไรเลย</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((ev) => (
            <EventCard key={ev.id} event={ev} now={now} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
