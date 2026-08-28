'use client'

import MoodPicker from './MoodPicker'
import { getCategory } from '@/lib/categories'
import { eventsOnDate, formatWeekRange, fromKey, weekOf, weekdayShort } from '@/lib/dates'
import {
  type AppEvent,
  type Habit,
  type Mood,
  getPastel,
  habitLogKey,
} from '@/lib/types'

interface Props {
  anchorKey: string
  todayKey: string
  events: AppEvent[]
  moods: Map<string, Mood>
  habits: Habit[]
  logs: Set<string>
  onSelect: (key: string) => void
  onShiftWeek: (days: number) => void
  onGoToday: () => void
  onSetMood: (day: string, emoji: string) => void
  onClearMood: (day: string) => void
  onToggleHabit: (habitId: string, day: string, done: boolean) => void
}

export default function WeekView({
  anchorKey,
  todayKey,
  events,
  moods,
  habits,
  logs,
  onSelect,
  onShiftWeek,
  onGoToday,
  onSetMood,
  onClearMood,
  onToggleHabit,
}: Props) {
  const days = weekOf(anchorKey)

  return (
    <section className="card">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="btn px-4 py-2"
            style={{ background: 'var(--color-lilac)', color: 'var(--color-lilac-deep)' }}
            onClick={() => onShiftWeek(-7)}
            aria-label="สัปดาห์ก่อนหน้า"
          >
            ←
          </button>
          <h2 className="min-w-[11rem] text-center text-xl font-bold">{formatWeekRange(days)}</h2>
          <button
            className="btn px-4 py-2"
            style={{ background: 'var(--color-lilac)', color: 'var(--color-lilac-deep)' }}
            onClick={() => onShiftWeek(7)}
            aria-label="สัปดาห์ถัดไป"
          >
            →
          </button>
        </div>
        <button
          className="btn px-4 py-2 text-[0.95rem]"
          style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
          onClick={onGoToday}
        >
          สัปดาห์นี้ 🌤️
        </button>
      </header>

      {/* จอเล็กเลื่อนแนวนอนได้ ไม่บีบคอลัมน์จนอ่านไม่ออก */}
      <div className="-mx-2 overflow-x-auto px-2">
        <div className="grid min-w-[46rem] grid-cols-7 gap-2">
          {days.map((key) => {
            const d = fromKey(key)
            const isToday = key === todayKey
            const isSelected = key === anchorKey
            const dayEvents = eventsOnDate(events, key)
            const mood = moods.get(key)

            return (
              <div
                key={key}
                className="flex flex-col rounded-2xl border-2 p-2"
                style={{
                  borderColor: isSelected ? 'var(--color-pink-deep)' : 'transparent',
                  background: isToday ? 'var(--color-lemon)' : 'rgba(255,255,255,0.72)',
                }}
              >
                <button
                  onClick={() => onSelect(key)}
                  className="mb-1.5 text-center"
                  aria-label={`เลือกวันที่ ${key}`}
                >
                  <span
                    className="block text-[0.82rem] font-bold"
                    style={{ color: d.getDay() === 0 ? 'var(--color-pink-deep)' : 'var(--color-ink-soft)' }}
                  >
                    {weekdayShort(key)}
                  </span>
                  <span className={`text-xl ${isToday || isSelected ? 'font-bold' : ''}`}>
                    {d.getDate()}
                  </span>
                </button>

                {/* อารมณ์ของวัน */}
                <div className="mb-1.5">
                  <MoodPicker
                    compact
                    dateKey={key}
                    mood={mood}
                    onPick={(emoji) => onSetMood(key, emoji)}
                    onClear={() => onClearMood(key)}
                  />
                </div>

                {/* นิสัย — วงกลมเล็ก ๆ ติ๊กได้ตรงนี้เลย */}
                {habits.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap justify-center gap-1">
                    {habits.map((h) => {
                      const done = logs.has(habitLogKey(h.id, key))
                      const p = getPastel(h.color)
                      return (
                        <button
                          key={h.id}
                          onClick={() => onToggleHabit(h.id, key, !done)}
                          title={`${h.name} — ${done ? 'ทำแล้ว' : 'ยังไม่ทำ'}`}
                          aria-label={`${h.name} วันที่ ${key} — ${done ? 'ทำแล้ว' : 'ยังไม่ทำ'}`}
                          aria-pressed={done}
                          className="h-4 w-4 rounded-full border-2 transition-transform hover:scale-125"
                          style={{
                            borderColor: p.accent,
                            background: done ? p.accent : 'transparent',
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {/* นัดหมาย */}
                <div className="flex flex-col gap-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-center text-[0.78rem]" style={{ color: 'var(--color-ink-soft)' }}>
                      —
                    </p>
                  ) : (
                    dayEvents.map((ev) => {
                      const cat = getCategory(ev.category)
                      return (
                        <button
                          key={ev.id}
                          onClick={() => onSelect(key)}
                          className="rounded-lg px-1.5 py-1 text-left text-[0.78rem] leading-tight transition-transform hover:-translate-y-0.5"
                          style={{ background: cat.color, color: cat.accent }}
                        >
                          <span className="block font-semibold break-words">
                            {cat.icon} {ev.title}
                          </span>
                          {!ev.allDay && ev.startTime && <span>{ev.startTime} น.</span>}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
