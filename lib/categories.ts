import type { CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
  icon: string
  /** สีพาสเทลสำหรับพื้นหลังการ์ด/จุดบนปฏิทิน */
  color: string
  /** สีเข้มกว่าเล็กน้อยสำหรับขอบ/ตัวอักษร */
  accent: string
}

export const CATEGORIES: Category[] = [
  { id: 'meeting', label: 'ประชุม/นัดพบ', icon: '🤝', color: '#BEE3F8', accent: '#3E7CA6' },
  { id: 'health', label: 'หมอ/สุขภาพ', icon: '🩺', color: '#FFC2D1', accent: '#C25A7C' },
  { id: 'study', label: 'เรียน/สอบ', icon: '📚', color: '#E2D6FF', accent: '#6D55B0' },
  { id: 'travel', label: 'เดินทาง/ทริป', icon: '✈️', color: '#C6F1D6', accent: '#3E8C63' },
  { id: 'party', label: 'งานเลี้ยง/วันเกิด', icon: '🎉', color: '#FFE8A3', accent: '#B08A20' },
  { id: 'work', label: 'งาน/เดดไลน์', icon: '💼', color: '#FFD8BE', accent: '#B36C3C' },
  { id: 'other', label: 'อื่น ๆ', icon: '📌', color: '#DCE5E4', accent: '#5C706E' },
]

const FALLBACK = CATEGORIES[CATEGORIES.length - 1]

export function getCategory(id: CategoryId | string | undefined): Category {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK
}
