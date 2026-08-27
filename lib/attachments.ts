/**
 * เก็บไฟล์แนบเป็น Blob ใน IndexedDB
 * (localStorage เก็บได้แค่ string และมีเพดานราว 5MB จึงไม่เหมาะกับไฟล์)
 */

const DB_NAME = 'alarm2'
const DB_VERSION = 1
const STORE = 'attachments'

export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB ต่อไฟล์

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('เบราว์เซอร์นี้ไม่รองรับ IndexedDB'))
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const req = run(transaction.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

export function putFile(id: string, file: Blob): Promise<void> {
  return tx('readwrite', (store) => store.put(file, id)).then(() => undefined)
}

export function getFile(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>('readonly', (store) => store.get(id) as IDBRequest<Blob | undefined>)
}

export function deleteFile(id: string): Promise<void> {
  return tx('readwrite', (store) => store.delete(id)).then(() => undefined)
}

export function deleteFiles(ids: string[]): Promise<void> {
  return Promise.all(ids.map((id) => deleteFile(id).catch(() => undefined))).then(() => undefined)
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** เปิด/ดาวน์โหลดไฟล์แนบจาก IndexedDB */
export async function downloadAttachment(id: string, name: string): Promise<void> {
  const blob = await getFile(id)
  if (!blob) {
    alert('ไม่พบไฟล์นี้แล้ว (อาจถูกล้างข้อมูลเบราว์เซอร์ไป)')
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
