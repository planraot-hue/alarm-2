/*
 * Service Worker ของ My Planner
 *
 * หลักคิด: เว็บนี้ต้องต่อ Supabase ถึงจะใช้งานได้จริง จึงไม่พยายามทำ offline เต็มรูปแบบ
 * หน้าที่ของไฟล์นี้คือ
 *   1. ทำให้ติดตั้งเป็นแอปได้ (เบราว์เซอร์ต้องเห็นว่ามี fetch handler)
 *   2. เปิดแอปซ้ำแล้วเร็วขึ้น เพราะไฟล์ static ถูกแคชไว้
 *   3. เน็ตหลุดแล้วขึ้นหน้าบอกน่ารัก ๆ แทนหน้า error ของเบราว์เซอร์
 *
 * สิ่งที่ห้ามแคชเด็ดขาด: /api/* และคำขอไป Supabase/Google
 * เพราะเป็นข้อมูลสดและมี token ติดไปด้วย
 */

const VERSION = 'v1'
const STATIC_CACHE = `myplanner-static-${VERSION}`
const PAGE_CACHE = `myplanner-pages-${VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/flowers.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // ไฟล์ใดไฟล์หนึ่งโหลดไม่ได้ ต้องไม่ทำให้ติดตั้ง SW ล้มทั้งตัว
      .catch((err) => console.warn('precache ไม่ครบ', err))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('myplanner-') && k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

/** ให้หน้าเว็บสั่งอัปเดต SW ตัวใหม่ได้ทันทีโดยไม่ต้องปิดทุกแท็บ */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|css)$/i.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // ข้ามทุกอย่างที่ไม่ใช่โดเมนตัวเอง (Supabase, Google Fonts, Gemini)
  if (url.origin !== self.location.origin) return

  // ข้อมูลสด ห้ามแคช
  if (url.pathname.startsWith('/api/')) return

  // ไฟล์ static ของ Next มีแฮชในชื่ออยู่แล้ว แคชถาวรได้เลย
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
      )
    )
    return
  }

  // หน้าเว็บ: เอาของสดก่อนเสมอ เน็ตหลุดค่อยใช้ของในแคช
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(PAGE_CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          if (cached) return cached
          const offline = await caches.match(OFFLINE_URL)
          return offline || Response.error()
        })
    )
  }
})
