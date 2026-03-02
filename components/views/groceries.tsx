"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { groupGroceries } from "@/lib/grocery-utils"
import { useToast } from "@/hooks/use-toast"
import { Copy, Grid3x3, Utensils, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type GroupingMode = "category" | "meals" | "days"

export function GroceriesView({ state }: { state: DietOSState }) {
  const { toast } = useToast()
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("category")
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

  const getAggregatedGroceries = () => {
    const counts: { [key: string]: number } = {}
    Object.values(state.weeklyPlan).forEach((day) => {
      Object.values(day).forEach((dishId) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (dish) {
          dish.ingredients.forEach((ing) => {
            counts[ing] = (counts[ing] || 0) + 1
          })
        }
      })
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }

  const groceries = getAggregatedGroceries()
  const grouped = groupGroceries(groceries)

  const groceriesByMeals = useMemo(() => {
    const mealGroups: {
      [key: string]: { name: string; count: number }[]
    } = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    }

    Object.values(state.weeklyPlan).forEach((day) => {
      Object.entries(day).forEach(([mealType, dishId]) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (dish) {
          dish.ingredients.forEach((ing) => {
            const existing = mealGroups[mealType].find((item) => item.name === ing)
            if (existing) {
              existing.count += 1
            } else {
              mealGroups[mealType].push({ name: ing, count: 1 })
            }
          })
        }
      })
    })

    // Sort each meal group
    Object.keys(mealGroups).forEach((meal) => {
      mealGroups[meal].sort((a, b) => a.name.localeCompare(b.name))
    })

    return mealGroups
  }, [state])

  const groceriesByDays = useMemo(() => {
    const dayGroups: {
      [key: string]: { name: string; count: number }[]
    } = {}

    Object.entries(state.weeklyPlan).forEach(([day, meals]) => {
      dayGroups[day] = []
      Object.values(meals).forEach((dishId) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (dish) {
          dish.ingredients.forEach((ing) => {
            const existing = dayGroups[day].find((item) => item.name === ing)
            if (existing) {
              existing.count += 1
            } else {
              dayGroups[day].push({ name: ing, count: 1 })
            }
          })
        }
      })
      // Sort each day group
      dayGroups[day].sort((a, b) => a.name.localeCompare(b.name))
    })

    return dayGroups
  }, [state])

  const handleCheckboxChange = (itemName: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(itemName)
      } else {
        newSet.delete(itemName)
      }
      return newSet
    })
  }

  const handleCopyUnchecked = async () => {
    try {
      const allItems: { name: string; count: number }[] = []

      if (groupingMode === "category") {
        allItems.push(...grouped.proteins, ...grouped.vegetables, ...grouped.pantry)
      } else if (groupingMode === "meals") {
        Object.values(groceriesByMeals).forEach((items) => {
          items.forEach((item) => {
            const existing = allItems.find((i) => i.name === item.name)
            if (existing) {
              existing.count += item.count
            } else {
              allItems.push({ ...item })
            }
          })
        })
      } else if (groupingMode === "days") {
        Object.values(groceriesByDays).forEach((items) => {
          items.forEach((item) => {
            const existing = allItems.find((i) => i.name === item.name)
            if (existing) {
              existing.count += item.count
            } else {
              allItems.push({ ...item })
            }
          })
        })
      }

      const uncheckedItems = allItems.filter((item) => !checkedItems.has(item.name))

      if (uncheckedItems.length === 0) {
        toast({
          title: "No items to copy",
          description: "All items are checked",
        })
        return
      }

      // Create CSV format
      const csvLines = uncheckedItems.map((item) => {
        // Extract quantity and name (e.g., "2 Eggs" -> "2, Eggs")
        const match = item.name.match(/^(\d+)\s+(.+)$/)
        if (match) {
          const quantity = parseInt(match[1]) * item.count
          const name = match[2]
          return `${quantity},${name}`
        }
        // If no quantity prefix, just use the name with count
        return `${item.count},${item.name}`
      })

      const csvContent = csvLines.join("\n")

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csvContent)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = csvContent
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      // Show success toast
      toast({
        title: "Copied to clipboard",
        description: "Paste this into Swiggy Instamart",
      })
    } catch (err) {
      console.error("Failed to copy:", err)
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const renderGroceryList = (items: { name: string; count: number }[], title: string, isSubCategory = false) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-3">
        <h4 className={cn(
          "font-black uppercase tracking-tighter border-b-2 border-primary pb-1",
          isSubCategory ? "text-xs" : "text-sm"
        )}>
          {title}
        </h4>
        <div className="space-y-2">
          {items.map((item) => {
            const isChecked = checkedItems.has(item.name)
            return (
              <div
                key={item.name}
                className="flex items-center space-x-3 pb-2 border-b border-border last:border-0 last:pb-0"
              >
                <Checkbox
                  id={item.name}
                  className="h-5 w-5 border-2 rounded-none"
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(item.name, checked === true)
                  }
                />
                <label
                  htmlFor={item.name}
                  className="flex-1 text-xs font-black uppercase tracking-tight leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex justify-between"
                >
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">x{item.count}</span>
                </label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderByMeals = () => {
    const mealLabels: { [key: string]: string } = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      snack: "Snack",
      dinner: "Dinner",
    }

    return (
      <div className="space-y-6">
        {Object.entries(groceriesByMeals).map(([meal, items]) => {
          if (items.length === 0) return null
          const grouped = groupGroceries(items)
          return (
            <div key={meal} className="space-y-4">
              <h3 className="text-base font-black uppercase tracking-tighter border-b-2 border-primary pb-1">
                {mealLabels[meal]}
              </h3>
              {renderGroceryList(grouped.proteins, "Proteins", true)}
              {renderGroceryList(grouped.vegetables, "Vegetables", true)}
              {renderGroceryList(grouped.pantry, "Pantry", true)}
            </div>
          )
        })}
      </div>
    )
  }

  const toggleDayCollapse = (day: string) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(day)) {
        newSet.delete(day)
      } else {
        newSet.add(day)
      }
      return newSet
    })
  }

  const renderByDays = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    return (
      <div className="space-y-6">
        {days.map((day) => {
          const items = groceriesByDays[day] || []
          if (items.length === 0) return null
          const grouped = groupGroceries(items)
          const isCollapsed = collapsedDays.has(day)
          return (
            <div key={day} className="space-y-4">
              <button
                onClick={() => toggleDayCollapse(day)}
                className="w-full flex items-center justify-between text-base font-black uppercase tracking-tighter border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity"
              >
                <span>{day}</span>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              {!isCollapsed && (
                <>
                  {renderGroceryList(grouped.proteins, "Proteins", true)}
                  {renderGroceryList(grouped.vegetables, "Vegetables", true)}
                  {renderGroceryList(grouped.pantry, "Pantry", true)}
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-2">
        Grocery List
      </h2>
      <p className="text-[9px] text-muted-foreground italic">
        Just ensure these items are there in the kitchen / fridge / pantry ~ and you're good to go for the week
      </p>

      {/* Configuration Section */}
      <Card className="p-4 shadow-none">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={groupingMode === "category" ? "default" : "outline"}
              onClick={() => setGroupingMode("category")}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              aria-pressed={groupingMode === "category"}
              aria-label="Group by category"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-tight">
                Category
              </span>
            </Button>
            <Button
              variant={groupingMode === "meals" ? "default" : "outline"}
              onClick={() => setGroupingMode("meals")}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              aria-pressed={groupingMode === "meals"}
              aria-label="Group by meals"
            >
              <Utensils className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-tight">
                Meals
              </span>
            </Button>
            <Button
              variant={groupingMode === "days" ? "default" : "outline"}
              onClick={() => setGroupingMode("days")}
              className="flex-1 flex flex-col items-center justify-center gap-1 p-5"
              aria-pressed={groupingMode === "days"}
              aria-label="Group by days"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-tight">
                Days
              </span>
            </Button>
          </div>
          <Button
            onClick={handleCopyUnchecked}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <span className="flex items-center justify-center gap-2">
              <Image
                src="/swiggy-logo-color.svg"
                alt="Swiggy Instamart"
                width={18}
                height={18}
                className="shrink-0"
              />
              <span className="inline-flex items-center gap-1">
                {/* <Copy className="h-4 w-4" /> */}
                <span>Copy for Instamart</span>
              </span>
            </span>
          </Button>
        </div>
      </Card>

      {/* Groceries List */}
      <Card className="p-6 border-2 border-primary shadow-none">
        <div className="space-y-6">
          {groceries.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground font-bold uppercase text-xs tracking-widest">
              No ingredients in weekly plan
            </p>
          ) : groupingMode === "category" ? (
            <>
              {renderGroceryList(grouped.proteins, "Proteins", false)}
              {renderGroceryList(grouped.vegetables, "Vegetables", false)}
              {renderGroceryList(grouped.pantry, "Pantry", false)}
            </>
          ) : groupingMode === "meals" ? (
            renderByMeals()
          ) : (
            renderByDays()
          )}
        </div>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest">
        Quantities aggregated across all weekly meals
      </p>
    </div>
  )
}
