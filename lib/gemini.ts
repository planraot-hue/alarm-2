/**
 * เรียก Gemini ผ่าน REST ตรง ๆ ด้วย fetch — ไม่เพิ่ม dependency
 * ไฟล์นี้ทำงานฝั่งเซิร์ฟเวอร์เท่านั้น (ใช้ GEMINI_API_KEY ที่ไม่มี NEXT_PUBLIC_)
 */

/** ชื่อโมเดลของ Google เปลี่ยนบ่อย จึงตั้งผ่าน env ได้โดยไม่ต้องแก้โค้ด */
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export interface GeminiTurn {
  role: 'user' | 'model'
  text: string
}

export interface GeminiResult {
  ok: boolean
  reply?: string
  error?: string
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

/** แปลง error ของ Gemini เป็นข้อความไทยที่บอกวิธีแก้ */
export function describeAiError(status: number, body?: GeminiResponse): string {
  const raw = body?.error?.message ?? ''
  if (status === 400 && /API key not valid/i.test(raw)) {
    return 'GEMINI_API_KEY ไม่ถูกต้อง — เช็คค่าใน .env.local อีกที'
  }
  if (status === 401 || status === 403) {
    return 'คีย์ Gemini ใช้ไม่ได้หรือยังไม่ได้เปิดสิทธิ์ — เช็ค GEMINI_API_KEY ใน .env.local'
  }
  if (status === 404) {
    return `ไม่พบโมเดลนี้ — ลองเปลี่ยนค่า GEMINI_MODEL (ดูรายชื่อที่ใช้ได้จาก https://generativelanguage.googleapis.com/v1beta/models?key=คีย์ของคุณ)`
  }
  if (status === 429) {
    return 'ใช้เกินโควตาฟรีของ Gemini แล้ว รอสักครู่แล้วลองใหม่นะ ⏳'
  }
  if (status >= 500) {
    return 'ฝั่ง Google ขัดข้องชั่วคราว ลองใหม่อีกครั้งนะ'
  }
  return raw ? `Gemini ตอบกลับผิดพลาด: ${raw}` : `Gemini ตอบกลับผิดพลาด (HTTP ${status})`
}

/** ประกอบ body ของ request — แยกออกมาเพื่อทดสอบได้โดยไม่ต้องยิงเน็ตจริง */
export function buildRequestBody(systemInstruction: string, turns: GeminiTurn[]) {
  return {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  }
}

/** ดึงข้อความจากคำตอบ — คืน null ถ้าไม่มีข้อความให้อ่าน */
export function extractReply(body: GeminiResponse): string | null {
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  return text.trim() ? text.trim() : null
}

export async function askGemini(
  systemInstruction: string,
  turns: GeminiTurn[]
): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return {
      ok: false,
      error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY — ใส่ในไฟล์ .env.local แล้วรัน npm run dev ใหม่',
    }
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildRequestBody(systemInstruction, turns)),
    })
  } catch (err) {
    console.error('เรียก Gemini ไม่สำเร็จ', err)
    return { ok: false, error: 'ต่อกับ Gemini ไม่ได้ เช็คอินเทอร์เน็ตแล้วลองใหม่นะ' }
  }

  let body: GeminiResponse = {}
  try {
    body = (await res.json()) as GeminiResponse
  } catch {
    /* บางกรณี error จะไม่ใช่ JSON — ปล่อยให้ตกไปที่ describeAiError ด้านล่าง */
  }

  if (!res.ok) return { ok: false, error: describeAiError(res.status, body) }

  // คำตอบอาจถูก safety filter บล็อก ตอนนั้น candidates จะว่าง ต้องดักไม่ให้เป็น undefined หลุดไปหน้าเว็บ
  const reply = extractReply(body)
  if (!reply) {
    const blocked = body.promptFeedback?.blockReason ?? body.candidates?.[0]?.finishReason
    if (blocked === 'SAFETY' || body.promptFeedback?.blockReason) {
      return { ok: false, error: 'คำถามนี้ถูกระบบกรองเนื้อหาของ Gemini บล็อกไว้ ลองถามใหม่อีกแบบนะ' }
    }
    if (blocked === 'MAX_TOKENS') {
      return { ok: false, error: 'คำตอบยาวเกินไป ลองถามให้แคบลงหน่อยนะ' }
    }
    return { ok: false, error: 'Gemini ไม่ได้ส่งคำตอบกลับมา ลองใหม่อีกครั้งนะ' }
  }

  return { ok: true, reply }
}
