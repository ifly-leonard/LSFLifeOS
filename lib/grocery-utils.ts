export type GroceryGroup = {
  proteins: { name: string; count: number }[]
  vegetables: { name: string; count: number }[]
  pantry: { name: string; count: number }[]
}

const PROTEIN_KEYWORDS = [
  "chicken",
  "salmon",
  "eggs",
  "beef",
  "pork",
  "fish",
  "meat",
  "protein",
  "turkey",
  "tuna",
  "shrimp",
  "tofu",
  "yogurt",
  "cheese",
  "milk",
]

const VEGETABLE_KEYWORDS = [
  "broccoli",
  "asparagus",
  "greens",
  "lettuce",
  "spinach",
  "vegetable",
  "veg",
  "carrot",
  "tomato",
  "onion",
  "pepper",
  "cucumber",
  "celery",
  "cabbage",
  "cauliflower",
  "zucchini",
  "mushroom",
]

function categorizeIngredient(ingredient: string): "proteins" | "vegetables" | "pantry" {
  const lower = ingredient.toLowerCase()

  // Check for protein keywords
  if (PROTEIN_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "proteins"
  }

  // Check for vegetable keywords
  if (VEGETABLE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "vegetables"
  }

  // Everything else is pantry
  return "pantry"
}

export function groupGroceries(
  ingredients: { name: string; count: number }[]
): GroceryGroup {
  const grouped: GroceryGroup = {
    proteins: [],
    vegetables: [],
    pantry: [],
  }

  ingredients.forEach((item) => {
    const category = categorizeIngredient(item.name)
    grouped[category].push(item)
  })

  // Sort each category alphabetically
  grouped.proteins.sort((a, b) => a.name.localeCompare(b.name))
  grouped.vegetables.sort((a, b) => a.name.localeCompare(b.name))
  grouped.pantry.sort((a, b) => a.name.localeCompare(b.name))

  return grouped
}

