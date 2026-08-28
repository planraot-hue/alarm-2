'use client'

import { useState } from 'react'
import {
  HABIT_PRESETS,
  PASTEL_KEYS,
  type Habit,
  type PastelColor,
  getPastel,
  habitLogKey,
  newId,
} from '@/lib/types'

interface Props {
  dateKey: string
  habits: Habit[]
  /** คีย์ 'habitId:day' ของช่องที่ติ๊กแล้ว */
  logs: Set<string>
  onToggle: (habitId: string, day: string, done: boolean) => void
  onAdd: (habit: Habit) => void
  onDelete: (habit: Habit) => void
}

const EMOJI_CHOICES = ['💧', '🏃', '📖', '🌙', '🧘', '🥗', '☀️', '💊', '✍️', '🎧', '🧹', '⭐']

export default function HabitTracker({
  dateKey,
  habits,
  logs,
  onToggle,
  onAdd,
  onDelete,
}: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [color, setColor] = useState<PastelColor>('pink')

  const doneCount = habits.filter((h) => logs.has(habitLogKey(h.id, dateKey))).length

  function makeHabit(n: string, i: string, c: PastelColor): Habit {
    return { id: newId(), name: n, icon: i, color: c, sortOrder: habits.length }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(makeHabit(name.trim(), icon, color))
    setName('')
    setIcon('⭐')
    setColor('pink')
    setAdding(false)
  }

  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-xl font-bold">✅ นิสัยประจำวัน</h3>
        {habits.length > 0 && (
          <span className="text-[0.9rem] font-semibold" style={{ color: 'var(--color-ink-soft)' }}>
            {doneCount}/{habits.length} แล้ว
          </span>
        )}
      </div>

      {habits.length === 0 && !adding && (
        <div className="mb-3">
          <p className="mb-2 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
            ยังไม่มีนิสัยที่ติดตาม ลองเลือกจากไอเดียนี้ดูไหม
          </p>
          <div className="flex flex-wrap gap-2">
            {HABIT_PRESETS.map((p) => {
              const pastel = getPastel(p.color)
              return (
                <button
                  key={p.name}
                  onClick={() => onAdd(makeHabit(p.name, p.icon, p.color))}
                  className="rounded-full px-3.5 py-1.5 text-[0.9rem] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: pastel.bg, color: pastel.accent }}
                >
                  + {p.icon} {p.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {habits.map((h) => {
            const key = habitLogKey(h.id, dateKey)
            const done = logs.has(key)
            const pastel = getPastel(h.color)
            return (
              <li
                key={h.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-2"
                style={{ background: done ? pastel.bg : 'rgba(255,255,255,0.75)' }}
              >
                {/* วงกลมระบายสีเมื่อทำสำเร็จ */}
                <button
                  onClick={() => onToggle(h.id, dateKey, !done)}
                  aria-pressed={done}
                  aria-label={`${h.name} — ${done ? 'ทำแล้ว' : 'ยังไม่ทำ'}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] text-lg font-bold transition-transform hover:scale-110"
                  style={{
                    borderColor: pastel.accent,
                    background: done ? pastel.accent : 'white',
                    color: 'white',
                  }}
                >
                  {done ? '✓' : ''}
                </button>

                <span className="min-w-0 flex-1">
                  <span className="text-[1.02rem] font-semibold" style={{ color: pastel.accent }}>
                    {h.icon} {h.name}
                  </span>
                </span>

                <button
                  onClick={() => {
                    if (window.confirm(`ลบนิสัย "${h.name}" และประวัติทั้งหมดใช่ไหม?`)) onDelete(h)
                  }}
                  aria-label={`ลบ ${h.name}`}
                  className="rounded-full px-2.5 py-1 text-[0.85rem] font-bold transition-transform hover:scale-110"
                  style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {adding ? (
        <form onSubmit={submit} className="rounded-2xl bg-white/80 p-3">
          <label className="label" htmlFor="habit-name">ชื่อนิสัย</label>
          <input
            id="habit-name"
            className="field mb-3"
            value={name}
            placeholder="เช่น ดื่มน้ำ 8 แก้ว"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <span className="label">ไอคอน</span>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                aria-pressed={icon === e}
                className="rounded-xl border-2 px-2 py-1 text-xl transition-transform hover:scale-110"
                style={{
                  borderColor: icon === e ? 'var(--color-pink-deep)' : '#f0e4da',
                  background: icon === e ? 'var(--color-pink)' : 'white',
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <span className="label">สี</span>
          <div className="mb-4 flex flex-wrap gap-2">
            {PASTEL_KEYS.map((c) => {
              const p = getPastel(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color === c}
                  aria-label={`สี ${c}`}
                  className="h-8 w-8 rounded-full border-[3px] transition-transform hover:scale-110"
                  style={{
                    background: p.bg,
                    borderColor: color === c ? p.accent : 'transparent',
                  }}
                />
              )
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn flex-1 text-[0.95rem]"
              style={{ background: 'var(--color-mint)', color: 'var(--color-mint-deep)' }}
            >
              เพิ่มเลย 🌱
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn text-[0.95rem]"
              style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="btn w-full text-[0.95rem]"
          style={{ background: 'var(--color-mint)', color: 'var(--color-mint-deep)' }}
        >
          ➕ เพิ่มนิสัยใหม่
        </button>
      )}
    </section>
  )
}
