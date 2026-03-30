import type {
  WardrobeItem as AppWardrobeItem,
  Category,
  Formality as AppFormality,
  Status as AppStatus,
  Pattern as AppPattern,
} from "@/lib/wardrobe-data";
import { COLOR_HEX } from "@/lib/color-engine";
import { evaluateOutfitRecommendation, recommendOutfits } from "./recommend";
import type {
  EventType,
  FormalityLevel,
  ItemCategory,
  ItemPattern,
  OutfitRecommendation,
  RecommendationInput,
  WardrobeItem,
} from "./types";

function mapCategory(c: Category): ItemCategory | null {
  switch (c) {
    case "tops":
      return "top";
    case "bottoms":
      return "bottom";
    case "footwear":
      return "footwear";
    case "layers":
      return "layer";
    default:
      return null;
  }
}

function mapFormality(f: AppFormality): FormalityLevel {
  switch (f) {
    case "casual":
      return "casual";
    case "smart_casual":
      return "smart_casual";
    case "formal":
      return "formal";
    default:
      return "casual";
  }
}

function mapStatus(s: AppStatus): WardrobeItem["status"] {
  switch (s) {
    case "ready":
      return "ready";
    case "clean":
      return "clean";
    case "dirty":
      return "dirty";
    case "ironing":
      return "ironing";
    default:
      return "clean";
  }
}

function mapPattern(p: AppPattern): ItemPattern {
  return p as ItemPattern;
}

export function appItemToEngineItem(item: AppWardrobeItem): WardrobeItem | null {
  const category = mapCategory(item.category);
  if (!category) return null;
  const hex =
    COLOR_HEX[item.primary_color.toLowerCase()] ??
    COLOR_HEX[item.primary_color] ??
    "#888888";
  return {
    id: item.id,
    title: item.title,
    category,
    colorHex: hex,
    colorName: String(item.primary_color),
    pattern: mapPattern(item.pattern),
    formality: mapFormality(item.formality),
    status: mapStatus(item.status),
  };
}

export function appWardrobeToEngineItems(items: AppWardrobeItem[]): WardrobeItem[] {
  return items.map(appItemToEngineItem).filter(Boolean) as WardrobeItem[];
}

export function recommendOutfitsForApp(
  skinToneHex: string,
  wardrobe: AppWardrobeItem[],
  ctx: { eventType?: EventType; formality?: FormalityLevel },
  limit?: number,
): OutfitRecommendation[] {
  const engineItems = appWardrobeToEngineItems(wardrobe);
  const input: RecommendationInput = {
    skinToneHex,
    items: engineItems,
    ...ctx,
  };
  return recommendOutfits(input, { limit });
}

export function appOutfitFromRecommendation(
  rec: OutfitRecommendation,
  wardrobe: AppWardrobeItem[],
): AppWardrobeItem[] {
  const byId = new Map(wardrobe.map((i) => [i.id, i]));
  const list: AppWardrobeItem[] = [
    byId.get(rec.items.top.id),
    byId.get(rec.items.bottom.id),
    byId.get(rec.items.footwear.id),
    rec.items.layer ? byId.get(rec.items.layer.id) : undefined,
  ].filter(Boolean) as AppWardrobeItem[];
  return list;
}

export function displayPaletteHexesForAppOutfit(items: AppWardrobeItem[]): string[] {
  return items.map(
    (i) =>
      COLOR_HEX[i.primary_color.toLowerCase()] ??
      COLOR_HEX[i.primary_color] ??
      "#888888",
  );
}

/**
 * Deterministic swap: best candidate that keeps a valid engine outfit, or null.
 */
export function bestSwapForAppOutfit(
  skinToneHex: string,
  fullWardrobe: AppWardrobeItem[],
  currentOutfit: AppWardrobeItem[],
  itemToSwap: AppWardrobeItem,
  candidates: AppWardrobeItem[],
  ctx: { eventType?: EventType; formality?: FormalityLevel },
): AppWardrobeItem | null {
  let best: { item: AppWardrobeItem; score: number } | null = null;
  for (const cand of candidates) {
    const next = currentOutfit.map((i) =>
      i.id === itemToSwap.id ? cand : i,
    );
    const engineFlat = appWardrobeToEngineItems(next);
    if (engineFlat.length !== next.length) continue;
    const rec = evaluateOutfitRecommendation(
      skinToneHex,
      engineFlat,
      ctx.eventType,
      ctx.formality,
    );
    if (!rec) continue;
    if (!best || rec.score > best.score) best = { item: cand, score: rec.score };
  }
  return best?.item ?? null;
}

/** Map planner internal event keys to engine `eventType` + optional formality hint. */
export function plannerEventToEngineContext(eventKey: string): {
  eventType: EventType;
  formality?: FormalityLevel;
} {
  const map: Record<string, { eventType: EventType; formality?: FormalityLevel }> =
    {
      deep_work: { eventType: "casual" },
      office_day: { eventType: "work" },
      investor_pitch: { eventType: "meeting", formality: "formal" },
      media_appearance: { eventType: "meeting" },
      networking: { eventType: "dinner" },
      travel: { eventType: "travel" },
      gala_dinner: { eventType: "dinner", formality: "formal" },
    };
  return map[eventKey] ?? { eventType: "casual" };
}
