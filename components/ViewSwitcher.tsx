'use client'

import type { ViewMode } from '@/lib/types'

const VIEWS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'day', label: 'รายวัน', icon: '📖' },
  { id: 'week', label: 'รายสัปดาห์', icon: '🗒️' },
  { id: 'month', label: 'รายเดือน', icon: '📅' },
]

export default function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div
      className="inline-flex gap-1 rounded-full p-1"
      role="tablist"
      aria-label="เลือกมุมมอง"
      style={{ background: 'rgba(255,255,255,0.75)' }}
    >
      {VIEWS.map((v) => {
        const on = v.id === value
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(v.id)}
            className="rounded-full px-4 py-1.5 text-[0.95rem] font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              background: on ? 'var(--color-pink)' : 'transparent',
              color: on ? 'var(--color-pink-deep)' : 'var(--color-ink-soft)',
              boxShadow: on ? '0 2px 0 rgba(74,64,56,0.12)' : 'none',
            }}
          >
            {v.icon} {v.label}
          </button>
        )
      })}
    </div>
  )
}
