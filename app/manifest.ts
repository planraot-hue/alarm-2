import type { MetadataRoute } from 'next'

/**
 * Web App Manifest — Next.js เสิร์ฟไฟล์นี้ที่ /manifest.webmanifest ให้เอง
 *
 * ต้องมีไอคอนขนาด 192 และ 512 อย่างน้อย เบราว์เซอร์ถึงจะยอมให้ติดตั้ง
 * และต้องมีตัว purpose 'maskable' แยกต่างหาก ไม่งั้นบน Android
 * ไอคอนจะถูกครอบเป็นวงกลมแล้วเนื้อหาริมขอบหายไป
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'My Planner — เว็บแจ้งเตือนนัดสำคัญ',
    short_name: 'My Planner',
    description:
      'แพลนเนอร์ส่วนตัวธีมพาสเทล จดนัดหมาย แจ้งเตือนล่วงหน้า บันทึกอารมณ์ ติดตามนิสัย และแปะโน้ต',
    lang: 'th',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff9f2',
    theme_color: '#ffc2d1',
    orientation: 'any',
    categories: ['productivity', 'lifestyle', 'utilities'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
