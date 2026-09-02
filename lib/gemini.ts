/**
 * เรียก Gemini ผ่าน REST ตรง ๆ ด้วย fetch — ไม่เพิ่ม dependency
 * ไฟล์นี้ทำงานฝั่งเซิร์ฟเวอร์เท่านั้น (ใช้ GEMINI_API_KEY ที่ไม่มี NEXT_PUBLIC_)
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * ชื่อโมเดลที่ Google ให้ใช้เปลี่ยนไปเรื่อย ๆ และแต่ละคีย์ก็ใช้ได้ไม่เหมือนกัน
 * ค่านี้เป็นแค่ตัวเริ่มต้น ถ้าเรียกแล้วไม่เจอ ระบบจะไปถามรายชื่อจริงจาก Google
 * แล้วเลือกให้เองด้วย pickBestModel()
 */
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export interface GeminiTurn {
  role: 'user' | 'model'
  text: string
}

export interface GeminiResult {
  ok: boolean
  reply?: string
  error?: string
  /** โมเดลที่ใช้จริง — ต่างจากค่าที่ตั้งไว้ได้ถ้าระบบเลือกให้ใหม่ */
  model?: string
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
    finishReason?: string
  }[]
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

interface ModelInfo {
  name?: string
  supportedGenerationMethods?: string[]
}

/** จำโมเดลที่หาเจอไว้ ไม่ต้องถาม Google ใหม่ทุกครั้งที่มีคนแชต */
let resolvedModel: string | null = null

/* ------------------------------------------------------------------ */
/*  หารายชื่อโมเดลที่คีย์นี้ใช้ได้จริง                                   */
/* ------------------------------------------------------------------ */

export async function listUsableModels(key: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': key },
    })
    if (!res.ok) return []
    const body = (await res.json()) as { models?: ModelInfo[] }
    return (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => (m.name ?? '').replace(/^models\//, ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * คัดเฉพาะโมเดลที่เอามาคุยแบบข้อความได้จริง
 * ต้องกรองซ้ำอีกชั้นจาก listUsableModels เพราะบางตัวประกาศว่ารองรับ generateContent
 * แต่จริง ๆ ใช้กับงานอื่น (สร้างรูป/เสียง) ถ้าไปแนะนำผู้ใช้จะพาไปตั้งค่าผิด
 */
export function usableForChat(names: string[]): string[] {
  return names.filter(
    (n) => !/embedding|aqa|vision|imagen|veo|tts|native-audio|image-generation/i.test(n)
  )
}

/**
 * เลือกโมเดลที่เหมาะกับงานแชต: เอา flash ก่อนเพราะเร็วและโควตาฟรีใจกว้างที่สุด
 * เลี่ยงตัวทดลอง ที่มักมีลิมิตต่ำ
 */
export function pickBestModel(names: string[]): string | null {
  const usable = usableForChat(names)
  if (usable.length === 0) return null

  const score = (n: string) => {
    let s = 0
    if (/flash/i.test(n)) s += 100
    if (/pro/i.test(n)) s += 40
    if (/lite/i.test(n)) s -= 10
    if (/exp|preview|thinking/i.test(n)) s -= 50 // ตัวทดลองมักมีลิมิตต่ำ
    const version = n.match(/(\d+)\.(\d+)/)
    if (version) s += Number(version[1]) * 10 + Number(version[2])
    if (/latest/i.test(n)) s += 5
    return s
  }

  return usable.slice().sort((a, b) => score(b) - score(a))[0]
}

/* ------------------------------------------------------------------ */
/*  ประกอบ request / อ่านคำตอบ                                          */
/* ------------------------------------------------------------------ */

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

/** แปลง error ของ Gemini เป็นข้อความไทยที่บอกวิธีแก้ */
export function describeAiError(
  status: number,
  body?: GeminiResponse,
  availableModels?: string[]
): string {
  const raw = body?.error?.message ?? ''

  if (status === 400 && /API key not valid/i.test(raw)) {
    return 'GEMINI_API_KEY ไม่ถูกต้อง — เช็คค่าใน .env.local อีกที'
  }
  if (status === 401 || status === 403) {
    return 'คีย์ Gemini ใช้ไม่ได้หรือยังไม่ได้เปิดสิทธิ์ — เช็ค GEMINI_API_KEY ใน .env.local'
  }
  if (status === 404) {
    // บอกชื่อที่ใช้ได้จริงไปเลย ดีกว่าให้ผู้ใช้ไปเปิด URL หาเอง
    // แต่ต้องแนะนำเฉพาะตัวที่คุยแบบข้อความได้ ไม่งั้นจะพาไปตั้งค่าโมเดลที่ใช้แชตไม่ได้
    const chat = usableForChat(availableModels ?? [])
    if (chat.length > 0) {
      return `ไม่พบโมเดลที่ตั้งไว้ — คีย์นี้ใช้ได้: ${chat.slice(0, 6).join(', ')} (ตั้งค่า GEMINI_MODEL ใน .env.local เป็นชื่อใดชื่อหนึ่ง)`
    }
    if (availableModels && availableModels.length > 0) {
      return 'คีย์นี้ไม่มีโมเดลที่ใช้คุยแบบข้อความได้เลย — ลองสร้างคีย์ใหม่ที่ Google AI Studio'
    }
    return 'ไม่พบโมเดลที่ตั้งไว้ และหารายชื่อโมเดลที่ใช้ได้ไม่สำเร็จ — เช็คว่า GEMINI_API_KEY ถูกต้องไหม'
  }
  if (status === 429) {
    return 'ใช้เกินโควตาฟรีของ Gemini แล้ว รอสักครู่แล้วลองใหม่นะ ⏳'
  }
  if (status >= 500) {
    return 'ฝั่ง Google ขัดข้องชั่วคราว ลองใหม่อีกครั้งนะ'
  }
  return raw ? `Gemini ตอบกลับผิดพลาด: ${raw}` : `Gemini ตอบกลับผิดพลาด (HTTP ${status})`
}

/* ------------------------------------------------------------------ */
/*  เรียกจริง                                                          */
/* ------------------------------------------------------------------ */

async function callModel(
  key: string,
  model: string,
  systemInstruction: string,
  turns: GeminiTurn[]
): Promise<{ status: number; body: GeminiResponse } | null> {
  try {
    const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildRequestBody(systemInstruction, turns)),
    })
    let body: GeminiResponse = {}
    try {
      body = (await res.json()) as GeminiResponse
    } catch {
      /* บาง error ไม่ใช่ JSON — ปล่อยว่างไว้ให้ describeAiError จัดการ */
    }
    return { status: res.status, body }
  } catch (err) {
    console.error('เรียก Gemini ไม่สำเร็จ', err)
    return null
  }
}

/** แปลงคำตอบที่ได้เป็นผลลัพธ์สุดท้าย (จัดการเคส safety filter / คำตอบว่าง) */
function toResult(status: number, body: GeminiResponse, model: string): GeminiResult {
  const reply = extractReply(body)
  if (reply) return { ok: true, reply, model }

  const blocked = body.promptFeedback?.blockReason ?? body.candidates?.[0]?.finishReason
  if (blocked === 'SAFETY' || body.promptFeedback?.blockReason) {
    return { ok: false, error: 'คำถามนี้ถูกระบบกรองเนื้อหาของ Gemini บล็อกไว้ ลองถามใหม่อีกแบบนะ', model }
  }
  if (blocked === 'MAX_TOKENS') {
    return { ok: false, error: 'คำตอบยาวเกินไป ลองถามให้แคบลงหน่อยนะ', model }
  }
  return { ok: false, error: `Gemini ไม่ได้ส่งคำตอบกลับมา (HTTP ${status}) ลองใหม่อีกครั้งนะ`, model }
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

  const configured = process.env.GEMINI_MODEL?.trim()
  const model = configured || resolvedModel || DEFAULT_MODEL

  const first = await callModel(key, model, systemInstruction, turns)
  if (!first) return { ok: false, error: 'ต่อกับ Gemini ไม่ได้ เช็คอินเทอร์เน็ตแล้วลองใหม่นะ' }

  if (first.status !== 404) {
    if (first.status >= 400) {
      return { ok: false, error: describeAiError(first.status, first.body), model }
    }
    resolvedModel = model // ใช้ได้จริง จำไว้
    return toResult(first.status, first.body, model)
  }

  /* --- 404: ชื่อโมเดลใช้ไม่ได้กับคีย์นี้ ไปถามรายชื่อจริงจาก Google --- */
  const available = await listUsableModels(key)
  const best = pickBestModel(available)

  if (!best || best === model) {
    return { ok: false, error: describeAiError(404, first.body, available), model }
  }

  const second = await callModel(key, best, systemInstruction, turns)
  if (!second) return { ok: false, error: 'ต่อกับ Gemini ไม่ได้ เช็คอินเทอร์เน็ตแล้วลองใหม่นะ' }

  if (second.status >= 400) {
    return { ok: false, error: describeAiError(second.status, second.body, available), model: best }
  }

  console.log(`Gemini: "${model}" ใช้ไม่ได้ เปลี่ยนไปใช้ "${best}" แทน`)
  resolvedModel = best
  return toResult(second.status, second.body, best)
}

/** ใช้ใน GET /api/chat เพื่อดูว่าคีย์นี้ใช้โมเดลอะไรได้บ้าง */
export async function diagnose(): Promise<{
  hasKey: boolean
  configured: string | null
  resolved: string | null
  available: string[]
  suggestion: string | null
}> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return { hasKey: false, configured: null, resolved: null, available: [], suggestion: null }
  }
  const available = await listUsableModels(key)
  return {
    hasKey: true,
    configured: process.env.GEMINI_MODEL?.trim() || null,
    resolved: resolvedModel,
    available,
    suggestion: pickBestModel(available),
  }
}
