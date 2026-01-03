"use client"

import { useState } from "react"
import type { DietOSState, WeeklyPlan } from "@/lib/dietos-state"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function WeekView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [expandedDay, setExpandedDay] = useState<string | null>(
    days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  )
  const { toast } = useToast()

  const handleSwap = (day: string, slot: keyof WeeklyPlan[string], newDishId: string) => {
    const newDish = state.dishes.find((d) => d.id === newDishId)
    if (!newDish) return

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-2">Weekly Plan</h2>
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                            .filter((d) => d.meal === slot)
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
