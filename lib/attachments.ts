/**
 * ไฟล์แนบเก็บใน Supabase Storage bucket 'attachments' (private)
 * path = {user_id}/{attachment_id} เพื่อให้ RLS policy เช็คเจ้าของจากโฟลเดอร์ชั้นแรกได้
 */
import { supabase } from './supabase'
import { type Attachment, newId } from './types'

const BUCKET = 'attachments'

export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB ต่อไฟล์

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** อัปโหลดไฟล์ขึ้น Storage แล้วคืน metadata ไว้ผูกกับนัดหมาย */
export async function uploadAttachment(file: File, userId: string): Promise<Attachment> {
  const id = newId()
  const storagePath = `${userId}/${id}`

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw error

  return { id, name: file.name, type: file.type, size: file.size, storagePath }
}

/** ลบไฟล์ออกจาก Storage (แถว metadata ลบแยกผ่าน lib/db.ts) */
export async function removeStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.error('ลบไฟล์แนบไม่สำเร็จ', error)
}

/** ลิงก์ชั่วคราวสำหรับดู/ดาวน์โหลดไฟล์ใน bucket แบบ private */
export async function getSignedUrl(storagePath: string, expiresInSec = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSec)
  if (error) {
    console.error('สร้างลิงก์ไฟล์ไม่สำเร็จ', error)
    return null
  }
  return data?.signedUrl ?? null
}

/** ดาวน์โหลดไฟล์แนบลงเครื่อง */
export async function downloadAttachment(att: Attachment): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).download(att.storagePath)
  if (error || !data) {
    alert('เปิดไฟล์ไม่สำเร็จ ไฟล์อาจถูกลบไปแล้ว')
    return
  }
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = att.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
