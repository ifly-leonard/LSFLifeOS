import type { WardrobeItem } from "@/lib/wardrobe-data"

export const WARDROBE_PLAN_STORAGE_KEY = "lifeos_wardrobe_plan"

export type StoredDayPlan = {
  id: string
  day: string
  date: string
  fullDate: string
  goingOut: boolean
  eventType: string
  outfit: WardrobeItem[] | null
}

function startOfLocalDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

export function parseWardrobePlan(raw: string | null): StoredDayPlan[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed as StoredDayPlan[]
  } catch {
    return null
  }
}

export function loadWardrobePlanFromStorage(): StoredDayPlan[] | null {
  if (typeof window === "undefined") return null
  return parseWardrobePlan(localStorage.getItem(WARDROBE_PLAN_STORAGE_KEY))
}

export function getPlannedOutfitForDate(
  plan: StoredDayPlan[] | null,
  when: Date,
): { entry: StoredDayPlan; outfit: WardrobeItem[] } | null {
  if (!plan?.length) return null
  const target = startOfLocalDay(when)
  for (const p of plan) {
    if (!p.goingOut || !p.outfit?.length) continue
    const fd = new Date(p.fullDate)
    if (Number.isNaN(fd.getTime())) continue
    if (startOfLocalDay(fd) !== target) continue
    return { entry: p, outfit: p.outfit }
  }
  return null
}

export function hydrateOutfitFromWardrobe(
  outfit: WardrobeItem[],
  wardrobe: WardrobeItem[],
): WardrobeItem[] {
  const byId = new Map(wardrobe.map((i) => [i.id, i]))
  return outfit.map((i) => byId.get(i.id) ?? i)
}
