'use client'

import { useState } from 'react'
import { PASTEL_KEYS, type PastelColor, type StickyNote, getPastel, newId } from '@/lib/types'

interface Props {
  notes: StickyNote[]
  onSave: (note: StickyNote) => void
  onDelete: (note: StickyNote) => void
}

/** เอียงเล็กน้อยให้ดูเหมือนโพสต์อิทแปะจริง — องศาคงที่ต่อโน้ตหนึ่งใบ ไม่สุ่มใหม่ทุกครั้งที่ re-render */
function tiltOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return ((Math.abs(hash) % 9) - 4) * 0.5 // -2deg ถึง +2deg
}

export default function StickyBoard({ notes, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startNew() {
    const note: StickyNote = {
      id: newId(),
      body: '',
      color: PASTEL_KEYS[notes.length % PASTEL_KEYS.length],
      sortOrder: notes.length,
    }
    onSave(note)
    setEditingId(note.id)
    setDraft('')
  }

  function commit(note: StickyNote) {
    const body = draft.trim()
    setEditingId(null)
    if (!body) {
      // โน้ตเปล่าไม่ต้องเก็บไว้รก
      onDelete(note)
      return
    }
    if (body !== note.body) onSave({ ...note, body })
  }

  function cycleColor(note: StickyNote) {
    const next = PASTEL_KEYS[(PASTEL_KEYS.indexOf(note.color) + 1) % PASTEL_KEYS.length]
    onSave({ ...note, color: next })
  }

  return (
    <section className="card">
      <h3 className="mb-1 text-xl font-bold">📌 กระดานโน้ต</h3>
      <p className="mb-3 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
        จดสั้น ๆ คำคมประจำวัน หรืออะไรที่ไม่อยากลืม
      </p>

      {notes.length === 0 ? (
        <div className="mb-3 rounded-3xl border-2 border-dashed border-[#f0e4da] py-8 text-center">
          <div className="mb-1 text-4xl">🗒️</div>
          <p style={{ color: 'var(--color-ink-soft)' }}>ยังไม่มีโน้ตเลย</p>
        </div>
      ) : (
        <div className="mb-3 grid grid-cols-2 gap-3">
          {notes.map((note) => {
            const p = getPastel(note.color)
            const editing = editingId === note.id
            return (
              <div
                key={note.id}
                className="relative rounded-xl p-3 transition-transform hover:-translate-y-0.5"
                style={{
                  background: p.bg,
                  transform: `rotate(${tiltOf(note.id)}deg)`,
                  boxShadow: '0 4px 12px rgba(74,64,56,0.14)',
                  // มุมพับแบบโพสต์อิท
                  clipPath: 'polygon(0 0, 100% 0, 100% 88%, 88% 100%, 0 100%)',
                }}
              >
                {editing ? (
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commit(note)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        if (!note.body) onDelete(note)
                      }
                    }}
                    placeholder="พิมพ์โน้ต…"
                    className="min-h-[5.5rem] w-full resize-none bg-transparent text-[0.95rem] outline-none"
                    style={{ color: p.accent, fontFamily: 'var(--font-hand)' }}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(note.id)
                      setDraft(note.body)
                    }}
                    className="min-h-[5.5rem] w-full text-left text-[0.95rem] break-words whitespace-pre-wrap"
                    style={{ color: p.accent }}
                  >
                    {note.body || 'แตะเพื่อเขียน…'}
                  </button>
                )}

                {!editing && (
                  <div className="mt-1 flex justify-end gap-1">
                    <button
                      onClick={() => cycleColor(note)}
                      aria-label="เปลี่ยนสีโน้ต"
                      title="เปลี่ยนสี"
                      className="rounded-full px-2 text-[0.8rem] font-bold transition-transform hover:scale-110"
                      style={{ background: 'rgba(255,255,255,0.65)', color: p.accent }}
                    >
                      🎨
                    </button>
                    <button
                      onClick={() => onDelete(note)}
                      aria-label="ลบโน้ต"
                      className="rounded-full px-2 text-[0.8rem] font-bold transition-transform hover:scale-110"
                      style={{ background: 'rgba(255,255,255,0.65)', color: p.accent }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={startNew}
        className="btn w-full text-[0.95rem]"
        style={{ background: 'var(--color-lemon)', color: 'var(--color-lemon-deep)' }}
      >
        ➕ แปะโน้ตใหม่
      </button>
    </section>
  )
}
