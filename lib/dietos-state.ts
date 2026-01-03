export type Dish = {
  id: string
  name: string
  meal: "breakfast" | "lunch" | "snack" | "dinner"
  prepTime: number
  calories: number
  protein: number
  carbs: number
  fat: number
  tags: string[]
  ingredients: string[]
  steps: string[]
}

export type WeeklyPlan = {
  [key: string]: {
    breakfast: string
    lunch: string
    snack: string
    dinner: string
  }
}

export type DietOSState = {
  meta: {
    version: string
    lastUpdated: string
  }
  settings: {
    defaultMealTimes: {
      breakfast: string
      lunch: string
      snack: string
      dinner: string
    }
    targets: {
      calories: number
      protein: number
    }
  }
  weeklyPlan: WeeklyPlan
  dishes: Dish[]
  ingredientsIndex: string[]
}

export const INITIAL_STATE: DietOSState = {
  meta: {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
  },
  settings: {
    defaultMealTimes: {
      breakfast: "08:00",
      lunch: "13:00",
      snack: "16:00",
      dinner: "20:00",
    },
    targets: {
      calories: 2000,
      protein: 150,
    },
  },
  weeklyPlan: {
    Monday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Tuesday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Wednesday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Thursday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Friday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Saturday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
    Sunday: { breakfast: "1", lunch: "2", snack: "3", dinner: "4" },
  },
  dishes: [
    {
      id: "1",
      name: "Masala Omelette + Bread",
      meal: "breakfast",
      prepTime: 10,
      calories: 450,
      protein: 25,
      carbs: 30,
      fat: 20,
      tags: ["rich-protein"],
      ingredients: ["2 Eggs", "1 slice Bread", "Onion", "Chili", "Spices"],
      steps: ["Whisk eggs with spices", "Cook in pan", "Toast bread"],
    },
    {
      id: "2",
      name: "Grilled Chicken Salad",
      meal: "lunch",
      prepTime: 20,
      calories: 600,
      protein: 45,
      carbs: 15,
      fat: 25,
      tags: ["rich-protein", "low-carb"],
      ingredients: ["200g Chicken Breast", "Mixed Greens", "Olive Oil", "Lemon"],
      steps: ["Grill chicken", "Toss greens", "Serve"],
    },
    {
      id: "3",
      name: "Greek Yogurt with Berries",
      meal: "snack",
      prepTime: 5,
      calories: 200,
      protein: 20,
      carbs: 15,
      fat: 2,
      tags: ["rich-protein"],
      ingredients: ["200g Greek Yogurt", "50g Berries"],
      steps: ["Mix and serve"],
    },
    {
      id: "4",
      name: "Steamed Salmon & Veggies",
      meal: "dinner",
      prepTime: 25,
      calories: 550,
      protein: 35,
      carbs: 10,
      fat: 30,
      tags: ["rich-protein", "light"],
      ingredients: ["150g Salmon", "Broccoli", "Asparagus"],
      steps: ["Steam salmon and veg for 12 mins"],
    },
  ],
  ingredientsIndex: ["Eggs", "Bread", "Chicken Breast", "Salmon", "Broccoli"],
}
