/**
 * Rules-first outfit engine — single source of truth for outfit recommendations.
 */

export type {
  ColorFamily,
  EventType,
  FormalityLevel,
  ItemCategory,
  ItemPattern,
  ItemStatus,
  OutfitRecommendation,
  PaletteType,
  RecommendationInput,
  SkinProfile,
  WardrobeItem,
  Hsl,
  Rgb,
} from "./types";

export { EVENT_FORMALITY } from "./types";

export { hexToRgb, rgbToHsl, classifyColorFamily, itemHsl } from "./color-utils";
export { normalizeHex } from "./color-utils";

export { classifySkinTone } from "./skin-tone";

export { passesHardRules } from "./hard-rules";

export {
  scoreHarmony,
  scoreSkinToneFit,
  scoreContrast,
  scoreFormality,
  scoreVersatility,
  combineScores,
  resolveAllowedFormalities,
  buildReason,
} from "./scoring";

export { classifyPaletteTemplate } from "./templates";

export { normalizeItem, normalizeItems, patternOf } from "./normalize";

export {
  recommendOutfits,
  evaluateOutfitRecommendation,
  type RecommendOptions,
} from "./recommend";

export { SAMPLE_WARDROBE_ITEMS } from "./sample-data";
export { runSampleRecommendation } from "./example-usage";

export {
  appItemToEngineItem,
  appWardrobeToEngineItems,
  recommendOutfitsForApp,
  appOutfitFromRecommendation,
  displayPaletteHexesForAppOutfit,
  bestSwapForAppOutfit,
  plannerEventToEngineContext,
} from "./app-bridge";
