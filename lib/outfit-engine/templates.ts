import type { Hsl, PaletteType, WardrobeItem } from "./types";
import { classifyColorFamily, itemHsl } from "./color-utils";
import { patternOf } from "./normalize";

function hueBucket(h: number): number {
  return Math.floor(((h % 360) + 360) % 360 / 30);
}

/**
 * Safe template classification — outfit must match one of these archetypes.
 * Priority: monochrome → one_accent → earth_balanced → layer_led → neutral_base.
 */
export function classifyPaletteTemplate(
  items: WardrobeItem[],
): PaletteType | null {
  const hsls = items.map((i) => itemHsl(i.colorHex));
  const families = hsls.map(classifyColorFamily);

  const accentN = families.filter((f) => f === "bright_accent").length;
  const earthN = families.filter((f) => f === "earth").length;
  const neutralLike = (f: string) =>
    ["neutral", "dark_anchor", "light_anchor"].includes(f);

  const saturatedBuckets = new Set<number>();
  for (const hsl of hsls) {
    if (hsl.s > 12) saturatedBuckets.add(hueBucket(hsl.h));
  }

  // Monochrome: single hue family among colored pieces, or all low-chroma
  if (saturatedBuckets.size <= 1 && accentN === 0) {
    return "monochrome";
  }

  if (accentN === 1) {
    return "one_accent";
  }

  if (earthN >= 2 && accentN === 0) {
    return "earth_balanced";
  }

  const layer = items.find((i) => i.category === "layer");
  const top = items.find((i) => i.category === "top");
  if (layer && top) {
    const lH = itemHsl(layer.colorHex);
    const tH = itemHsl(top.colorHex);
    const layerForward =
      patternOf(layer) !== "solid" ||
      classifyColorFamily(lH) !== classifyColorFamily(tH) ||
      Math.abs(lH.l - tH.l) >= 18;
    if (layerForward) {
      return "layer_led";
    }
  }

  const neutralishCount = families.filter(neutralLike).length;
  if (accentN === 0 && neutralishCount >= 2) {
    return "neutral_base";
  }

  return null;
}
