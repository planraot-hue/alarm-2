'use client'

const SITES = [
  { name: 'Google Flights', url: 'https://www.google.com/travel/flights', color: 'var(--color-sky)', text: 'var(--color-sky-deep)', icon: '🔎' },
  { name: 'Traveloka', url: 'https://www.traveloka.com/th-th/flight', color: 'var(--color-mint)', text: 'var(--color-mint-deep)', icon: '🎫' },
  { name: 'Skyscanner', url: 'https://www.skyscanner.co.th/', color: 'var(--color-lilac)', text: 'var(--color-lilac-deep)', icon: '🌏' },
  { name: 'Thai Airways', url: 'https://www.thaiairways.com/th_TH/index.page', color: 'var(--color-peach)', text: '#b36c3c', icon: '💜' },
]

/** compact = แถบเล็กที่โผล่ในการ์ดนัดประเภทเดินทาง */
export default function FlightLinks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
          จองตั๋ว:
        </span>
        {SITES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: s.color, color: s.text }}
          >
            {s.icon} {s.name}
          </a>
        ))}
      </div>
    )
  }

  return (
    <section className="card">
      <h3 className="mb-1 text-xl font-bold">✈️ จองตั๋วเครื่องบิน</h3>
      <p className="mb-3 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
        มีทริปเร็ว ๆ นี้? กดจองได้เลย
      </p>
      <div className="flex flex-wrap gap-2">
        {SITES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-[0.95rem]"
            style={{ background: s.color, color: s.text }}
          >
            {s.icon} {s.name}
          </a>
        ))}
      </div>
    </section>
  )
}
