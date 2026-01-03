import { type DietOSState, type WeeklyPlan, type Dish } from "./dietos-state"

function getRandomElement<T>(array: T[]): T | null {
  if (array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}

function hasProteinTag(dish: Dish): boolean {
  return dish.tags.some((tag) => tag.toLowerCase().includes("protein"))
}

function randomizeDay(
  state: DietOSState,
  day: string,
  maxRetries: number = 20
): { breakfast: string; lunch: string; snack: string; dinner: string } | null {
  const breakfastDishes = state.dishes.filter((d) => d.meal === "breakfast" && !d.disabled)
  const lunchDishes = state.dishes.filter((d) => d.meal === "lunch" && !d.disabled)
  const snackDishes = state.dishes.filter((d) => d.meal === "snack" && hasProteinTag(d) && !d.disabled)
  const dinnerDishes = state.dishes.filter((d) => d.meal === "dinner" && !d.disabled)

  // Edge case: no dishes for required meal types
  if (breakfastDishes.length === 0 || lunchDishes.length === 0 || dinnerDishes.length === 0) {
    return null
  }

  // Edge case: no valid snacks with protein tag - fallback to all enabled snacks
  const snackOptions = snackDishes.length > 0 
    ? snackDishes 
    : state.dishes.filter((d) => d.meal === "snack" && !d.disabled)
  
  if (snackOptions.length === 0) {
    return null
  }

  for (let retry = 0; retry < maxRetries; retry++) {
    // Select breakfast
    const breakfast = getRandomElement(breakfastDishes)
    if (!breakfast) continue

    // Select lunch
    const lunch = getRandomElement(lunchDishes)
    if (!lunch) continue

    // Select snack
    const snack = getRandomElement(snackOptions)
    if (!snack) continue

    // Filter dinner based on lunch constraint
    let dinnerOptions = dinnerDishes
    if (lunch.tags.includes("carb-heavy")) {
      dinnerOptions = dinnerDishes.filter(
        (d) => d.tags.includes("low-carb") || d.tags.includes("light")
      )
      // If no valid dinners, retry with different lunch
      if (dinnerOptions.length === 0) continue
    }

    const dinner = getRandomElement(dinnerOptions)
    if (!dinner) continue

    // Validate constraints
    const allDishes = [breakfast, lunch, snack, dinner]
    const carbHeavyCount = allDishes.filter((d) => d.tags.includes("carb-heavy")).length
    const richProteinCount = allDishes.filter((d) => d.tags.includes("rich-protein")).length

    // Check if constraints are satisfied
    if (carbHeavyCount <= 1 && richProteinCount <= 1) {
      return {
        breakfast: breakfast.id,
        lunch: lunch.id,
        snack: snack.id,
        dinner: dinner.id,
      }
    }
  }

  // If retries exhausted, return null (caller should handle fallback)
  return null
}

export function randomizeWeeklyPlan(state: DietOSState): WeeklyPlan {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const newPlan: WeeklyPlan = {} as WeeklyPlan
  let failedDays: string[] = []

  for (const day of days) {
    const randomized = randomizeDay(state, day)
    if (randomized) {
      newPlan[day] = randomized
    } else {
      // Fallback to current plan for this day if randomization fails
      newPlan[day] = state.weeklyPlan[day]
      failedDays.push(day)
    }
  }

  // If many days failed, it might indicate a data issue
  // This is handled by the caller showing appropriate messages
  if (failedDays.length > 0) {
    console.warn(`Randomization failed for days: ${failedDays.join(", ")}`)
  }

  return newPlan
}

