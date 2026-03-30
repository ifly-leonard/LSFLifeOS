import type { WardrobeItem } from "./types";
import {
  classifyColorFamily,
  isCoolHue,
  isWarmHue,
  itemHsl,
} from "./color-utils";
import { patternOf } from "./normalize";

function hasCoreSlots(items: WardrobeItem[]): boolean {
  const cats = new Set(items.map((i) => i.category));
  return cats.has("top") && cats.has("bottom") && cats.has("footwear");
}

/**
 * Mandatory hard rejects. Deterministic; no scoring fallback.
 */
export function passesHardRules(items: WardrobeItem[]): boolean {
  if (items.length < 3 || !hasCoreSlots(items)) return false;

  if (items.some((i) => i.status === "dirty" || i.status === "ironing"))
    return false;

  const hsls = items.map((i) => itemHsl(i.colorHex));
  const families = hsls.map(classifyColorFamily);

  if (families.filter((f) => f === "bright_accent").length > 1) return false;

  const hasNeutralPresence = families.some((f) =>
    ["neutral", "dark_anchor", "light_anchor", "earth"].includes(f),
  );
  if (!hasNeutralPresence) return false;

  const ls = hsls.map((h) => h.l);
  const spread = Math.max(...ls) - Math.min(...ls);
  if (spread < 15) return false;

  const patternCount = items.filter((i) => patternOf(i) !== "solid").length;
  if (patternCount > 1) return false;

  if (clashingTones(hsls)) return false;

  return true;
}

function clashingTones(hsls: { h: number; s: number; l: number }[]): boolean {
  let warmStrong = false;
  let coolStrong = false;
  for (const { h, s } of hsls) {
    if (s < 15) continue;
    if (isWarmHue(h, s)) warmStrong = true;
    if (isCoolHue(h, s)) coolStrong = true;
  }
  return warmStrong && coolStrong;
}
