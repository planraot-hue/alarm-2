import type { Metadata, Viewport } from 'next'
import { Mali, Itim } from 'next/font/google'
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
  title: 'สมุดนัดน่ารัก 🌸 เตือนนัดสำคัญ',
  description: 'ปฏิทินนัดหมายส่วนตัว พร้อมแจ้งเตือนล่วงหน้า 3 วัน / 1 วัน / 1 ชั่วโมง',
}

export const viewport: Viewport = {
  themeColor: '#fff9f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${mali.variable} ${itim.variable}`}>
      <body>{children}</body>
    </html>
  )
}
