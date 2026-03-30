import { passesHardRules } from "./hard-rules";
import { normalizeItems } from "./normalize";
import { classifySkinTone } from "./skin-tone";
import { classifyPaletteTemplate } from "./templates";
import type {
  FormalityLevel,
  OutfitRecommendation,
  RecommendationInput,
  WardrobeItem,
} from "./types";
import { itemHsl } from "./color-utils";
import {
  buildReason,
  combineScores,
  resolveAllowedFormalities,
  scoreContrast,
  scoreFormality,
  scoreHarmony,
  scoreSkinToneFit,
  scoreVersatility,
} from "./scoring";

const USABLE: Set<WardrobeItem["status"]> = new Set(["ready", "clean"]);

function filterUsable(items: WardrobeItem[]): WardrobeItem[] {
  return items.filter((i) => USABLE.has(i.status));
}

function filterByFormality(
  items: WardrobeItem[],
  allowed: FormalityLevel[] | null,
): WardrobeItem[] {
  if (!allowed) return items;
  return items.filter((i) => allowed.includes(i.formality));
}

function slotsFromList(items: WardrobeItem[]): {
  top: WardrobeItem;
  bottom: WardrobeItem;
  footwear: WardrobeItem;
  layer?: WardrobeItem;
} | null {
  const top = items.find((i) => i.category === "top");
  const bottom = items.find((i) => i.category === "bottom");
  const footwear = items.find((i) => i.category === "footwear");
  if (!top || !bottom || !footwear) return null;
  const layer = items.find((i) => i.category === "layer");
  return { top, bottom, footwear, ...(layer ? { layer } : {}) };
}

function evaluateCandidate(
  flat: WardrobeItem[],
  skin: ReturnType<typeof classifySkinTone>,
  allowedFormalities: FormalityLevel[] | null,
): OutfitRecommendation | null {
  if (!passesHardRules(flat)) return null;
  const paletteType = classifyPaletteTemplate(flat);
  if (!paletteType) return null;

  const hsls = flat.map((i) => itemHsl(i.colorHex));
  const colorHarmonyScore = scoreHarmony(flat, hsls, paletteType);
  const skinToneScore = scoreSkinToneFit(flat, skin);
  const contrastScore = scoreContrast(flat);
  const formalityScore = scoreFormality(flat, allowedFormalities);
  const versatilityScore = scoreVersatility(flat);

  const score = combineScores({
    colorHarmonyScore,
    skinToneScore,
    contrastScore,
    formalityScore,
    versatilityScore,
  });

  const slots = slotsFromList(flat);
  if (!slots) return null;

  return {
    items: slots,
    score,
    paletteType,
    reason: buildReason(paletteType, contrastScore, skin),
  };
}

export type RecommendOptions = {
  /** Max results after ranking (default 20) */
  limit?: number;
};

/**
 * Single public entry: deterministic outfit recommendations from rules + scoring.
 */
export function recommendOutfits(
  input: RecommendationInput,
  options?: RecommendOptions,
): OutfitRecommendation[] {
  const limit = options?.limit ?? 20;
  const skin = classifySkinTone(input.skinToneHex);
  const items = normalizeItems(input.items);
  const usable = filterUsable(items);
  const allowedFormalities = resolveAllowedFormalities(
    input.eventType,
    input.formality,
  );
  const formalFiltered = filterByFormality(usable, allowedFormalities);

  const tops = formalFiltered.filter((i) => i.category === "top");
  const bottoms = formalFiltered.filter((i) => i.category === "bottom");
  const shoes = formalFiltered.filter((i) => i.category === "footwear");
  const layers = formalFiltered.filter((i) => i.category === "layer");

  // Product constraint: many users don't want sweaters/coats as default.
  // Deterministically: only include layer items when the request allows `formal`.
  const includeLayers = allowedFormalities?.includes("formal") ?? false;

  const seen = new Set<string>();
  const out: OutfitRecommendation[] = [];

  const consider = (flat: WardrobeItem[]) => {
    const rec = evaluateCandidate(flat, skin, allowedFormalities);
    if (!rec) return;
    const k = [
      rec.items.top.id,
      rec.items.bottom.id,
      rec.items.footwear.id,
      rec.items.layer?.id ?? "",
    ].join("|");
    if (seen.has(k)) return;
    seen.add(k);
    out.push(rec);
  };

  for (const t of tops) {
    for (const b of bottoms) {
      for (const f of shoes) {
        consider([t, b, f]);
        if (includeLayers) {
          for (const l of layers) {
            consider([t, b, f, l]);
          }
        }
      }
    }
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

/**
 * Score a single flat list (e.g. swap simulation). Same rules as generation.
 */
export function evaluateOutfitRecommendation(
  skinToneHex: string,
  flatItems: WardrobeItem[],
  eventType: RecommendationInput["eventType"],
  formality: FormalityLevel | undefined,
): OutfitRecommendation | null {
  const skin = classifySkinTone(skinToneHex);
  const normalized = normalizeItems(flatItems);
  const allowed = resolveAllowedFormalities(eventType, formality);
  return evaluateCandidate(normalized, skin, allowed);
}
