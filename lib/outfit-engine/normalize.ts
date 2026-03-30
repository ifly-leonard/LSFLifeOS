import { normalizeHex } from "./color-utils";
import type { ItemPattern, WardrobeItem } from "./types";

export function patternOf(item: WardrobeItem): ItemPattern {
  return item.pattern ?? "solid";
}

export function normalizeItem(item: WardrobeItem): WardrobeItem {
  const hex = normalizeHex(item.colorHex) ?? item.colorHex;
  return {
    ...item,
    colorHex: hex,
    pattern: patternOf(item),
  };
}

export function normalizeItems(items: WardrobeItem[]): WardrobeItem[] {
  return items.map(normalizeItem);
}
