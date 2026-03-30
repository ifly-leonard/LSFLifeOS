import type { Category } from "@/lib/wardrobe-data"

export const WARDROBE_LOOKBOOK_STORAGE_KEY = "lifeos_wardrobe_lookbook"

/** Editorial naming: STYLE · DESCRIPTOR_SLUG · YYMMDD */
export const LOOKBOOK_NAME_PREFIX = "STYLE"

export function formatLookbookStyleName(descriptor: string, d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const yy = String(d.getFullYear()).slice(-2)
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const slug = descriptor
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .toUpperCase()
  const core = slug || "UNNAMED"
  return `${LOOKBOOK_NAME_PREFIX} · ${core} · ${yy}${mm}${dd}`
}

export type LookbookSlots = Partial<Record<Category, string>>

export type SavedLookbookStyle = {
  id: string
  name: string
  createdAt: string
  slots: LookbookSlots
}

export function loadLookbookStyles(): SavedLookbookStyle[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(WARDROBE_LOOKBOOK_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as SavedLookbookStyle[]
  } catch {
    return []
  }
}

export function saveLookbookStyles(styles: SavedLookbookStyle[]): void {
  localStorage.setItem(WARDROBE_LOOKBOOK_STORAGE_KEY, JSON.stringify(styles))
}
