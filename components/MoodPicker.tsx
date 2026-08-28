'use client'

import { MOODS, type Mood } from '@/lib/types'

interface Props {
  dateKey: string
  mood?: Mood
  onPick: (emoji: string) => void
  onClear: () => void
  /** compact = แถวเล็กสำหรับมุมมองสัปดาห์ */
  compact?: boolean
}

export default function MoodPicker({ dateKey, mood, onPick, onClear, compact }: Props) {
  if (compact) {
    return (
      <div className="flex flex-wrap justify-center gap-0.5">
        {MOODS.map((m) => {
          const on = mood?.emoji === m.emoji
          return (
            <button
              key={m.emoji}
              onClick={() => (on ? onClear() : onPick(m.emoji))}
              title={m.label}
              aria-label={m.label}
              aria-pressed={on}
              className="rounded-full text-base leading-none transition-transform hover:scale-125"
              style={{
                padding: '2px 3px',
                background: on ? m.color : 'transparent',
                filter: on ? 'none' : 'grayscale(1)',
                opacity: on ? 1 : 0.45,
              }}
            >
              {m.emoji}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <section className="card">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xl font-bold">💗 วันนี้รู้สึกยังไง</h3>
        {mood && (
          <button
            onClick={onClear}
            className="rounded-full px-3 py-0.5 text-[0.82rem] font-semibold"
            style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
          >
            ล้าง
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const on = mood?.emoji === m.emoji
          return (
            <button
              key={m.emoji}
              onClick={() => (on ? onClear() : onPick(m.emoji))}
              aria-pressed={on}
              aria-label={m.label}
              className="flex min-w-[4.2rem] flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-2 transition-transform hover:-translate-y-1"
              style={{
                background: on ? m.color : 'white',
                borderColor: on ? 'var(--color-ink-soft)' : '#f0e4da',
                // อันที่ไม่ได้เลือกทำเป็นสีจาง ๆ ให้อันที่เลือกเด่นออกมา
                filter: on ? 'none' : 'grayscale(0.7)',
                opacity: on ? 1 : 0.7,
              }}
            >
              <span className="text-3xl leading-none">{m.emoji}</span>
              <span className="text-[0.75rem] font-semibold" style={{ color: 'var(--color-ink-soft)' }}>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>

      {!mood && (
        <p className="mt-2 text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
          ยังไม่ได้บันทึกอารมณ์ของวันที่ {dateKey}
        </p>
      )}
    </section>
  )
}
