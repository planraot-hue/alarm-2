'use client'

import { useState } from 'react'

/**
 * ล็อกอินแบบรหัสตายตัวตามที่โจทย์กำหนด (ไม่ใช้ Database)
 * หมายเหตุ: นี่เป็นแค่ประตูหน้าฝั่งเบราว์เซอร์ ไม่ใช่ระบบความปลอดภัยจริง
 * เพราะรหัสอยู่ในโค้ดฝั่ง client ที่ใครก็เปิดดูได้
 */
const USERNAME = 'admin'
const PASSWORD = 'raot1234'

export default function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (user.trim() === USERNAME && pass === PASSWORD) {
      setError('')
      onSuccess()
    } else {
      setError('อุ๊ย! ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้องน้า 🥲')
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <form onSubmit={submit} className="card animate-pop w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="animate-wiggle mb-2 text-6xl">🗓️</div>
          <h1 className="text-3xl font-bold">สมุดนัดน่ารัก</h1>
          <p className="mt-1 text-[0.95rem]" style={{ color: 'var(--color-ink-soft)' }}>
            เข้าสู่ระบบเพื่อดูนัดหมายของคุณ
          </p>
        </div>

        <div className="mb-4">
          <label className="label" htmlFor="username">
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            className="field"
            value={user}
            autoComplete="username"
            placeholder="admin"
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="label" htmlFor="password">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={pass}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPass(e.target.value)}
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
          className="btn w-full text-lg"
          style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
        >
          เข้าสู่ระบบ 🔑
        </button>
      </form>
    </main>
  )
}
