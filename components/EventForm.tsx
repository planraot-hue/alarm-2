'use client'

import { useEffect, useState } from 'react'
import AttachmentPicker from './AttachmentPicker'
import { CATEGORIES } from '@/lib/categories'
import {
  type AppEvent,
  type Attachment,
  type CategoryId,
  type ReminderOffset,
  DEFAULT_REMINDERS,
  REMINDER_OPTIONS,
  newId,
} from '@/lib/types'

interface Props {
  /** นัดที่กำลังแก้ไข — ถ้า null คือสร้างใหม่ */
  editing: AppEvent | null
  defaultDate: string
  onSave: (ev: AppEvent) => void
  onClose: () => void
}

export default function EventForm({ editing, defaultDate, onSave, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>('meeting')
  const [startDate, setStartDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [reminders, setReminders] = useState<ReminderOffset[]>(DEFAULT_REMINDERS)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setCategory(editing.category)
      setStartDate(editing.startDate)
      setEndDate(editing.endDate || editing.startDate)
      setAllDay(editing.allDay)
      setStartTime(editing.startTime ?? '09:00')
      setEndTime(editing.endTime ?? '10:00')
      setLocation(editing.location ?? '')
      setNote(editing.note ?? '')
      setReminders(editing.reminders ?? DEFAULT_REMINDERS)
      setAttachments(editing.attachments ?? [])
    } else {
      setStartDate(defaultDate)
      setEndDate(defaultDate)
    }
  }, [editing, defaultDate])

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleReminder(value: ReminderOffset) {
    setReminders((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setError('ใส่ชื่อเรื่องนัดหมายด้วยนะ')
      return
    }
    if (endDate < startDate) {
      setError('วันสิ้นสุดต้องไม่มาก่อนวันเริ่ม')
      return
    }
    if (!allDay && endTime && startDate === endDate && endTime < startTime) {
      setError('เวลาสิ้นสุดต้องหลังเวลาเริ่ม')
      return
    }

    onSave({
      id: editing?.id ?? newId(),
      title: title.trim(),
      category,
      startDate,
      endDate,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
      reminders,
      attachments,
      createdAt: editing?.createdAt ?? Date.now(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/25 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย'}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="card animate-pop my-auto w-full max-w-xl !bg-white"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">
            {editing ? '✏️ แก้ไขนัดหมาย' : '✨ เพิ่มนัดหมายใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-full px-3 py-1 text-xl font-bold"
            style={{ background: 'var(--color-cream)' }}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="label" htmlFor="title">ชื่อเรื่อง</label>
          <input
            id="title"
            className="field text-lg"
            value={title}
            placeholder="เช่น นัดหมอฟัน, ประชุมทีม"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <span className="label">ประเภทกิจกรรม</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="rounded-full border-2 px-3.5 py-1.5 text-[0.92rem] font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                  background: category === c.id ? c.color : 'white',
                  borderColor: category === c.id ? c.accent : '#f0e4da',
                  color: category === c.id ? c.accent : 'var(--color-ink-soft)',
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="startDate">วันเริ่ม</label>
            <input
              id="startDate"
              type="date"
              className="field"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate < e.target.value) setEndDate(e.target.value)
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="endDate">วันสิ้นสุด (นัดหลายวันได้)</label>
            <input
              id="endDate"
              type="date"
              className="field"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <label className="mb-3 flex cursor-pointer items-center gap-2.5 font-semibold">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-5 w-5 accent-[#c25a7c]"
          />
          จัดทั้งวัน (ไม่ระบุเวลา)
        </label>

        {!allDay && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="startTime">เวลาเริ่ม</label>
              <input
                id="startTime"
                type="time"
                className="field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="endTime">เวลาสิ้นสุด</label>
              <input
                id="endTime"
                type="time"
                className="field"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="label" htmlFor="location">สถานที่</label>
          <input
            id="location"
            className="field"
            value={location}
            placeholder="เช่น โรงพยาบาลกรุงเทพ ซอยศูนย์วิจัย"
            onChange={(e) => setLocation(e.target.value)}
          />
          <p className="mt-1 text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
            ใส่ชื่อสถานที่แล้วจะมีปุ่มเปิด Google Maps ให้ในการ์ดนัด
          </p>
        </div>

        <div className="mb-4">
          <span className="label">แจ้งเตือนล่วงหน้า</span>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const on = reminders.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  aria-pressed={on}
                  className="rounded-full border-2 px-3.5 py-1.5 text-[0.92rem] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{
                    background: on ? 'var(--color-lemon)' : 'white',
                    borderColor: on ? 'var(--color-lemon-deep)' : '#f0e4da',
                    color: on ? 'var(--color-lemon-deep)' : 'var(--color-ink-soft)',
                  }}
                >
                  {on ? '🔔' : '🔕'} {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="label" htmlFor="note">โน้ตเพิ่มเติม</label>
          <textarea
            id="note"
            className="field min-h-[5rem]"
            value={note}
            placeholder="สิ่งที่ต้องเตรียม, เบอร์ติดต่อ ฯลฯ"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <span className="label">ไฟล์แนบ</span>
          <AttachmentPicker value={attachments} onChange={setAttachments} />
        </div>

        {error && (
          <p
            className="animate-pop mb-4 rounded-2xl px-4 py-3 text-center font-semibold"
            style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn flex-1 text-lg"
            style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
          >
            {editing ? 'บันทึกการแก้ไข 💾' : 'เพิ่มนัดหมาย 💖'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
