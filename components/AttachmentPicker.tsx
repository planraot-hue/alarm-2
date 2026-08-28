'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MAX_FILE_BYTES,
  formatSize,
  getSignedUrl,
  removeStorageFiles,
  uploadAttachment,
} from '@/lib/attachments'
import type { Attachment } from '@/lib/types'

interface Props {
  value: Attachment[]
  userId: string
  onChange: (next: Attachment[]) => void
}

/** พรีวิวรูปย่อผ่าน signed URL ของ bucket แบบ private */
function Thumb({ att }: { att: Attachment }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSignedUrl(att.storagePath).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [att.storagePath])

  if (!url) return <span className="text-2xl">🖼️</span>
  // ใช้ <img> ตรง ๆ เพราะเป็น signed URL ชั่วคราวที่ next/image ปรับขนาดให้ไม่ได้
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-11 w-11 rounded-xl object-cover" />
}

export default function AttachmentPicker({ value, userId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError('')

    const added: Attachment[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" ใหญ่เกิน ${formatSize(MAX_FILE_BYTES)} เลยข้ามไปนะ`)
        continue
      }
      try {
        added.push(await uploadAttachment(file, userId))
      } catch (err) {
        console.error(err)
        setError(`อัปโหลด "${file.name}" ไม่สำเร็จ ลองใหม่อีกครั้งนะ`)
      }
    }

    if (added.length) onChange([...value, ...added])
    if (inputRef.current) inputRef.current.value = ''
    setBusy(false)
  }

  async function remove(att: Attachment) {
    await removeStorageFiles([att.storagePath])
    onChange(value.filter((a) => a.id !== att.id))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        className="btn text-[0.95rem]"
        style={{ background: 'var(--color-mint)', color: 'var(--color-mint-deep)' }}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'กำลังอัปโหลด…' : '📎 แนบเอกสาร / รูปภาพ'}
      </button>

      {error && (
        <p className="mt-2 text-[0.88rem] font-semibold" style={{ color: 'var(--color-pink-deep)' }}>
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((att) => (
            <li key={att.id} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                {att.type.startsWith('image/') ? <Thumb att={att} /> : <span className="text-2xl">📄</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] font-semibold">{att.name}</span>
                <span className="text-[0.82rem]" style={{ color: 'var(--color-ink-soft)' }}>
                  {formatSize(att.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(att)}
                aria-label={`ลบไฟล์ ${att.name}`}
                className="rounded-full px-3 py-1 font-bold transition-transform hover:scale-110"
                style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
