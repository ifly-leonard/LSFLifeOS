export type FormalityLevel = "casual" | "smart_casual" | "formal";

export type ItemStatus = "ready" | "clean" | "dirty" | "ironing";

export type ItemCategory = "top" | "bottom" | "footwear" | "layer";

export type ItemPattern = "solid" | "striped" | "checkered" | "printed" | "textured";

export type WardrobeItem = {
  id: string;
  title: string;
  category: ItemCategory;
  colorHex: string;
  colorName: string;
  pattern?: ItemPattern;
  formality: FormalityLevel;
  status: ItemStatus;
};

export type EventType = "work" | "meeting" | "casual" | "travel" | "dinner";

export type RecommendationInput = {
  skinToneHex: string;
  items: WardrobeItem[];
  eventType?: EventType;
  formality?: FormalityLevel;
};

export type PaletteType =
  | "neutral_base"
  | "one_accent"
  | "monochrome"
  | "earth_balanced"
  | "layer_led";

export type OutfitRecommendation = {
  items: {
    top: WardrobeItem;
    bottom: WardrobeItem;
    footwear: WardrobeItem;
    layer?: WardrobeItem;
  };
  score: number;
  reason: string;
  paletteType: PaletteType;
};

export type ColorFamily =
  | "neutral"
  | "earth"
  | "muted_color"
  | "bright_accent"
  | "dark_anchor"
  | "light_anchor";

export type Hsl = { h: number; s: number; l: number };

export type Rgb = { r: number; g: number; b: number };

export type SkinProfile = {
  undertone: "warm" | "cool" | "neutral";
  depth: "light" | "medium" | "deep";
  /** Heuristic: how much lightness contrast exists in the skin sample */
  contrastTendency: "low" | "medium" | "high";
};

export const EVENT_FORMALITY = {
  work: ["smart_casual"],
  meeting: ["smart_casual", "formal"],
  casual: ["casual", "smart_casual"],
  travel: ["casual"],
  dinner: ["smart_casual", "formal"],
} as const satisfies Record<EventType, readonly FormalityLevel[]>;
