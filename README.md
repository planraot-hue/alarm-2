# 🗓️ My Planner — เว็บแจ้งเตือนนัดสำคัญ

เว็บจัดการนัดหมายส่วนตัว ธีมพาสเทลฟอนต์ลายมือ ทำงานจบในหน้าเดียว
ข้อมูลเก็บบน **Supabase** เข้าใช้ได้จากทุกเครื่อง
สร้างตามข้อกำหนดใน [`alarm2.txt`](alarm2.txt)

## ฟีเจอร์

| ฟีเจอร์ | ทำอะไรได้ |
|---|---|
| 📅 ปฏิทิน | เป็นหน้าแรก แสดงจุดสีตามประเภทกิจกรรมในแต่ละวัน กดวันไหนก็ดูสรุปของวันนั้น |
| ✏️ นัดหมาย | ชื่อเรื่อง, วันเริ่ม–สิ้นสุด (เลือกหลายวันได้), เวลาเริ่ม–สิ้นสุด, ตัวเลือกทั้งวัน, สถานที่, โน้ต |
| 🎨 ไอคอนตามประเภท | ประชุม 🤝 / หมอ 🩺 / เรียน 📚 / เดินทาง ✈️ / งานเลี้ยง 🎉 / งาน 💼 / อื่น ๆ 📌 |
| 🔔 แจ้งเตือน | **ป็อบอัปเด้งกลางจอ** ล่วงหน้า **3 วัน · 1 วัน · 1 ชั่วโมง** ก่อนถึงนัด (เลือกเปิด/ปิดรายนัดได้) |
| 🗺️ แผนที่ | ปุ่มเปิด Google Maps จากชื่อสถานที่ที่กรอกไว้ |
| 📎 ไฟล์แนบ | อัปโหลดเอกสารและรูปภาพขึ้น Supabase Storage พร้อมพรีวิวรูปย่อ (สูงสุด 10MB ต่อไฟล์) |
| 📌 สรุปรายวัน | รวมนัดทั้งหมดของวันที่เลือก เรียงตามเวลา พร้อมนับจำนวน |
| 🎫 จองตั๋วเดินทาง | ลิงก์จองตั๋ว **เครื่องบิน · รถไฟ · รถทัวร์** แยกเป็นหมวด |
| 🔑 ล็อกอิน | Supabase Auth แบบอีเมล + รหัสผ่าน |
| 💗 Mood Tracker | บันทึกอารมณ์รายวันด้วยอีโมจิ 7 แบบ โผล่บนปฏิทินและมุมมองสัปดาห์ |
| ✅ Habit Tracker | สร้างนิสัยเอง ติ๊กวงกลมให้ระบายสีเมื่อทำสำเร็จ พร้อมตัวนับ |
| 📌 Sticky Notes | กระดานโพสต์อิทสีพาสเทล เขียน/เปลี่ยนสี/ลบได้ |
| 🔀 สลับมุมมอง | รายวัน · รายสัปดาห์ · รายเดือน |
| 💬 แชตบอต AI | ผู้ช่วย "น้องแพลน" ขับด้วย Gemini รู้ทั้งวิธีใช้เว็บและตารางนัดของคุณ |
| 💾 สำรองข้อมูล | Export / Import JSON |

---

## ติดตั้ง

ต้องมี [Node.js](https://nodejs.org) 20 ขึ้นไป

### 1. ติดตั้ง dependency

```bash
npm install
```

### 2. ตั้งค่าฐานข้อมูลบน Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. เปิด **SQL Editor → New query** วางเนื้อหาไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ทั้งไฟล์แล้วกด **Run**
   สคริปต์นี้จะสร้างให้ครบ: ตาราง `events` `attachments` `moods` `habits` `habit_logs` `notes` `chat_messages`, GRANT, RLS policy, และ Storage bucket `attachments`

### 3. สร้างบัญชีผู้ใช้

เว็บนี้**ไม่มีหน้าสมัครสมาชิก** — สร้างบัญชีจากฝั่ง Supabase:

**Authentication → Users → Add user** ใส่อีเมลกับรหัสผ่าน
แนะนำให้ติ๊ก **Auto Confirm User** ไม่งั้นจะเข้าไม่ได้จนกว่าจะยืนยันอีเมล

### 4. ใส่ค่า environment variable

คัดลอก [`.env.local.example`](.env.local.example) เป็น `.env.local` แล้วเติมค่าจริง
(หาได้ที่ **Project Settings → API**)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. ใส่คีย์ Gemini (สำหรับแชตบอต)

ขอคีย์ฟรีที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วใส่ใน `.env.local`

```
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash    # ไม่ใส่ก็ได้
```

> ⚠️ **ห้ามตั้งชื่อเป็น `NEXT_PUBLIC_GEMINI_API_KEY` เด็ดขาด**
> คีย์นี้เป็นความลับจริง ไม่เหมือน anon key ของ Supabase ที่มี RLS คุมอยู่
> ถ้ามี `NEXT_PUBLIC_` นำหน้า Next.js จะฝังลง bundle ให้ใครก็หยิบไปใช้จนโควตาหมดได้
> ในโปรเจกต์นี้คีย์ถูกใช้เฉพาะใน [`app/api/chat/route.ts`](app/api/chat/route.ts) ฝั่งเซิร์ฟเวอร์เท่านั้น

ถ้าไม่ใส่คีย์ ส่วนอื่นของเว็บยังใช้ได้ปกติ แค่แชตจะขึ้นข้อความบอกให้ไปตั้งค่า

### 6. รัน

```bash
npm run dev      # เปิด http://localhost:3000
```

ถ้ายังไม่ได้ตั้งค่า env เว็บจะขึ้นหน้าบอกวิธีตั้งค่าให้แทนหน้าจอเปล่า

---

## Deploy ขึ้น Vercel

1. push โปรเจกต์นี้ขึ้น GitHub
2. เข้า [vercel.com](https://vercel.com) → **Add New → Project** → เลือก repo นี้
3. ใน **Environment Variables** ใส่ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` และ `GEMINI_API_KEY`
4. กด Deploy

หมายเหตุ: การมี `app/api/chat` ทำให้เว็บไม่ได้เป็น static ล้วนอีกต่อไป Vercel จะสร้าง serverless function ให้ (ยังอยู่ในโควตาฟรี)

## โครงสร้างโปรเจกต์

```
app/
  layout.tsx        ฟอนต์ Mali + Itim (subset ภาษาไทย), metadata
  page.tsx          หน้าเดียวจบ — session, ปฏิทิน, สรุปรายวัน, ฟอร์ม
  globals.css       ธีมพาสเทล (Tailwind CSS v4)
components/
  AuthGate.tsx      ฟอร์มล็อกอินด้วย Supabase Auth
  ConfigNotice.tsx  หน้าบอกวิธีตั้งค่าเมื่อยังไม่มี env
  CalendarMonth.tsx ปฏิทินรายเดือน (พ.ศ.)
  DaySummary.tsx    สรุปนัดหมายของวันที่เลือก
  EventCard.tsx     การ์ดนัด + ปุ่มแผนที่/ไฟล์แนบ/แก้ไข/ลบ
  EventForm.tsx     ฟอร์มเพิ่ม–แก้ไขนัดหมาย
  AttachmentPicker.tsx  อัปโหลด/พรีวิว/ลบไฟล์แนบ
  ReminderHost.tsx  ตัวจับเวลาแจ้งเตือน + ป็อบอัปในหน้า
  MoodPicker.tsx    เลือกอารมณ์ประจำวัน
  HabitTracker.tsx  นิสัยประจำวัน + วงกลมติ๊ก
  StickyBoard.tsx   กระดานโพสต์อิท
  ViewSwitcher.tsx  ปุ่มสลับ รายวัน/สัปดาห์/เดือน
  WeekView.tsx      มุมมองรายสัปดาห์ 7 คอลัมน์
  BookingLinks.tsx  ลิงก์จองตั๋ว เครื่องบิน/รถไฟ/รถทัวร์
  ChatBot.tsx       ปุ่มลอย + หน้าต่างแชตกับผู้ช่วย AI
  BackupBar.tsx     Export / Import JSON
app/api/chat/
  route.ts        Route Handler ถือ GEMINI_API_KEY ไว้ฝั่งเซิร์ฟเวอร์
lib/
  supabase.ts     Supabase client ฝั่งเบราว์เซอร์
  db.ts           อ่าน/เขียนนัดหมายและไฟล์แนบบน Supabase
  attachments.ts  อัปโหลด/ดาวน์โหลดไฟล์ผ่าน Supabase Storage
  storage.ts      localStorage เฉพาะสถานะแจ้งเตือนของเครื่องนี้
  types.ts        โครงสร้างข้อมูลนัดหมาย
  categories.ts   ประเภทกิจกรรม + ไอคอน + สีพาสเทล
  dates.ts        คำนวณปฏิทิน, ช่วงวันหลายวัน, ฟอร์แมตวันที่ไทย
  reminders.ts    คำนวณว่าถึงเวลาต้องเตือนหรือยัง
  gemini.ts       เรียก Gemini API + แปลง error เป็นภาษาไทย
  aiKnowledge.ts  ความรู้เรื่องเว็บที่ส่งให้ AI เป็น system instruction
  aiContext.ts    สรุปข้อมูลผู้ใช้ส่งให้ AI (จำกัดขนาดไว้)
public/
  flowers.svg     ลายดอกไม้พื้นหลัง (tile ต่อกันได้ไม่มีรอยต่อ)
supabase/
  schema.sql      7 ตาราง + RLS + Storage bucket
```

## ความปลอดภัย

- **anon key เปิดเผยได้** — ถูกออกแบบมาให้อยู่ฝั่งเบราว์เซอร์ ความปลอดภัยจริงมาจาก **Row Level Security**
  ทุกตารางเปิด RLS และทุก policy บังคับ `auth.uid() = user_id` แต่ละบัญชีจึงเห็นเฉพาะนัดหมายของตัวเอง
- **ห้ามเอา `service_role` key มาใส่ในโปรเจกต์นี้** — คีย์นั้นข้าม RLS ได้ทั้งหมด ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
- ไฟล์แนบอยู่ใน bucket แบบ **private** เปิดดูผ่าน signed URL อายุ 1 ชั่วโมง และ storage policy เช็คว่าโฟลเดอร์ชั้นแรกตรงกับ uid ของคนที่ล็อกอิน

## ข้อจำกัดที่ควรรู้

- **แจ้งเตือนทำงานเมื่อเปิดเว็บค้างไว้** — ปิดแท็บแล้วจะไม่มีแจ้งเตือน
  (การแจ้งเตือนแบบปิดเว็บแล้วยังเด้ง ต้องมี Service Worker + push server เพิ่ม)
  ครั้งแรกต้องกดปุ่ม **🔔 เปิดการแจ้งเตือนบนเครื่อง** เพื่ออนุญาต ถ้าไม่อนุญาตก็ยังมีป็อบอัปเตือนในหน้าเว็บให้
- **ป็อบอัปเด้งทีละรายการ** ถ้าถึงเวลาพร้อมกันหลายนัด จะเข้าคิวรอ กดรับทราบแล้วอันถัดไปจึงขึ้น
- **สถานะ "เตือนไปแล้ว" เก็บแยกรายเครื่อง** โดยตั้งใจ ถ้าเก็บรวมบนเซิร์ฟเวอร์ เปิดเว็บอีกเครื่องจะไม่ได้รับเตือนเลย
- **Import JSON จะไม่พาไฟล์แนบมาด้วย** เพราะตัวไฟล์อยู่ใน Storage ของบัญชีเดิม ระบบจะนำเข้าเฉพาะตัวนัดหมาย
- **แชตบอตส่งข้อมูลของคุณไปที่ Google** — เพื่อตอบเรื่องตารางนัดได้ ระบบจะสรุปนัดหมาย อารมณ์ นิสัย และโน้ต ส่งไปกับคำถามทุกครั้ง
  ถ้าไม่ต้องการก็ไม่ต้องใส่ `GEMINI_API_KEY` แชตจะปิดไปเอง
- **แชตบอตอ่านข้อมูลได้อย่างเดียว** สร้าง แก้ หรือลบนัดหมายให้ไม่ได้ ตั้งใจออกแบบไว้แบบนี้เพื่อกันกรณี AI เข้าใจผิดแล้วไปแก้ข้อมูลจริง
- **โควตาฟรีของ Gemini มีจำกัดต่อนาที** ถ้าถามรัว ๆ อาจเจอข้อความให้รอสักครู่

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + Storage) · Google Gemini
ฟอนต์ Mali + Itim จาก Google Fonts (subset ภาษาไทย)
