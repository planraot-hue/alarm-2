'use client'

interface Site {
  name: string
  url: string
  icon: string
}

interface Group {
  id: string
  label: string
  icon: string
  color: string
  text: string
  sites: Site[]
}

const GROUPS: Group[] = [
  {
    id: 'flight',
    label: 'เครื่องบิน',
    icon: '✈️',
    color: 'var(--color-sky)',
    text: 'var(--color-sky-deep)',
    sites: [
      { name: 'Google Flights', url: 'https://www.google.com/travel/flights', icon: '🔎' },
      { name: 'Traveloka', url: 'https://www.traveloka.com/th-th/flight', icon: '🎫' },
      { name: 'Skyscanner', url: 'https://www.skyscanner.co.th/', icon: '🌏' },
      { name: 'Thai Airways', url: 'https://www.thaiairways.com/th_TH/index.page', icon: '💜' },
    ],
  },
  {
    id: 'train',
    label: 'รถไฟ',
    icon: '🚆',
    color: 'var(--color-mint)',
    text: 'var(--color-mint-deep)',
    sites: [
      { name: 'D-Ticket (การรถไฟฯ)', url: 'https://www.dticket.railway.co.th/', icon: '🎟️' },
      { name: 'การรถไฟแห่งประเทศไทย', url: 'https://www.railway.co.th/', icon: '🚉' },
      { name: 'SRT Red Line', url: 'https://www.srtet.co.th/', icon: '🔴' },
      { name: '12Go', url: 'https://12go.asia/th', icon: '🌏' },
    ],
  },
  {
    id: 'bus',
    label: 'รถทัวร์',
    icon: '🚌',
    color: 'var(--color-lemon)',
    text: 'var(--color-lemon-deep)',
    sites: [
      // ใช้ subdomain จองตั๋วโดยตรง — www.transport.co.th ใบรับรอง TLS มีปัญหา เบราว์เซอร์จะขึ้นเตือน
      { name: 'บขส. จองตั๋วออนไลน์', url: 'https://tcl99web.transport.co.th/', icon: '🎫' },
      { name: 'นครชัยแอร์', url: 'https://www.nakhonchaiair.com/', icon: '💛' },
      { name: 'BusOnlineTicket', url: 'https://www.busonlineticket.co.th/', icon: '🔎' },
      { name: '12Go', url: 'https://12go.asia/th', icon: '🌏' },
    ],
  },
]

function LinkPill({ site, color, text, small }: { site: Site; color: string; text: string; small?: boolean }) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full font-semibold transition-transform hover:-translate-y-0.5 ${
        small ? 'px-3 py-1 text-[0.82rem]' : 'btn text-[0.95rem]'
      }`}
      style={{ background: color, color: text }}
    >
      {site.icon} {site.name}
    </a>
  )
}

/** compact = แถบเล็กที่โผล่ในการ์ดนัดประเภทเดินทาง */
export default function BookingLinks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {GROUPS.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
              {g.icon} {g.label}:
            </span>
            {g.sites.slice(0, 2).map((s) => (
              <LinkPill key={s.name} site={s} color={g.color} text={g.text} small />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className="card">
      <h3 className="mb-1 text-xl font-bold">🎫 จองตั๋วเดินทาง</h3>
      <p className="mb-4 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
        มีทริปเร็ว ๆ นี้? กดจองได้เลย
      </p>

      <div className="flex flex-col gap-4">
        {GROUPS.map((g) => (
          <div key={g.id}>
            <h4 className="mb-2 flex items-center gap-1.5 text-[1rem] font-bold" style={{ color: g.text }}>
              <span className="text-xl">{g.icon}</span> {g.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {g.sites.map((s) => (
                <LinkPill key={s.name} site={s} color={g.color} text={g.text} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
