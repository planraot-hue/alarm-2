'use client'

import { getCategory } from '@/lib/categories'
import { MONTHS_TH, WEEKDAYS_TH, eventsOnDate, monthGrid, toKey } from '@/lib/dates'
import type { AppEvent } from '@/lib/types'

interface Props {
  year: number
  month: number
  events: AppEvent[]
  selectedKey: string
  todayKey: string
  onSelect: (key: string) => void
  onMonthChange: (year: number, month: number) => void
}

export default function CalendarMonth({
  year,
  month,
  events,
  selectedKey,
  todayKey,
  onSelect,
  onMonthChange,
}: Props) {
  const days = monthGrid(year, month)

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  function goToday() {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth())
    onSelect(toKey(now))
  }

  return (
    <section className="card">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="btn px-4 py-2"
            style={{ background: 'var(--color-lilac)', color: 'var(--color-lilac-deep)' }}
            onClick={() => shift(-1)}
            aria-label="เดือนก่อนหน้า"
          >
            ←
          </button>
          <h2 className="min-w-[11rem] text-center text-2xl font-bold">
            {MONTHS_TH[month]} {year + 543}
          </h2>
          <button
            className="btn px-4 py-2"
            style={{ background: 'var(--color-lilac)', color: 'var(--color-lilac-deep)' }}
            onClick={() => shift(1)}
            aria-label="เดือนถัดไป"
          >
            →
          </button>
        </div>
        <button
          className="btn px-4 py-2 text-[0.95rem]"
          style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
          onClick={goToday}
        >
          วันนี้ 🌤️
        </button>
      </header>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS_TH.map((w, i) => (
          <div
            key={w}
            className="py-1.5 text-[0.9rem] font-bold"
            style={{ color: i === 0 ? 'var(--color-pink-deep)' : 'var(--color-ink-soft)' }}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = toKey(d)
          const inMonth = d.getMonth() === month
          const isToday = key === todayKey
          const isSelected = key === selectedKey
          const dayEvents = eventsOnDate(events, key)

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              className="flex min-h-[3.9rem] flex-col items-center justify-start rounded-2xl border-2 p-1.5 transition-all hover:-translate-y-0.5 sm:min-h-[4.6rem]"
              style={{
                borderColor: isSelected ? 'var(--color-pink-deep)' : 'transparent',
                background: isSelected
                  ? 'var(--color-pink)'
                  : isToday
                    ? 'var(--color-lemon)'
                    : inMonth
                      ? 'rgba(255,255,255,0.7)'
                      : 'transparent',
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span className={`text-[1.05rem] ${isToday || isSelected ? 'font-bold' : ''}`}>
                {d.getDate()}
              </span>

              {dayEvents.length > 0 && (
                <span className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      title={ev.title}
                      className="h-2 w-2 rounded-full"
                      style={{ background: getCategory(ev.category).accent }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[0.7rem] leading-none" style={{ color: 'var(--color-ink-soft)' }}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
