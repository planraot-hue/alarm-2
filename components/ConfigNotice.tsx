'use client'

/** แสดงเมื่อยังไม่ได้ตั้งค่า env ของ Supabase — ดีกว่าปล่อยให้หน้าจอพังเงียบ ๆ */
export default function ConfigNotice() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <div className="card w-full max-w-lg">
        <div className="mb-3 text-center text-5xl">🔧</div>
        <h1 className="mb-3 text-center text-2xl font-bold">ยังไม่ได้ตั้งค่า Supabase</h1>
        <p className="mb-3" style={{ color: 'var(--color-ink-soft)' }}>
          สร้างไฟล์ <code>.env.local</code> ที่รากโปรเจกต์ แล้วใส่ค่า 2 ตัวนี้
          (หาได้ที่ Supabase Dashboard → Project Settings → API):
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-white/80 p-4 text-[0.85rem]">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="mt-3 text-[0.9rem]" style={{ color: 'var(--color-ink-soft)' }}>
          แล้วรัน <code>npm run dev</code> ใหม่อีกครั้ง
          <br />
          อย่าลืมรัน <code>supabase/schema.sql</code> ใน SQL Editor ด้วยนะ
        </p>
      </div>
    </main>
  )
}
