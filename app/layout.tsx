import type { Metadata, Viewport } from 'next'
import { Mali, Itim } from 'next/font/google'
import PwaInstaller from '@/components/PwaInstaller'
import './globals.css'

const mali = Mali({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mali',
  display: 'swap',
})

const itim = Itim({
  subsets: ['thai', 'latin'],
  weight: '400',
  variable: '--font-itim',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'My Planner 🌸 เตือนนัดสำคัญ',
  description: 'ปฏิทินนัดหมายส่วนตัว พร้อมแจ้งเตือนล่วงหน้า 3 วัน / 1 วัน / 1 ชั่วโมง',
  manifest: '/manifest.webmanifest',
  applicationName: 'My Planner',
  // iOS ไม่อ่าน manifest จึงต้องบอกซ้ำผ่าน meta ชุดนี้
  appleWebApp: {
    capable: true,
    title: 'My Planner',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    // Next 16 ปล่อยเฉพาะ mobile-web-app-capable ตัวใหม่
    // แต่ iOS รุ่นเก่ายังอ่านแค่ตัวที่มี apple- นำหน้า ถ้าไม่มีจะเปิดใน Safari แทนที่จะเต็มจอ
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#fff9f2',
  // เปิดจากหน้าจอโฮมบน iPhone ที่มีรอยบาก เนื้อหาจะได้ไม่โดนบัง
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${mali.variable} ${itim.variable}`}>
      <body>
        {children}
        <PwaInstaller />
      </body>
    </html>
  )
}
