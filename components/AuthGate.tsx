'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/** แปลง error ของ Supabase เป็นข้อความไทยที่อ่านรู้เรื่อง */
function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้องน้า 🥲'
  if (m.includes('email not confirmed')) return 'อีเมลนี้ยังไม่ได้ยืนยัน ลองเช็คกล่องจดหมายดูนะ 📬'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'ลองบ่อยเกินไป พักสักครู่แล้วลองใหม่นะ ⏳'
  if (m.includes('failed to fetch') || m.includes('networkerror'))
    return 'ต่อกับ Supabase ไม่ได้ เช็คอินเทอร์เน็ตหรือค่า URL/anon key ดูนะ 🌐'
  return message
}

export default function AuthGate() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('กรอกอีเมลและรหัสผ่านให้ครบก่อนนะ')
      return
    }

    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)

    // สำเร็จแล้วไม่ต้องทำอะไรต่อ — onAuthStateChange ใน page.tsx จะพาเข้าหน้าปฏิทินเอง
    if (authError) setError(friendlyError(authError.message))
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <form onSubmit={submit} className="card animate-pop w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="animate-wiggle mb-2 text-6xl">🗓️</div>
          <h1 className="text-3xl font-bold">My Planner</h1>
          <p className="mt-1 text-[0.95rem]" style={{ color: 'var(--color-ink-soft)' }}>
            เข้าสู่ระบบเพื่อดูนัดหมายของคุณ
          </p>
        </div>

        <div className="mb-4">
          <label className="label" htmlFor="email">อีเมล</label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="label" htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
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

        <button
          type="submit"
          disabled={busy}
          className="btn w-full text-lg"
          style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
        >
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ 🔑'}
        </button>

        <p className="mt-4 text-center text-[0.85rem]" style={{ color: 'var(--color-ink-soft)' }}>
          บัญชีผู้ใช้สร้างจาก Supabase Dashboard → Authentication → Users
        </p>
      </form>
    </main>
  )
}
