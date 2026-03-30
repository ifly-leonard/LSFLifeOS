import { hexToRgb, rgbToHsl } from "./color-utils";
import type { SkinProfile } from "./types";

export function classifySkinTone(skinToneHex: string): SkinProfile {
  const { r, g, b } = hexToRgb(skinToneHex);
  const { h: _h, s, l } = rgbToHsl(r, g, b);

  const depth: SkinProfile["depth"] =
    l > 68 ? "light" : l > 38 ? "medium" : "deep";

  let undertone: SkinProfile["undertone"] = "neutral";
  if (r > b + 18) undertone = "warm";
  else if (b > r + 12) undertone = "cool";

  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const contrastTendency: SkinProfile["contrastTendency"] =
    spread < 35 ? "low" : spread < 70 ? "medium" : "high";

  return { undertone, depth, contrastTendency };
}
