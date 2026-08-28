import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** ยังไม่ได้ตั้งค่า env — ใช้แสดงข้อความบอกวิธีตั้งค่าแทนหน้าจอขาว */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Supabase client ฝั่งเบราว์เซอร์
 * anon key ถูกออกแบบมาให้เปิดเผยฝั่ง client ได้ ความปลอดภัยจริงมาจาก RLS ในฐานข้อมูล
 */
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
