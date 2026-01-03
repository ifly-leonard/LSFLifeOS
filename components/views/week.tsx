"use client"

import { useState } from "react"
import type { DietOSState, WeeklyPlan } from "@/lib/dietos-state"
import { randomizeWeeklyPlan } from "@/lib/weekly-plan-randomizer"
import { ChevronDown, ChevronUp, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getMealTextColorClasses } from "@/lib/utils"

export function WeekView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [expandedDay, setExpandedDay] = useState<string | null>(
    days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  )
  const { toast } = useToast()

  const handleSwap = (day: string, slot: keyof WeeklyPlan[string], newDishId: string) => {
    const newDish = state.dishes.find((d) => d.id === newDishId)
    if (!newDish) return

    // Prevent selecting disabled dishes
    if (newDish.disabled) {
      toast({
        title: "Cannot Select",
        description: "This dish is disabled and cannot be selected.",
        variant: "destructive",
      })
      return
    }

    // Guardrail Logic
    const currentDayPlan = state.weeklyPlan[day]
    const otherDishIdsInDay = Object.entries(currentDayPlan)
      .filter(([key]) => key !== slot)
      .map(([_, id]) => id)

    const otherDishesInDay = state.dishes.filter((d) => otherDishIdsInDay.includes(d.id))

    // Rule: Max 1 carb-heavy dish/day
    if (newDish.tags.includes("carb-heavy") && otherDishesInDay.some((d) => d.tags.includes("carb-heavy"))) {
      toast({
        title: "Guardrail Violation",
        description: "Max 1 carb-heavy dish allowed per day.",
        variant: "destructive",
      })
      return
    }

    // Rule: Max 1 rich-protein dish/day (per prompt constraint)
    if (newDish.tags.includes("rich-protein") && otherDishesInDay.some((d) => d.tags.includes("rich-protein"))) {
      toast({
        title: "Guardrail Violation",
        description: "Max 1 rich-protein dish allowed per day.",
        variant: "destructive",
      })
      return
    }

    // Rule: Dinner must be low-carb or light if lunch is carb-heavy
    if (slot === "dinner") {
      const lunchDishId = currentDayPlan.lunch
      const lunchDish = state.dishes.find((d) => d.id === lunchDishId)
      if (lunchDish && lunchDish.tags.includes("carb-heavy")) {
        if (!newDish.tags.includes("low-carb") && !newDish.tags.includes("light")) {
          toast({
            title: "Guardrail Violation",
            description: "Dinner must be low-carb or light when lunch is carb-heavy.",
            variant: "destructive",
          })
          return
        }
      }
    }

    // Rule: Snack must have a protein tag
    if (slot === "snack") {
      const hasProteinTag = newDish.tags.some((tag) => tag.toLowerCase().includes("protein"))
      if (!hasProteinTag) {
        toast({
          title: "Guardrail Violation",
          description: "Snack must have a protein tag.",
          variant: "destructive",
        })
        return
      }
    }

    const newState = {
      ...state,
      weeklyPlan: {
        ...state.weeklyPlan,
        [day]: {
          ...state.weeklyPlan[day],
          [slot]: newDishId,
        },
      },
    }
    updateState(newState)
  }

  const handleRandomize = () => {
    try {
      // Check if we have enough enabled dishes for each meal type
      const breakfastCount = state.dishes.filter((d) => d.meal === "breakfast" && !d.disabled).length
      const lunchCount = state.dishes.filter((d) => d.meal === "lunch" && !d.disabled).length
      const snackCount = state.dishes.filter((d) => d.meal === "snack" && !d.disabled).length
      const dinnerCount = state.dishes.filter((d) => d.meal === "dinner" && !d.disabled).length

      if (breakfastCount === 0 || lunchCount === 0 || snackCount === 0 || dinnerCount === 0) {
        toast({
          title: "Cannot Randomize",
          description: "Missing dishes for one or more meal types. Please add dishes first.",
          variant: "destructive",
        })
        return
      }

      const newPlan = randomizeWeeklyPlan(state)
      
      // Check if randomization was successful (at least some days changed)
      const daysChanged = Object.keys(newPlan).some(
        (day) => JSON.stringify(newPlan[day]) !== JSON.stringify(state.weeklyPlan[day])
      )

      const newState = {
        ...state,
        weeklyPlan: newPlan,
      }
      updateState(newState)

      if (!daysChanged) {
        toast({
          title: "Randomization Warning",
          description: "Unable to generate new combinations. Plan may be constrained by available dishes.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Plan Randomized",
          description: "Weekly plan has been randomized while respecting all guardrails.",
        })
      }
    } catch (error) {
      toast({
        title: "Randomization Failed",
        description: error instanceof Error ? error.message : "Failed to randomize weekly plan",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Weekly Plan</h2>
        <Button
          variant="ghost"
          className="font-bold uppercase text-[10px] border border-border h-8 px-3"
          onClick={handleRandomize}
        >
          <Shuffle size={14} className="mr-2" />
          Randomize
        </Button>
      </div>
      <div className="space-y-2">
        {days.map((day) => (
          <div key={day} className="border-b border-border last:border-0">
            <button
              onClick={() => setExpandedDay(expandedDay === day ? null : day)}
              className="w-full py-4 flex justify-between items-center group"
            >
              <span
                className={
                  expandedDay === day ? "text-lg font-black uppercase" : "text-lg font-bold uppercase opacity-50"
                }
              >
                {day}
              </span>
              {expandedDay === day ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} className="opacity-30 group-hover:opacity-100" />
              )}
            </button>

            {expandedDay === day && (
              <div className="pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                {["breakfast", "lunch", "snack", "dinner"].map((slot) => (
                  <div key={slot} className="flex items-center gap-4">
                    <div className="w-20">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getMealTextColorClasses(slot)}`}>
                        {slot}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={state.weeklyPlan[day][slot as keyof WeeklyPlan[string]]}
                        onValueChange={(val) => handleSwap(day, slot as keyof WeeklyPlan[string], val)}
                      >
                        <SelectTrigger className="h-10 border-2 font-bold uppercase text-[11px] tracking-tight">
                          <SelectValue placeholder="Select dish" />
                        </SelectTrigger>
                        <SelectContent>
                          {state.dishes
                            .filter((d) => d.meal === slot && !d.disabled)
                            .map((dish) => (
                              <SelectItem key={dish.id} value={dish.id} className="font-bold uppercase text-[11px]">
                                {dish.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
