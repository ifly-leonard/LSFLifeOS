"use client"

import { useState, useMemo } from "react"
import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DishDetailDialog } from "./dish-detail-dialog"
import { getMealColorClasses, getMealTextColorClasses } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Copy, Grid3x3 } from "lucide-react"

export function TodayView({ state }: { state: DietOSState }) {
  const [selectedDish, setSelectedDish] = useState<typeof state.dishes[0] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [groupByMeal, setGroupByMeal] = useState(false)
  const { toast } = useToast()

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const todayName = days[new Date().getDay()]
  const plan = state.weeklyPlan[todayName]

  const meals = [
    { type: "Breakfast", time: state.settings.defaultMealTimes.breakfast, id: plan.breakfast },
    { type: "Lunch", time: state.settings.defaultMealTimes.lunch, id: plan.lunch },
    { type: "Snack", time: state.settings.defaultMealTimes.snack, id: plan.snack },
    { type: "Dinner", time: state.settings.defaultMealTimes.dinner, id: plan.dinner },
  ]

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">{todayName}</h2>
          <span className="text-xs font-bold text-muted-foreground uppercase">{new Date().toLocaleDateString()}</span>
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
                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => setGroupByMeal(!groupByMeal)}
                    variant={groupByMeal ? "default" : "outline"}
                    size="sm"
                    className="font-bold uppercase text-[10px] tracking-widest"
                  >
                    <Grid3x3 size={14} className="mr-2" />
                    Group by meal
                  </Button>
                  <Button
                    onClick={handleCopyRemaining}
                    variant="outline"
                    size="sm"
                    className="font-bold uppercase text-[10px] tracking-widest"
                  >
                    <Copy size={14} className="mr-2" />
                    Copy
                  </Button>
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
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {meals.map((m) => {
                      const dish = state.dishes.find((d) => d.id === m.id)
                      if (!dish) return null
                      return (
                        <div key={m.type} className="flex flex-col">
                          <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${getMealTextColorClasses(m.type.toLowerCase())}`}>
                            {m.type}
                          </span>
                          <span className="text-xs font-black">{dish.calories}</span>
                          <span className="text-[8px] font-bold text-muted-foreground">kcal</span>
                        </div>
                      )
                    })}
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
