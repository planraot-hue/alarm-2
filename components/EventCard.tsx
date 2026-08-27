'use client'

import FlightLinks from './FlightLinks'
import { downloadAttachment, formatSize } from '@/lib/attachments'
import { getCategory } from '@/lib/categories'
import { eventStartAt, formatRange, humanCountdown } from '@/lib/dates'
import type { AppEvent } from '@/lib/types'

interface Props {
  event: AppEvent
  now: Date
  onEdit: (ev: AppEvent) => void
  onDelete: (ev: AppEvent) => void
}

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export default function EventCard({ event, now, onEdit, onDelete }: Props) {
  const cat = getCategory(event.category)
  const startAt = eventStartAt(event)
  const upcoming = startAt.getTime() > now.getTime()

  return (
    <article
      className="animate-pop rounded-3xl border-l-8 bg-white/90 p-4"
      style={{ borderColor: cat.accent, boxShadow: '0 6px 18px rgba(74,64,56,0.08)' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: cat.color }}
          aria-hidden
        >
          {cat.icon}
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="text-xl leading-snug font-bold break-words">{event.title}</h4>

          <p className="mt-0.5 text-[0.95rem] font-semibold" style={{ color: cat.accent }}>
            🕒 {formatRange(event)}
          </p>

          {upcoming && (
            <p className="text-[0.88rem]" style={{ color: 'var(--color-ink-soft)' }}>
              {humanCountdown(startAt, now)}
            </p>
          )}

          {event.location && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.95rem]">
              <span>📍 {event.location}</span>
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--color-sky)', color: 'var(--color-sky-deep)' }}
              >
                🗺️ เปิดแผนที่
              </a>
            </p>
          )}

          {event.note && (
            <p className="mt-1.5 text-[0.92rem] whitespace-pre-wrap" style={{ color: 'var(--color-ink-soft)' }}>
              📝 {event.note}
            </p>
          )}

          {event.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.attachments.map((att) => (
                <button
                  key={att.id}
                  onClick={() => downloadAttachment(att.id, att.name)}
                  title={`เปิด ${att.name} (${formatSize(att.size)})`}
                  className="max-w-[14rem] truncate rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: 'var(--color-lilac)', color: 'var(--color-lilac-deep)' }}
                >
                  {att.type.startsWith('image/') ? '🖼️' : '📄'} {att.name}
                </button>
              ))}
            </div>
          )}

          {event.reminders.length > 0 && (
            <p className="mt-1.5 text-[0.82rem]" style={{ color: 'var(--color-ink-soft)' }}>
              🔔 เตือน{' '}
              {event.reminders
                .slice()
                .sort((a, b) => b - a)
                .map((r) => (r === 4320 ? '3 วัน' : r === 1440 ? '1 วัน' : '1 ชม.'))
                .join(' · ')}{' '}
              ก่อนถึงนัด
            </p>
          )}

          {event.category === 'travel' && <FlightLinks compact />}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={() => onEdit(event)}
            aria-label={`แก้ไข ${event.title}`}
            className="rounded-full px-3 py-1.5 font-semibold transition-transform hover:scale-105"
            style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(event)}
            aria-label={`ลบ ${event.title}`}
            className="rounded-full px-3 py-1.5 font-semibold transition-transform hover:scale-105"
            style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  )
}
