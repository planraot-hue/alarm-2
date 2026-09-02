import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { APP_KNOWLEDGE } from '@/lib/aiKnowledge'
import { type GeminiTurn, askGemini } from '@/lib/gemini'
import { CHAT_HISTORY_LIMIT, MAX_CHAT_CHARS } from '@/lib/types'

/**
 * Route Handler ของแชตบอต
 *
 * ทำไมต้องมีไฟล์นี้แทนที่จะเรียก Gemini จากเบราว์เซอร์ตรง ๆ:
 * GEMINI_API_KEY เป็นความลับจริง (ต่างจาก Supabase anon key ที่มี RLS คุมอยู่)
 * ถ้าวางไว้ฝั่ง client ใครเปิด DevTools ก็เอาไปยิงจนโควตาหมดได้
 */

export const runtime = 'nodejs'

interface ChatRequest {
  message?: unknown
  history?: unknown
  context?: unknown
}

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: Request) {
  /* ---------- 1. ต้องล็อกอินก่อน ---------- */
  // ไม่เช็คตรงนี้ = เปิด endpoint ให้คนทั้งอินเทอร์เน็ตใช้คีย์ Gemini ของเราฟรี
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return bad(401, 'ต้องเข้าสู่ระบบก่อนถึงจะคุยกับผู้ช่วยได้')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return bad(500, 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase')

  const supabase = createClient(url, anonKey)
  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !userData?.user) return bad(401, 'เซสชันหมดอายุ ลองเข้าสู่ระบบใหม่นะ')

  /* ---------- 2. ตรวจข้อมูลที่ส่งมา ---------- */
  let payload: ChatRequest
  try {
    payload = (await req.json()) as ChatRequest
  } catch {
    return bad(400, 'รูปแบบข้อมูลไม่ถูกต้อง')
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  if (!message) return bad(400, 'ยังไม่ได้พิมพ์คำถามเลยนะ')
  if (message.length > MAX_CHAT_CHARS) {
    return bad(400, `ข้อความยาวเกิน ${MAX_CHAT_CHARS} ตัวอักษร ลองพิมพ์ให้สั้นลงหน่อยนะ`)
  }

  const context = typeof payload.context === 'string' ? payload.context : ''

  // ตัดประวัติเหลือเท่าที่จำเป็น กัน prompt บวมจนเปลืองโควตา
  const rawHistory = Array.isArray(payload.history) ? payload.history : []
  const history: GeminiTurn[] = rawHistory
    .filter(
      (t): t is GeminiTurn =>
        !!t &&
        typeof t === 'object' &&
        ((t as GeminiTurn).role === 'user' || (t as GeminiTurn).role === 'model') &&
        typeof (t as GeminiTurn).text === 'string' &&
        (t as GeminiTurn).text.trim().length > 0
    )
    .slice(-CHAT_HISTORY_LIMIT)

  /* ---------- 3. ถาม Gemini ---------- */
  const systemInstruction = context
    ? `${APP_KNOWLEDGE}\n\n# ข้อมูลของผู้ใช้คนนี้\n${context}`
    : APP_KNOWLEDGE

  const result = await askGemini(systemInstruction, [...history, { role: 'user', text: message }])

  if (!result.ok) return bad(502, result.error ?? 'ถาม Gemini ไม่สำเร็จ')
  return NextResponse.json({ reply: result.reply })
}
