/**
 * Example: run with `npx tsx lib/outfit-engine/example-usage.ts` (if tsx available)
 * or import from tests. Kept as reference only.
 */
import { recommendOutfits } from "./recommend";
import { SAMPLE_WARDROBE_ITEMS } from "./sample-data";

export function runSampleRecommendation() {
  const results = recommendOutfits(
    {
      skinToneHex: "#e0ac69",
      items: SAMPLE_WARDROBE_ITEMS,
      eventType: "casual",
    },
    { limit: 5 },
  );

  // Sample output shape:
  // [{ items: { top, bottom, footwear, layer? }, score, reason, paletteType }, ...]
  return results;
}
