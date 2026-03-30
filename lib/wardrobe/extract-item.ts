import {
  Category,
  Color,
  Fit,
  Formality,
  Material,
  Pattern,
  Status,
  Subcategory,
  type WardrobeItem,
} from "@/lib/wardrobe-data"

export type ExtractedWardrobeDraft = Pick<
  WardrobeItem,
  | "title"
  | "category"
  | "subcategory"
  | "primary_color"
  | "secondary_colors"
  | "pattern"
  | "material"
  | "fit"
  | "formality"
  | "status"
  | "brand"
  | "size"
  | "notes"
>

export type ExtractWardrobeInput = {
  image: Blob
  cleanedImage?: Blob
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** Replace with API / on-device ML when available. */
async function extractWardrobeItemFromImageImpl(
  _input: ExtractWardrobeInput,
): Promise<ExtractedWardrobeDraft> {
  await delay(700)
  return {
    title: "New wardrobe item",
    category: Category.Tops,
    subcategory: Subcategory.Tshirt,
    primary_color: Color.Navy,
    secondary_colors: [],
    pattern: Pattern.Solid,
    material: Material.Cotton,
    fit: Fit.Regular,
    formality: Formality.Casual,
    status: Status.Ready,
    brand: "",
    size: "",
    notes: "",
  }
}

/**
 * Structured extraction from the accepted photo. Swappable for a real service without changing UI.
 */
export async function extractWardrobeItemFromImage(
  input: ExtractWardrobeInput,
): Promise<ExtractedWardrobeDraft> {
  return extractWardrobeItemFromImageImpl(input)
}

export function defaultEmptyDraft(): ExtractedWardrobeDraft {
  return {
    title: "",
    category: Category.Tops,
    subcategory: Subcategory.Tshirt,
    primary_color: Color.Navy,
    secondary_colors: [],
    pattern: Pattern.Solid,
    material: Material.Cotton,
    fit: Fit.Regular,
    formality: Formality.Casual,
    status: Status.Ready,
    brand: "",
    size: "",
    notes: "",
  }
}
