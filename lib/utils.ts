import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMealColorClasses(meal: string) {
  const mealLower = meal.toLowerCase()
  switch (mealLower) {
    case "breakfast":
      return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200"
    case "lunch":
      return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-200"
    case "snack":
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-900 dark:text-green-200"
    case "dinner":
      return "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30 text-purple-900 dark:text-purple-200"
    default:
      return "bg-muted border-border text-muted-foreground"
  }
}

export function getMealTextColorClasses(meal: string) {
  const mealLower = meal.toLowerCase()
  switch (mealLower) {
    case "breakfast":
      return "text-amber-700 dark:text-amber-300"
    case "lunch":
      return "text-blue-700 dark:text-blue-300"
    case "snack":
      return "text-green-700 dark:text-green-300"
    case "dinner":
      return "text-purple-700 dark:text-purple-300"
    default:
      return "text-muted-foreground"
  }
}
