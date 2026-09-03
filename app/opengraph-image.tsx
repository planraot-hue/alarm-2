import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/**
 * รูปพรีวิวตอนแชร์ลิงก์ (LINE / Facebook / X / Discord)
 *
 * ไฟล์ชื่อ opengraph-image.tsx ตามข้อตกลงของ Next.js
 * Next จะสร้าง <meta property="og:image"> ชี้มาที่ route นี้ให้เอง
 *
 * 1200x630 คือขนาดที่ LINE และแพลตฟอร์มอื่นแนะนำ (อัตราส่วน 1.91:1)
 * ถ้าเล็กกว่า 300x300 LINE จะไม่แสดงรูปเลย
 *
 * ข้อควรระวัง: ตัวเรนเดอร์ (satori) วาดอีโมจิได้ไม่ครบทุกตัว
 * ตัวที่วาดไม่ได้จะกลายเป็นจุดสามจุด จึงใช้เฉพาะตัวที่ทดสอบแล้วว่าออก
 */

export const alt = 'My Planner — แพลนเนอร์ส่วนตัว จดนัดหมาย แจ้งเตือนล่วงหน้า'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface FlowerProps {
  size: number
  petal: string
  center: string
  rotate?: number
  /** ใส่ top/left = วางแบบลอย (ดอกประดับ), ไม่ใส่ = วางตามลำดับปกติ (ดอกโลโก้) */
  top?: number
  left?: number
}

function Flower({ size: s, petal, center, rotate = 0, top, left }: FlowerProps) {
  const petalSize = s * 0.44
  const spread = s * 0.28
  const floating = top !== undefined && left !== undefined

  return (
    <div
      style={{
        position: floating ? 'absolute' : 'relative',
        ...(floating ? { top, left } : {}),
        width: s,
        height: s,
        display: 'flex',
        flexShrink: 0,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: petalSize,
              height: petalSize,
              borderRadius: petalSize,
              background: petal,
              left: s / 2 - petalSize / 2 + Math.cos(a) * spread,
              top: s / 2 - petalSize / 2 + Math.sin(a) * spread,
            }}
          />
        )
      })}
      <div
        style={{
          position: 'absolute',
          width: petalSize * 0.62,
          height: petalSize * 0.62,
          borderRadius: petalSize,
          background: center,
          left: s / 2 - (petalSize * 0.62) / 2,
          top: s / 2 - (petalSize * 0.62) / 2,
        }}
      />
    </div>
  )
}

export default async function Image() {
  // อ่านฟอนต์จากไฟล์ในโปรเจกต์ ไม่ยิงเน็ตตอน render
  // ถ้าไม่ใส่ฟอนต์ที่มีสระไทย ตัวอักษรจะกลายเป็นกล่องสี่เหลี่ยมทั้งหมด
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), 'assets/Mali-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/Mali-Bold.ttf')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff9f2',
          fontFamily: 'Mali',
          position: 'relative',
        }}
      >
        {/* ดอกไม้ประดับ วางชิดมุมทั้งสี่ ไม่ให้ทับข้อความหรือแถบฟีเจอร์ตรงกลาง */}
        <Flower size={190} petal="#FFC2D1" center="#FFD34E" top={-55} left={-55} />
        <Flower size={120} petal="#BEE3F8" center="#FFD34E" top={70} left={130} rotate={20} />
        <Flower size={170} petal="#E2D6FF" center="#FFD34E" top={-45} left={1075} rotate={30} />
        <Flower size={110} petal="#FFE8A3" center="#FFC2D1" top={95} left={950} rotate={12} />
        <Flower size={150} petal="#C6F1D6" center="#FFD34E" top={525} left={-40} rotate={-15} />
        <Flower size={125} petal="#FFD8BE" center="#FFD34E" top={540} left={1105} rotate={-25} />

        {/* ดอกใหญ่เป็นโลโก้ อยู่ในลำดับปกติ ระยะห่างจึงคำนวณเองไม่ต้องดัน margin */}
        <Flower size={168} petal="#FFA8C0" center="#FFD34E" />

        <div
          style={{
            display: 'flex',
            fontSize: 88,
            fontWeight: 700,
            color: '#4a4038',
            marginTop: 26,
            lineHeight: 1.1,
          }}
        >
          My Planner
        </div>

        <div style={{ display: 'flex', fontSize: 36, color: '#8a7f74', marginTop: 6 }}>
          แพลนเนอร์ส่วนตัว จดนัดหมาย ไม่ให้ลืม
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 32 }}>
          {[
            { text: '🔔 เตือนล่วงหน้า', bg: '#FFC2D1', fg: '#C25A7C' },
            { text: '💗 บันทึกอารมณ์', bg: '#E2D6FF', fg: '#6D55B0' },
            { text: '✅ ติดตามนิสัย', bg: '#C6F1D6', fg: '#3E8C63' },
            { text: '✨ ผู้ช่วย AI', bg: '#BEE3F8', fg: '#3E7CA6' },
          ].map((chip) => (
            <div
              key={chip.text}
              style={{
                display: 'flex',
                background: chip.bg,
                color: chip.fg,
                fontSize: 26,
                padding: '9px 24px',
                borderRadius: 999,
              }}
            >
              {chip.text}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Mali', data: regular, weight: 400, style: 'normal' },
        { name: 'Mali', data: bold, weight: 700, style: 'normal' },
      ],
    }
  )
}
