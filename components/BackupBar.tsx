'use client'

import { useRef, useState } from 'react'
import { DEFAULT_REMINDERS, type AppEvent, newId } from '@/lib/types'

interface Props {
  events: AppEvent[]
  onImport: (events: AppEvent[]) => Promise<void>
}

/** ตรวจและเติมฟิลด์ที่ขาดของนัดหมายจากไฟล์ JSON ที่ผู้ใช้เลือกมา */
function normalizeImported(raw: unknown): AppEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Partial<AppEvent>

  const title = typeof e.title === 'string' ? e.title.trim() : ''
  const startDate = typeof e.startDate === 'string' ? e.startDate : ''
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null

  const endDate =
    typeof e.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.endDate) && e.endDate >= startDate
      ? e.endDate
      : startDate
  const allDay = e.allDay === true

  return {
    // ออก id ใหม่เสมอ กันชนกับนัดที่มีอยู่ และกันอ้าง id ของบัญชีอื่น
    id: newId(),
    title,
    category: typeof e.category === 'string' ? (e.category as AppEvent['category']) : 'other',
    startDate,
    endDate,
    allDay,
    startTime: !allDay && typeof e.startTime === 'string' ? e.startTime : undefined,
    endTime: !allDay && typeof e.endTime === 'string' ? e.endTime : undefined,
    location: typeof e.location === 'string' ? e.location : undefined,
    note: typeof e.note === 'string' ? e.note : undefined,
    reminders: Array.isArray(e.reminders) ? e.reminders : DEFAULT_REMINDERS,
    // ไฟล์แนบไม่ตามมาด้วย เพราะตัวไฟล์อยู่ใน Storage ของบัญชีเดิม
    attachments: [],
    createdAt: Date.now(),
  }
}

export default function BackupBar({ events, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'นัดหมาย-สำรอง.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('สำรองข้อมูลเรียบร้อย 💾')
  }

  async function importJson(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('รูปแบบไม่ถูกต้อง')

      const valid = parsed.map(normalizeImported).filter((e): e is AppEvent => e !== null)
      if (valid.length === 0) throw new Error('ไม่พบนัดหมายที่ใช้ได้')

      await onImport(valid)
      const skipped = parsed.length - valid.length
      setMessage(
        `นำเข้า ${valid.length} นัดเรียบร้อย ✨${skipped > 0 ? ` (ข้าม ${skipped} รายการที่ข้อมูลไม่ครบ)` : ''}`
      )
    } catch (err) {
      console.error(err)
      setMessage('ไฟล์นี้อ่านไม่ได้ ลองเลือกไฟล์สำรองที่ export จากเว็บนี้นะ')
    }
    if (inputRef.current) inputRef.current.value = ''
    setBusy(false)
  }

  return (
    <section className="card">
      <h3 className="mb-1 text-xl font-bold">💾 สำรองข้อมูล</h3>
      <p className="mb-3 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
        นัดหมายเก็บอยู่บน Supabase แล้ว ปุ่มนี้ไว้ดาวน์โหลดสำเนาเก็บเอง หรือย้ายเข้ามาจากไฟล์เก่า
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportJson}
          disabled={busy}
          className="btn text-[0.95rem]"
          style={{ background: 'var(--color-sky)', color: 'var(--color-sky-deep)' }}
        >
          ⬇️ Export JSON
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn text-[0.95rem]"
          style={{ background: 'var(--color-mint)', color: 'var(--color-mint-deep)' }}
        >
          {busy ? 'กำลังนำเข้า…' : '⬆️ Import JSON'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => importJson(e.target.files?.[0])}
        />
      </div>

      {message && (
        <p className="mt-2 text-[0.88rem] font-semibold" style={{ color: 'var(--color-ink-soft)' }}>
          {message}
        </p>
      )}
    </section>
  )
}
