'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildUserContext } from '@/lib/aiContext'
import { clearChatMessages, fetchChatMessages, insertChatMessage } from '@/lib/db'
import { todayKey } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import {
  type AppEvent,
  type ChatMessage,
  type Habit,
  type Mood,
  type StickyNote,
  CHAT_HISTORY_LIMIT,
  MAX_CHAT_CHARS,
  newId,
} from '@/lib/types'

interface Props {
  userId: string
  events: AppEvent[]
  moods: Mood[]
  habits: Habit[]
  habitLogs: Set<string>
  notes: StickyNote[]
}

const SUGGESTIONS = [
  'พรุ่งนี้มีนัดอะไรบ้าง',
  'สัปดาห์นี้เป็นยังไงบ้าง',
  'ตั้งเตือนล่วงหน้ายังไง',
  'ช่วยสรุปนัดที่กำลังจะถึงให้หน่อย',
]

export default function ChatBot({ userId, events, moods, habits, habitLogs, notes }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // โหลดประวัติครั้งแรกที่เปิดแชต ไม่ต้องดึงตั้งแต่เข้าเว็บ
  useEffect(() => {
    if (!open || loaded) return
    setLoaded(true)
    fetchChatMessages()
      .then(setMessages)
      .catch((err) => {
        console.error(err)
        setError('โหลดประวัติแชตไม่สำเร็จ — รัน schema.sql เวอร์ชันล่าสุดแล้วหรือยัง')
      })
  }, [open, loaded])

  // เลื่อนลงล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || busy) return
      if (message.length > MAX_CHAT_CHARS) {
        setError(`ข้อความยาวเกิน ${MAX_CHAT_CHARS} ตัวอักษร`)
        return
      }

      setError('')
      setInput('')
      setBusy(true)

      const mine: ChatMessage = { id: newId(), role: 'user', body: message, createdAt: Date.now() }
      const history = messages.slice(-CHAT_HISTORY_LIMIT).map((m) => ({ role: m.role, text: m.body }))
      setMessages((prev) => [...prev, mine])

      try {
        // route ฝั่งเซิร์ฟเวอร์ต้องได้ token ไปยืนยันตัวตน ไม่งั้นใครก็ยิงคีย์ Gemini ของเราได้
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('เซสชันหมดอายุ ลองเข้าสู่ระบบใหม่นะ')

        const context = buildUserContext({
          today: todayKey(),
          events,
          moods,
          habits,
          habitLogs,
          notes,
        })

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message, history, context }),
        })
        const json = (await res.json()) as { reply?: string; error?: string }
        if (!res.ok || !json.reply) throw new Error(json.error ?? 'ถามผู้ช่วยไม่สำเร็จ')

        const theirs: ChatMessage = {
          id: newId(),
          role: 'model',
          body: json.reply,
          createdAt: Date.now(),
        }
        setMessages((prev) => [...prev, theirs])

        // เก็บประวัติแบบ best-effort — ถ้าบันทึกไม่ได้ก็ยังคุยต่อได้
        insertChatMessage(mine, userId).catch(console.error)
        insertChatMessage(theirs, userId).catch(console.error)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'ถามผู้ช่วยไม่สำเร็จ')
        setMessages((prev) => prev.filter((m) => m.id !== mine.id))
        setInput(message) // คืนข้อความให้ไม่ต้องพิมพ์ใหม่
      }
      setBusy(false)
    },
    [busy, messages, events, moods, habits, habitLogs, notes, userId]
  )

  async function handleClear() {
    if (!window.confirm('ล้างประวัติการสนทนาทั้งหมดใช่ไหม?')) return
    setMessages([])
    setError('')
    try {
      await clearChatMessages(userId)
    } catch (err) {
      console.error(err)
      setError('ล้างประวัติไม่สำเร็จ')
    }
  }

  return (
    <>
      {/* ปุ่มลอย — z-40 เพื่อให้ป็อบอัปแจ้งเตือน (z-50) ยังอยู่บนสุดเสมอ
          และยกสูงจากขอบล่างไม่ให้ทับปุ่มขออนุญาตแจ้งเตือนที่อยู่กลางล่าง */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="เปิดแชตกับผู้ช่วย"
          className="fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full text-3xl transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
          style={{ background: 'var(--color-lilac)', boxShadow: '0 8px 24px rgba(74,64,56,0.24)' }}
        >
          💬
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-20 z-40 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white sm:right-6 sm:bottom-6"
          style={{ height: 'min(34rem, calc(100dvh - 8rem))', boxShadow: '0 16px 48px rgba(74,64,56,0.28)' }}
          role="dialog"
          aria-label="แชตกับผู้ช่วย"
        >
          {/* หัว */}
          <header
            className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
            style={{ background: 'var(--color-lilac)' }}
          >
            <div className="min-w-0">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-lilac-deep)' }}>
                🌸 น้องแพลน
              </h3>
              <p className="text-[0.78rem]" style={{ color: 'var(--color-lilac-deep)' }}>
                ผู้ช่วยประจำแพลนเนอร์
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  aria-label="ล้างประวัติ"
                  title="ล้างประวัติ"
                  className="rounded-full px-2.5 py-1 text-[0.9rem] transition-transform hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                >
                  🧹
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="ปิดแชต"
                className="rounded-full px-2.5 py-1 font-bold transition-transform hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.7)' }}
              >
                ✕
              </button>
            </div>
          </header>

          {/* ข้อความ */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3" style={{ background: 'var(--color-cream)' }}>
            {messages.length === 0 && !busy && (
              <div className="py-2 text-center">
                <div className="mb-1 text-4xl">🌷</div>
                <p className="mb-1 text-[0.95rem] font-semibold">สวัสดี! ถามอะไรก็ได้เลย</p>
                <p className="mb-3 text-[0.78rem]" style={{ color: 'var(--color-ink-soft)' }}>
                  ถามได้ทั้งวิธีใช้เว็บ และตารางนัดของคุณเอง
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-2xl px-3 py-2 text-[0.88rem] font-semibold transition-transform hover:-translate-y-0.5"
                      style={{ background: 'white', color: 'var(--color-lilac-deep)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[0.92rem] whitespace-pre-wrap ${
                    m.role === 'user' ? 'self-end' : 'self-start'
                  }`}
                  style={
                    m.role === 'user'
                      ? { background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }
                      : { background: 'white', color: 'var(--color-ink)' }
                  }
                >
                  {m.body}
                </div>
              ))}

              {busy && (
                <div className="self-start rounded-2xl bg-white px-3 py-2" aria-live="polite">
                  <span className="animate-wiggle inline-block text-[0.92rem]">กำลังคิด… 💭</span>
                </div>
              )}
            </div>

            {error && (
              <p
                className="animate-pop mt-2 rounded-2xl px-3 py-2 text-[0.85rem] font-semibold"
                style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {/* ช่องพิมพ์ */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex shrink-0 items-end gap-2 border-t-2 border-[#f0e4da] bg-white px-3 py-2.5"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              maxLength={MAX_CHAT_CHARS}
              placeholder="พิมพ์คำถาม…"
              disabled={busy}
              className="field max-h-24 min-h-[2.6rem] flex-1 resize-none py-1.5 text-[0.95rem]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="ส่ง"
              className="btn shrink-0 px-4 py-2"
              style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
            >
              ส่ง
            </button>
          </form>

          <p
            className="shrink-0 bg-white px-3 pb-2 text-center text-[0.7rem]"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            ข้อมูลนัดหมายของคุณถูกส่งไปประมวลผลที่ Google Gemini
          </p>
        </div>
      )}
    </>
  )
}
