'use client'

import { useEffect, useState } from 'react'

/** event ตัวนี้ยังไม่อยู่ใน lib.dom ของ TypeScript จึงต้องประกาศเอง */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'alarm2.pwaDismissed.v1'

export default function PwaInstaller() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    // ลงทะเบียน service worker — ต้องมีเบราว์เซอร์ถึงจะยอมให้ติดตั้งเป็นแอป
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('ลงทะเบียน service worker ไม่สำเร็จ', err))
    }

    let dismissed = false
    try {
      dismissed = window.localStorage.getItem(DISMISSED_KEY) === 'yes'
    } catch {
      /* โหมดส่วนตัวอ่าน localStorage ไม่ได้ ก็ถือว่ายังไม่เคยปิด */
    }

    function onPrompt(e: Event) {
      // กันไม่ให้ Chrome เด้ง mini-infobar ของตัวเอง จะได้คุมจังหวะเองได้
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      if (!dismissed) setHidden(false)
    }

    function onInstalled() {
      setDeferred(null)
      setHidden(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    // ใช้ได้ครั้งเดียว ต้องทิ้งไปไม่ว่าผู้ใช้จะกดติดตั้งหรือยกเลิก
    setDeferred(null)
    setHidden(true)
  }

  function dismiss() {
    setHidden(true)
    try {
      window.localStorage.setItem(DISMISSED_KEY, 'yes')
    } catch {
      /* ปิดไม่ถาวรก็ไม่เป็นไร */
    }
  }

  if (hidden || !deferred) return null

  return (
    // z-30 และชิดซ้าย ไม่ให้ทับปุ่มแชต (z-40 ขวาล่าง) กับป็อบอัปแจ้งเตือน (z-50)
    <div className="fixed bottom-4 left-4 z-30 max-w-[17rem]">
      <div
        className="animate-pop flex items-center gap-2 rounded-3xl bg-white p-3"
        style={{ boxShadow: '0 10px 30px rgba(74,64,56,0.2)' }}
        role="dialog"
        aria-label="ติดตั้งแอป"
      >
        <span className="text-3xl" aria-hidden>
          🌸
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.92rem] leading-snug font-bold">ติดตั้งเป็นแอปไหม?</p>
          <p className="text-[0.78rem]" style={{ color: 'var(--color-ink-soft)' }}>
            เปิดจากหน้าจอโฮมได้เลย ไม่ต้องผ่านเบราว์เซอร์
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <button
              onClick={install}
              className="rounded-full px-3 py-1 text-[0.85rem] font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--color-pink)', color: 'var(--color-pink-deep)' }}
            >
              ติดตั้ง
            </button>
            <button
              onClick={dismiss}
              className="rounded-full px-3 py-1 text-[0.85rem] font-semibold"
              style={{ background: 'var(--color-cream)', color: 'var(--color-ink-soft)' }}
            >
              ไว้ก่อน
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
