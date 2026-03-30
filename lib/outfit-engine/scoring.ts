import {
  EVENT_FORMALITY,
  type EventType,
  type FormalityLevel,
  type Hsl,
  type PaletteType,
  type SkinProfile,
  type WardrobeItem,
} from "./types";
import {
  classifyColorFamily,
  isCoolHue,
  isWarmHue,
  itemHsl,
} from "./color-utils";
import { patternOf } from "./normalize";

export function resolveAllowedFormalities(
  eventType: EventType | undefined,
  explicit: FormalityLevel | undefined,
): FormalityLevel[] | null {
  if (explicit) return [explicit];
  if (eventType) return [...EVENT_FORMALITY[eventType]];
  return null;
}

export function scoreHarmony(
  items: WardrobeItem[],
  hsls: Hsl[],
  paletteType: PaletteType,
): number {
  const families = hsls.map(classifyColorFamily);
  const neutralN = families.filter((f) =>
    ["neutral", "dark_anchor", "light_anchor"].includes(f),
  ).length;
  const earthN = families.filter((f) => f === "earth").length;
  const mutedN = families.filter((f) => f === "muted_color").length;

  let base = 55;

  switch (paletteType) {
    case "monochrome":
      base = 88;
      break;
    case "one_accent":
      base = 82;
      break;
    case "earth_balanced":
      base = 78;
      if (earthN >= 2) base += 8;
      break;
    case "layer_led":
      base = 76;
      break;
    case "neutral_base":
      base = 80;
      if (neutralN >= 2) base += 10;
      if (earthN >= 1 && mutedN >= 0) base += 4;
      break;
    default:
      break;
  }

  const patternNoise = items.filter((i) => patternOf(i) !== "solid").length;
  base -= patternNoise * 6;

  return Math.max(0, Math.min(100, base));
}

export function scoreSkinToneFit(
  items: WardrobeItem[],
  skin: SkinProfile,
): number {
  const nearFace =
    items.find((i) => i.category === "layer") ??
    items.find((i) => i.category === "top");
  if (!nearFace) return 45;

  const hsl = itemHsl(nearFace.colorHex);
  let score = 52;

  const warmColor = isWarmHue(hsl.h, hsl.s);
  const coolColor = isCoolHue(hsl.h, hsl.s);

  if (skin.undertone === "warm" && warmColor) score += 22;
  else if (skin.undertone === "cool" && coolColor) score += 22;
  else if (skin.undertone === "neutral") score += 12;

  // Depth vs garment lightness (avoid washout / too harsh)
  if (skin.depth === "light") {
    if (hsl.l > 78 && hsl.s < 25) score -= 18;
    if (hsl.l < 42) score += 10;
  } else if (skin.depth === "deep") {
    if (hsl.l < 22 && hsl.s < 20) score -= 12;
    if (hsl.l > 55 && hsl.s > 15) score += 12;
  } else {
    if (hsl.l > 85) score -= 10;
    if (hsl.l >= 35 && hsl.l <= 70) score += 8;
  }

  if (skin.contrastTendency === "high" && Math.abs(hsl.l - 50) > 15)
    score += 6;
  if (skin.contrastTendency === "low" && hsl.s > 70 && hsl.l < 35)
    score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function scoreContrast(items: WardrobeItem[]): number {
  const hsls = items.map((i) => itemHsl(i.colorHex));
  const ls = hsls.map((h) => h.l);
  const spread = Math.max(...ls) - Math.min(...ls);
  let score = Math.min(100, spread * 2.2);

  const mids = ls.filter((l) => l > 35 && l < 58).length;
  if (mids >= 3 && spread < 38) score -= 22;

  return Math.max(0, Math.min(100, score));
}

export function scoreFormality(
  items: WardrobeItem[],
  allowed: FormalityLevel[] | null,
): number {
  if (!allowed || allowed.length === 0) return 72;
  const ok = items.filter((i) => allowed.includes(i.formality)).length;
  return Math.round((ok / items.length) * 100);
}

export function scoreVersatility(items: WardrobeItem[]): number {
  const hsls = items.map((i) => itemHsl(i.colorHex));
  const families = hsls.map(classifyColorFamily);
  const versatile = families.filter((f) =>
    ["neutral", "earth", "dark_anchor", "light_anchor", "muted_color"].includes(
      f,
    ),
  ).length;
  return Math.round((versatile / items.length) * 100);
}

export function combineScores(parts: {
  colorHarmonyScore: number;
  skinToneScore: number;
  contrastScore: number;
  formalityScore: number;
  versatilityScore: number;
}): number {
  const {
    colorHarmonyScore,
    skinToneScore,
    contrastScore,
    formalityScore,
    versatilityScore,
  } = parts;
  return (
    colorHarmonyScore * 0.3 +
    skinToneScore * 0.25 +
    contrastScore * 0.2 +
    formalityScore * 0.15 +
    versatilityScore * 0.1
  );
}

export function buildReason(
  paletteType: PaletteType,
  contrastScore: number,
  skin: SkinProfile,
): string {
  const contrastWord = contrastScore > 72 ? "strong" : "balanced";
  const tone = `${skin.depth} depth, ${skin.undertone} undertone`;
  const labels: Record<PaletteType, string> = {
    neutral_base: "Neutral foundation with safe mixing.",
    one_accent: "Single clear accent over quiet bases.",
    monochrome: "Tonal palette for a cohesive silhouette.",
    earth_balanced: "Grounded earth tones without loud accents.",
    layer_led: "Outer layer anchors the look.",
  };
  return `${labels[paletteType]} ${contrastWord} contrast; fits ${tone}.`;
}
