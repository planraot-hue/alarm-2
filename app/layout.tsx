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

/**
 * LINE / Facebook ต้องการ og:image เป็น URL เต็ม (https://...) ไม่รับ path สั้น ๆ
 * ลำดับการหา: ตั้งเองก่อน → โดเมน production ของ Vercel → โดเมนของ deployment นั้น → localhost
 * ทำแบบนี้เพื่อให้ deploy บน Vercel แล้วทำงานได้เลยโดยไม่ต้องตั้งค่าอะไรเพิ่ม
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const TITLE = 'My Planner 🌸 เตือนนัดสำคัญ'
const DESCRIPTION =
  'แพลนเนอร์ส่วนตัวธีมพาสเทล จดนัดหมาย แจ้งเตือนล่วงหน้า 3 วัน / 1 วัน / 1 ชั่วโมง พร้อมบันทึกอารมณ์ ติดตามนิสัย และผู้ช่วย AI'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  // og:image มาจาก app/opengraph-image.tsx ที่ Next ต่อ URL เต็มให้เองจาก metadataBase
  openGraph: {
    type: 'website',
    siteName: 'My Planner',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
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
