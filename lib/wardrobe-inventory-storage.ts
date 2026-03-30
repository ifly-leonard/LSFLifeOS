import { DUMMY_WARDROBE, type WardrobeItem } from "@/lib/wardrobe-data"

/** First load: persist a copy of the demo wardrobe so the user can edit and add without mutating the module constant. */
export const WARDROBE_INVENTORY_KEY = "lifeos_wardrobe_inventory_v1"

export function getServerSafeInventorySeed(): WardrobeItem[] {
  return DUMMY_WARDROBE.map((i) => ({ ...i }))
}

function seedFromDummy(): WardrobeItem[] {
  return getServerSafeInventorySeed()
}

export function loadWardrobeInventory(): WardrobeItem[] {
  if (typeof window === "undefined") return getServerSafeInventorySeed()
  const raw = localStorage.getItem(WARDROBE_INVENTORY_KEY)
  if (!raw) {
    const seed = seedFromDummy()
    try {
      localStorage.setItem(WARDROBE_INVENTORY_KEY, JSON.stringify(seed))
    } catch {
      /* ignore quota */
    }
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as WardrobeItem[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    /* fall through */
  }
  const seed = seedFromDummy()
  try {
    localStorage.setItem(WARDROBE_INVENTORY_KEY, JSON.stringify(seed))
  } catch {
    /* ignore */
  }
  return seed
}

export function saveWardrobeInventory(items: WardrobeItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WARDROBE_INVENTORY_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}
