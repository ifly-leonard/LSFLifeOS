import { type LifeOSState, type Dish } from "./lifeos-state"

export function validateLifeOSState(data: unknown): { valid: boolean; error?: string; state?: LifeOSState } {
  try {
    if (!data || typeof data !== "object") {
      return { valid: false, error: "Data must be an object" }
    }

    const obj = data as Record<string, unknown>

    // Validate meta
    if (!obj.meta || typeof obj.meta !== "object") {
      return { valid: false, error: "Missing or invalid 'meta' field" }
    }
    const meta = obj.meta as Record<string, unknown>
    if (typeof meta.version !== "string" || typeof meta.lastUpdated !== "string") {
      return { valid: false, error: "Invalid 'meta' structure (requires version and lastUpdated)" }
    }

    // Validate settings
    if (!obj.settings || typeof obj.settings !== "object") {
      return { valid: false, error: "Missing or invalid 'settings' field" }
    }
    const settings = obj.settings as Record<string, unknown>
    if (!settings.defaultMealTimes || typeof settings.defaultMealTimes !== "object") {
      return { valid: false, error: "Missing or invalid 'settings.defaultMealTimes'" }
    }
    const mealTimes = settings.defaultMealTimes as Record<string, unknown>
    const requiredMeals = ["breakfast", "lunch", "snack", "dinner"]
    for (const meal of requiredMeals) {
      if (typeof mealTimes[meal] !== "string") {
        return { valid: false, error: `Missing or invalid meal time for '${meal}'` }
      }
    }
    if (!settings.targets || typeof settings.targets !== "object") {
      return { valid: false, error: "Missing or invalid 'settings.targets'" }
    }
    const targets = settings.targets as Record<string, unknown>
    if (typeof targets.calories !== "number" || typeof targets.protein !== "number") {
      return { valid: false, error: "Invalid 'settings.targets' (calories and protein must be numbers)" }
    }
    // Timezone is optional for backward compatibility, but if present must be a string
    if (settings.timezone !== undefined && typeof settings.timezone !== "string") {
      return { valid: false, error: "Invalid 'settings.timezone' (must be a string)" }
    }

    if (settings.wardrobe !== undefined) {
      if (typeof settings.wardrobe !== "object") {
        return { valid: false, error: "Invalid 'settings.wardrobe' (must be an object)" }
      }
      const wardrobe = settings.wardrobe as Record<string, unknown>
      if (typeof wardrobe.skinTone !== "string") {
         return { valid: false, error: "Invalid 'settings.wardrobe.skinTone' (must be a string)" }
      }
      if (typeof wardrobe.bodyType !== "string") {
         return { valid: false, error: "Invalid 'settings.wardrobe.bodyType' (must be a string)" }
      }
      if (typeof wardrobe.dressingPreference !== "string") {
         return { valid: false, error: "Invalid 'settings.wardrobe.dressingPreference' (must be a string)" }
      }
      if (wardrobe.skinToneImage !== undefined && typeof wardrobe.skinToneImage !== "string") {
         return { valid: false, error: "Invalid 'settings.wardrobe.skinToneImage' (must be a string)" }
      }
    } else {
      settings.wardrobe = {
        skinTone: "#e0ac69",
        bodyType: "athletic",
        dressingPreference: "minimalist"
      }
    }

    // Validate weeklyPlan
    if (!obj.weeklyPlan || typeof obj.weeklyPlan !== "object") {
      return { valid: false, error: "Missing or invalid 'weeklyPlan' field" }
    }
    const weeklyPlan = obj.weeklyPlan as Record<string, unknown>
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for (const day of days) {
      if (!weeklyPlan[day] || typeof weeklyPlan[day] !== "object") {
        return { valid: false, error: `Missing or invalid plan for '${day}'` }
      }
      const dayPlan = weeklyPlan[day] as Record<string, unknown>
      for (const meal of requiredMeals) {
        if (typeof dayPlan[meal] !== "string") {
          return { valid: false, error: `Missing or invalid dish ID for ${day}.${meal}` }
        }
      }
    }

    // Validate dishes
    if (!Array.isArray(obj.dishes)) {
      return { valid: false, error: "Missing or invalid 'dishes' array" }
    }
    for (let i = 0; i < obj.dishes.length; i++) {
      const dish = obj.dishes[i] as unknown
      const dishError = validateDish(dish, i)
      if (dishError) {
        return { valid: false, error: dishError }
      }
    }

    // Validate ingredientsIndex
    if (!Array.isArray(obj.ingredientsIndex)) {
      return { valid: false, error: "Missing or invalid 'ingredientsIndex' array" }
    }
    for (let i = 0; i < obj.ingredientsIndex.length; i++) {
      if (typeof obj.ingredientsIndex[i] !== "string") {
        return { valid: false, error: `ingredientsIndex[${i}] must be a string` }
      }
    }

    // Validate that all dish IDs in weeklyPlan exist in dishes
    const dishIds = new Set((obj.dishes as Dish[]).map((d) => d.id))
    for (const day of days) {
      const dayPlan = weeklyPlan[day] as Record<string, string>
      for (const meal of requiredMeals) {
        const dishId = dayPlan[meal]
        if (!dishIds.has(dishId)) {
          return { valid: false, error: `Dish ID '${dishId}' referenced in ${day}.${meal} does not exist in dishes array` }
        }
      }
    }

    return { valid: true, state: obj as LifeOSState }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    }
  }
}

function validateDish(dish: unknown, index: number): string | null {
  if (!dish || typeof dish !== "object") {
    return `dishes[${index}] must be an object`
  }

  const d = dish as Record<string, unknown>
  const requiredFields = {
    id: "string",
    name: "string",
    meal: "string",
    prepTime: "number",
    calories: "number",
    protein: "number",
    carbs: "number",
    fat: "number",
    tags: "array",
    ingredients: "array",
    steps: "array",
  }

  for (const [field, type] of Object.entries(requiredFields)) {
    if (!(field in d)) {
      return `dishes[${index}] missing required field '${field}'`
    }
    if (type === "array" && !Array.isArray(d[field])) {
      return `dishes[${index}].${field} must be an array`
    }
    if (type === "number" && typeof d[field] !== "number") {
      return `dishes[${index}].${field} must be a number`
    }
    if (type === "string" && typeof d[field] !== "string") {
      return `dishes[${index}].${field} must be a string`
    }
  }

  // Validate meal type
  const validMeals = ["breakfast", "lunch", "snack", "dinner"]
  if (!validMeals.includes(d.meal as string)) {
    return `dishes[${index}].meal must be one of: ${validMeals.join(", ")}`
  }

  // Validate array contents
  if (!(d.tags as unknown[]).every((t) => typeof t === "string")) {
    return `dishes[${index}].tags must be an array of strings`
  }
  if (!(d.ingredients as unknown[]).every((i) => typeof i === "string")) {
    return `dishes[${index}].ingredients must be an array of strings`
  }
  if (!(d.steps as unknown[]).every((s) => typeof s === "string")) {
    return `dishes[${index}].steps must be an array of strings`
  }

  return null
}

