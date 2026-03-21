"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DishDetailDialog } from "./dish-detail-dialog"
import { getMealColorClasses, getMealTextColorClasses } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Copy, Grid3x3, ChevronLeft, ChevronRight } from "lucide-react"

export function TodayView({ state }: { state: DietOSState }) {
  const [selectedDish, setSelectedDish] = useState<typeof state.dishes[0] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [groupByMeal, setGroupByMeal] = useState(false)
  const { toast } = useToast()

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  // Calculate current week's Monday
  const getCurrentWeekMonday = () => {
    const now = new Date()
    const currentDay = now.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysToMonday = currentDay === 0 ? 1 : currentDay === 1 ? 0 : -(currentDay - 1)
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Get today's day index (0-6)
  const todayIndex = new Date().getDay()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)

  // Get the selected day name
  const selectedDayName = days[selectedDayIndex]
  const plan = state.weeklyPlan[selectedDayName]

  // Calculate the actual date for the selected day
  const getSelectedDate = () => {
    const weekMonday = getCurrentWeekMonday()
    const selectedDate = new Date(weekMonday)
    // Convert day index: Sunday=0, Monday=1, etc. to offset from Monday
    const offset = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1
    selectedDate.setDate(weekMonday.getDate() + offset)
    return selectedDate
  }

  const selectedDate = getSelectedDate()

  // Format date as "01 JAN 2026"
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0")
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Navigation functions
  const handlePreviousDay = () => {
    setSelectedDayIndex((prev) => (prev === 0 ? 6 : prev - 1))
  }

  const handleNextDay = () => {
    setSelectedDayIndex((prev) => (prev === 6 ? 0 : prev + 1))
  }

  const meals = useMemo(() => {
    if (!plan) return []
    return [
      { type: "Breakfast", time: state.settings.defaultMealTimes.breakfast, id: plan.breakfast },
      { type: "Lunch", time: state.settings.defaultMealTimes.lunch, id: plan.lunch },
      { type: "Snack", time: state.settings.defaultMealTimes.snack, id: plan.snack },
      { type: "Dinner", time: state.settings.defaultMealTimes.dinner, id: plan.dinner },
    ]
  }, [plan, state.settings.defaultMealTimes])

  // Get all unique ingredients for today's meals
  const groceryItems = useMemo(() => {
    const ingredientSet = new Set<string>()
    meals.forEach((m) => {
      const dish = state.dishes.find((d) => d.id === m.id)
      if (dish) {
        dish.ingredients.forEach((ing) => {
          // Normalize ingredient name (remove quantities for deduplication)
          // Keep the original format but use it as the key
          ingredientSet.add(ing)
        })
      }
    })
    // Convert to sorted array
    return Array.from(ingredientSet).sort()
  }, [meals, state.dishes])

  // Group groceries by meal
  const groceriesByMeal = useMemo(() => {
    const grouped: { [key: string]: string[] } = {}
    meals.forEach((m) => {
      const dish = state.dishes.find((d) => d.id === m.id)
      if (dish) {
        if (!grouped[m.type]) {
          grouped[m.type] = []
        }
        dish.ingredients.forEach((ing) => {
          if (!grouped[m.type].includes(ing)) {
            grouped[m.type].push(ing)
          }
        })
      }
    })
    // Sort items within each meal
    Object.keys(grouped).forEach((meal) => {
      grouped[meal].sort()
    })
    return grouped
  }, [meals, state.dishes])

  // Calculate nutrition totals for today
  const nutritionTotals = useMemo(() => {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

    meals.forEach((m) => {
      const dish = state.dishes.find((d) => d.id === m.id)
      if (dish) {
        totalCalories += dish.calories
        totalProtein += dish.protein
        totalCarbs += dish.carbs
        totalFat += dish.fat
      }
    })

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
    }
  }, [meals, state.dishes])

  // Calculate total prep time for today
  const totalPrepTime = useMemo(() => {
    return meals.reduce((total, m) => {
      const dish = state.dishes.find((d) => d.id === m.id)
      return total + (dish?.prepTime || 0)
    }, 0)
  }, [meals, state.dishes])

  const mealsWithDishes = useMemo(
    () =>
      meals
        .map((m) => {
          const dish = state.dishes.find((d) => d.id === m.id)
          if (!dish) return null
          return { ...m, dish }
        })
        .filter(
          (item): item is { type: string; time: string; id: string; dish: (typeof state.dishes)[0] } =>
            item !== null
        ),
    [meals, state.dishes]
  )

  const renderMacroByMeal = (
    label: string,
    unit: string,
    total: number,
    getValue: (dish: (typeof state.dishes)[0]) => number
  ) => {
    if (total <= 0 || mealsWithDishes.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>{label}</span>
          <span>
            {total} {unit}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          {mealsWithDishes.map((item) => {
            const value = getValue(item.dish)
            if (value <= 0 || total === 0) return null
            const share = (value / total) * 100
            return (
              <div
                key={item.type}
                className={getMealColorClasses(item.type.toLowerCase())}
                style={{ width: `${share}%` }}
              />
            )
          })}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {mealsWithDishes.map((item) => {
            const value = getValue(item.dish)
            if (value <= 0 || total === 0) return null
            const sharePercent = Math.round((value / total) * 100)
            return (
              <div key={item.type} className="flex flex-col">
                <span
                  className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${getMealTextColorClasses(
                    item.type.toLowerCase()
                  )}`}
                >
                  {item.type}
                </span>
                <span className="text-xs font-black">
                  {value} {unit}
                </span>
                <span className="text-[8px] font-bold text-muted-foreground">{sharePercent}%</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const handleCardClick = (dish: typeof state.dishes[0]) => {
    setSelectedDish(dish)
    setDialogOpen(true)
  }

  const handleCheckboxChange = (item: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(item)
      } else {
        newSet.delete(item)
      }
      return newSet
    })
  }

  const handleCopyRemaining = async () => {
    const remainingItems = groceryItems.filter((item) => !checkedItems.has(item))
    if (remainingItems.length === 0) {
      toast({
        title: "No items to copy",
        description: "All items are already checked.",
        variant: "default",
      })
      return
    }
    const textToCopy = remainingItems.join(", ")
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: "Copied to clipboard",
        description: `${remainingItems.length} item(s) copied.`,
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShareWhatsApp = () => {
    const dateStr = formatDate(selectedDate)
    const mealLines = meals
      .map((m) => {
        const dish = state.dishes.find((d) => d.id === m.id)
        if (!dish) return null
        return `${m.type.toUpperCase()} ${m.time}: ${dish.name}`
      })
      .filter((line) => line !== null)

    const message = `Daily Meal Update - ${dateStr}\n\n${mealLines.join("\n")}`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    
    window.open(whatsappUrl, "_blank")
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">{selectedDayName}</h2>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handlePreviousDay}
                title="Previous day"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNextDay}
                title="Next day"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{formatDate(selectedDate)}</span>
          </div>
        </div>

        <div className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
          Estimated total time in kitchen: <span className="text-foreground">{totalPrepTime}m</span>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleShareWhatsApp}
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share meal update with da bois
          </Button>
        </div>

        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border-2 border-primary/10">
            <TabsTrigger value="meals" className="text-xs">Meals</TabsTrigger>
            <TabsTrigger value="groceries" className="text-xs">Groceries</TabsTrigger>
            <TabsTrigger value="nutrition" className="text-xs">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="mt-4">
            <div className="space-y-4">
              {meals.map((m) => {
                const dish = state.dishes.find((d) => d.id === m.id)
                if (!dish) return null

                return (
                  <Card
                    key={m.type}
                    onClick={() => handleCardClick(dish)}
                    className="p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex">
                      <div className={`w-20 flex flex-col items-center justify-center border-r py-4 ${getMealColorClasses(m.type.toLowerCase())}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${getMealTextColorClasses(m.type.toLowerCase())}`}>
                          {m.type}
                        </span>
                        <span className={`text-sm font-black ${getMealTextColorClasses(m.type.toLowerCase())}`}>{m.time}</span>
                      </div>
                      <div className="flex-1 p-4">
                        <h3 className="font-bold text-lg leading-tight mb-2 uppercase tracking-tight">{dish.name}</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Time</span>
                            <span className="text-xs font-bold">{dish.prepTime}m</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cals</span>
                            <span className="text-xs font-bold">{dish.calories}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              Protein
                            </span>
                            <span className="text-xs font-bold">{dish.protein}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="groceries" className="mt-4">
            {groceryItems.length > 0 ? (
              <Card className="p-4 border-2 border-primary/10">
                <div className="mb-4 border-b-2 border-primary pb-2">
                  <h3 className="text-lg font-black uppercase tracking-tighter">Grocery Checklist</h3>
                </div>
                <div className="flex flex-col gap-3 pb-4 border-b border-border mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={!groupByMeal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGroupByMeal(false)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 h-12 py-2"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-tight">
                        Flat
                      </span>
                    </Button>
                    <Button
                      variant={groupByMeal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGroupByMeal(true)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 h-12 py-2"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-tight">
                        By Meal
                      </span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleCopyRemaining}
                    variant="outline"
                    size="sm"
                    className="w-full h-12 py-2"
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
                        <span>Copy for Instamart</span>
                      </span>
                    </span>
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {groupByMeal ? (
                    // Grouped by meal view
                    meals.map((m) => {
                      const mealItems = groceriesByMeal[m.type] || []
                      if (mealItems.length === 0) return null
                      return (
                        <div key={m.type} className="mb-4 last:mb-0">
                          <div className={`mb-2 px-3 py-2 border-l-4 ${getMealColorClasses(m.type.toLowerCase())}`}>
                            <h4 className={`text-sm font-black uppercase tracking-tight ${getMealTextColorClasses(m.type.toLowerCase())}`}>
                              {m.type}
                            </h4>
                          </div>
                          <div className="space-y-1 ml-2">
                            {mealItems.map((item) => (
                              <div
                                key={`${m.type}-${item}`}
                                className="flex items-center space-x-3 py-2 border-b border-border last:border-0"
                              >
                                <Checkbox
                                  id={`${m.type}-${item}`}
                                  checked={checkedItems.has(item)}
                                  onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                                  className="h-5 w-5 border-2 rounded-none"
                                />
                                <label
                                  htmlFor={`${m.type}-${item}`}
                                  className={`flex-1 text-sm font-bold uppercase tracking-tight cursor-pointer ${
                                    checkedItems.has(item) ? "line-through text-muted-foreground" : ""
                                  }`}
                                >
                                  {item}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    // Flat list view
                    groceryItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center space-x-3 py-2 border-b border-border last:border-0"
                      >
                        <Checkbox
                          id={item}
                          checked={checkedItems.has(item)}
                          onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                          className="h-5 w-5 border-2 rounded-none"
                        />
                        <label
                          htmlFor={item}
                          className={`flex-1 text-sm font-bold uppercase tracking-tight cursor-pointer ${
                            checkedItems.has(item) ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 border-2 border-primary/10">
                <p className="text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">
                  No groceries needed for today
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="mt-4">
            <Card className="p-6 border-2 border-primary/10">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-6 border-b-2 border-primary pb-2">
                Daily Nutrition Summary
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col p-4 border-2 border-primary/10 bg-muted/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Calories
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{nutritionTotals.calories}</span>
                      <span className="text-xs font-bold text-muted-foreground">kcal</span>
                    </div>
                    {state.settings.targets.calories > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Target: {state.settings.targets.calories} kcal
                        </span>
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min((nutritionTotals.calories / state.settings.targets.calories) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col p-4 border-2 border-primary/10 bg-muted/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Protein
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{nutritionTotals.protein}</span>
                      <span className="text-xs font-bold text-muted-foreground">g</span>
                    </div>
                    {state.settings.targets.protein > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Target: {state.settings.targets.protein} g
                        </span>
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min((nutritionTotals.protein / state.settings.targets.protein) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col p-4 border-2 border-primary/10 bg-muted/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Carbs
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{nutritionTotals.carbs}</span>
                      <span className="text-xs font-bold text-muted-foreground">g</span>
                    </div>
                  </div>

                  <div className="flex flex-col p-4 border-2 border-primary/10 bg-muted/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Fat
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{nutritionTotals.fat}</span>
                      <span className="text-xs font-bold text-muted-foreground">g</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Meal-wise breakdown
                    </h4>
                    {renderMacroByMeal("Calories by meal", "kcal", nutritionTotals.calories, (dish) => dish.calories)}
                    {renderMacroByMeal("Protein by meal", "g", nutritionTotals.protein, (dish) => dish.protein)}
                    {renderMacroByMeal("Carbs by meal", "g", nutritionTotals.carbs, (dish) => dish.carbs)}
                    {renderMacroByMeal("Fat by meal", "g", nutritionTotals.fat, (dish) => dish.fat)}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DishDetailDialog dish={selectedDish} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
