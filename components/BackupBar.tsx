'use client'

import { useRef, useState } from 'react'
import { normalizeEvents } from '@/lib/storage'
import type { AppEvent } from '@/lib/types'

interface Props {
  events: AppEvent[]
  onImport: (events: AppEvent[]) => void
}

/**
 * เพราะไม่ใช้ Database ข้อมูลจึงอยู่แค่ในเบราว์เซอร์เครื่องนี้
 * ปุ่มนี้ให้สำรอง/ย้ายข้อมูลไปเครื่องอื่นได้
 * (ไฟล์แนบไม่รวมอยู่ใน JSON เพราะเป็น Blob ขนาดใหญ่ใน IndexedDB)
 */
export default function BackupBar({ events, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `นัดหมาย-สำรอง.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('สำรองข้อมูลเรียบร้อย 💾')
  }

  async function importJson(file: File | undefined) {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('รูปแบบไม่ถูกต้อง')

      const valid = normalizeEvents(parsed)
      if (valid.length === 0) throw new Error('ไม่พบนัดหมายที่ใช้ได้')

      onImport(valid)
      const skipped = parsed.length - valid.length
      setMessage(
        `นำเข้า ${valid.length} นัดเรียบร้อย ✨${skipped > 0 ? ` (ข้าม ${skipped} รายการที่ข้อมูลไม่ครบ)` : ''}`
      )
    } catch {
      setMessage('ไฟล์นี้อ่านไม่ได้ ลองเลือกไฟล์สำรองที่ export จากเว็บนี้นะ')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="card">
      <h3 className="mb-1 text-xl font-bold">💾 สำรองข้อมูล</h3>
      <p className="mb-3 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
        ข้อมูลเก็บอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ควร export เก็บไว้เผื่อเปลี่ยนเครื่องหรือล้างข้อมูล
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportJson}
          className="btn text-[0.95rem]"
          style={{ background: 'var(--color-sky)', color: 'var(--color-sky-deep)' }}
        >
          ⬇️ Export JSON
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="btn text-[0.95rem]"
          style={{ background: 'var(--color-mint)', color: 'var(--color-mint-deep)' }}
        >
          ⬆️ Import JSON
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
