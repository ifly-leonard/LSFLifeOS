"use client"

import { useState } from "react"
import type { DietOSState, WeeklyPlan } from "@/lib/dietos-state"
import { randomizeWeeklyPlan } from "@/lib/weekly-plan-randomizer"
import { ChevronDown, ChevronUp, Shuffle, ArrowUpFromLine, Edit, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getMealTextColorClasses } from "@/lib/utils"

export function WeekView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [expandedDay, setExpandedDay] = useState<string | null>(
    days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1],
  )
  const [isEditMode, setIsEditMode] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ])
  const [eatingOutDays, setEatingOutDays] = useState<Set<string>>(new Set())
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
    if (!isEditMode) return
    
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

  const exportICS = (selectedDays: string[]) => {
    // Validate selected days
    if (selectedDays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day to export",
        variant: "destructive",
      })
      return
    }

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DietOS//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const now = new Date()
    const exportTimestamp = new Date().toISOString()
    const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    
    // Get current date in browser's local timezone
    const currentDay = now.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Calculate Monday of current week
    const daysToMonday = currentDay === 0 ? 1 : currentDay === 1 ? 0 : -(currentDay - 1)
    
    // Create Monday date object in browser timezone
    const weekMonday = new Date(now)
    weekMonday.setDate(now.getDate() + daysToMonday)
    weekMonday.setHours(0, 0, 0, 0)
    
    // Validate: weekMonday should be a Monday
    if (weekMonday.getDay() !== 1) {
      console.error("Date calculation error: weekMonday is not a Monday!", weekMonday)
      toast({
        title: "Export Error",
        description: "Date calculation error. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Process each selected day
    selectedDays.forEach((day) => {
      const plan = state.weeklyPlan[day]
      if (!plan) return

      const dayIndex = allDays.indexOf(day)
      if (dayIndex === -1) {
        console.error(`Invalid day: ${day}`)
        return
      }

      // Calculate the target date for this day ONCE (outside meal loop)
      const targetDate = new Date(weekMonday)
      targetDate.setDate(weekMonday.getDate() + dayIndex)
      targetDate.setHours(0, 0, 0, 0)
      
      // Validate the target date is correct
      const expectedDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1 // Sunday is 0, Monday is 1, etc.
      if (targetDate.getDay() !== expectedDayOfWeek) {
        console.error(`Date calculation error for ${day}: expected day ${expectedDayOfWeek}, got ${targetDate.getDay()}`, targetDate)
        toast({
          title: "Date Calculation Error",
          description: `Error calculating date for ${day}. Please try again.`,
          variant: "destructive",
        })
        return
      }
      
      // Validate date is reasonable (not in 2046 or past)
      const currentYear = now.getFullYear()
      const targetYear = targetDate.getFullYear()
      if (targetYear < currentYear || targetYear > currentYear + 1) {
        console.error(`Date out of range for ${day}: ${targetDate.toISOString()}`)
        toast({
          title: "Date Out of Range",
          description: `Calculated date for ${day} is out of expected range. Please try again.`,
          variant: "destructive",
        })
        return
      }

      // Store immutable date components to ensure all meals use the same date
      const targetYearValue = targetDate.getFullYear()
      const targetMonthValue = targetDate.getMonth()
      const targetDateValue = targetDate.getDate()

      // Check if this day is marked as eating out
      const isEatingOut = eatingOutDays.has(day)
      const budgets = calculateMealBudgets()

      // Process each meal for this day in explicit order
      const mealOrder: Array<keyof typeof plan> = ["breakfast", "lunch", "snack", "dinner"]
      
      mealOrder.forEach((mealType) => {
        // If eating out, export all meals with eating out format
        if (isEatingOut) {
          const mealTime = state.settings.defaultMealTimes[mealType]
          const [hours, minutes] = mealTime.split(":").map(Number)
          
          // Validate meal time before using it
          if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.error(`[Export] ${day} ${mealType}: Invalid meal time "${mealTime}" - hours: ${hours}, minutes: ${minutes}`)
            toast({
              title: "Invalid Meal Time",
              description: `${day} ${mealType} has invalid time "${mealTime}". Hours must be 0-23 and minutes must be 0-59.`,
              variant: "destructive",
            })
            return
          }

          // Create event date in browser's local timezone using stored components
          const eventDate = new Date(targetYearValue, targetMonthValue, targetDateValue, hours, minutes, 0, 0)
          
          // Validate the date is correct before converting
          if (eventDate.getFullYear() !== targetYearValue || 
              eventDate.getMonth() !== targetMonthValue || 
              eventDate.getDate() !== targetDateValue) {
            console.error(`[Export] ${day} ${mealType}: Date mismatch! Expected ${targetYearValue}-${targetMonthValue + 1}-${targetDateValue}, got ${eventDate.getFullYear()}-${eventDate.getMonth() + 1}-${eventDate.getDate()}`)
            toast({
              title: "Date Calculation Error",
              description: `Error calculating date for ${day} ${mealType}. Please try again.`,
              variant: "destructive",
            })
            return
          }
          
          // Convert to UTC for ICS format
          const utcDateStr = eventDate.toISOString()
          const start = utcDateStr.replace(/[-:]/g, "").split(".")[0] + "Z"
          
          // Event duration is 1 hour
          const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000)
          const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

          const mealBudget = budgets[mealType as keyof typeof budgets]
          const description = `Eating out - Calorie budget: ${mealBudget} kcal\\n\\n---\\nExported from DietOS v${state.meta.version}\\nExport Date: ${exportTimestamp}`
          const summary = `[${mealType.toUpperCase()}] Eating out - Calorie budget ${mealBudget} kcal`
          const uid = `dietos-${day.toLowerCase()}-${mealType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`

          icsContent.push("BEGIN:VEVENT")
          icsContent.push(`UID:${uid}`)
          icsContent.push(`DTSTAMP:${dtstamp}`)
          icsContent.push(`SUMMARY:${summary}`)
          icsContent.push(`DTSTART:${start}`)
          icsContent.push(`DTEND:${end}`)
          icsContent.push(`DESCRIPTION:${description}`)
          icsContent.push("END:VEVENT")
          return
        }

        // Normal export (not eating out) - requires a dish
        const dishId = plan[mealType]
        if (!dishId) return
        
        const dish = state.dishes.find((d) => d.id === dishId)
        if (!dish) return

        const mealTime = state.settings.defaultMealTimes[mealType]
        const [hours, minutes] = mealTime.split(":").map(Number)
        
        // Validate meal time before using it
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          console.error(`[Export] ${day} ${mealType}: Invalid meal time "${mealTime}" - hours: ${hours}, minutes: ${minutes}`)
          toast({
            title: "Invalid Meal Time",
            description: `${day} ${mealType} has invalid time "${mealTime}". Hours must be 0-23 and minutes must be 0-59.`,
            variant: "destructive",
          })
          return
        }

        // Create event date in browser's local timezone using stored components
        const eventDate = new Date(targetYearValue, targetMonthValue, targetDateValue, hours, minutes, 0, 0)
        
        // Validate the date is correct before converting
        if (eventDate.getFullYear() !== targetYearValue || 
            eventDate.getMonth() !== targetMonthValue || 
            eventDate.getDate() !== targetDateValue) {
          console.error(`[Export] ${day} ${mealType}: Date mismatch! Expected ${targetYearValue}-${targetMonthValue + 1}-${targetDateValue}, got ${eventDate.getFullYear()}-${eventDate.getMonth() + 1}-${eventDate.getDate()}`)
          toast({
            title: "Date Calculation Error",
            description: `Error calculating date for ${day} ${mealType}. Please try again.`,
            variant: "destructive",
          })
          return
        }
        
        // Convert to UTC for ICS format
        const utcDateStr = eventDate.toISOString()
        const start = utcDateStr.replace(/[-:]/g, "").split(".")[0] + "Z"
        
        // Event duration is 1 hour
        const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000)
        const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

        // Build comprehensive description
        const descriptionParts = [
          `Calories: ${dish.calories}`,
          `Protein: ${dish.protein}g`,
          `Carbs: ${dish.carbs}g`,
          `Fat: ${dish.fat}g`,
          "",
          dish.tags && dish.tags.length > 0 ? `Tags: ${dish.tags.join(", ")}` : "",
          "",
          "Ingredients:",
          ...dish.ingredients.map((ing) => `- ${ing}`),
          "",
          "Steps:",
          ...dish.steps.map((step, idx) => `${idx + 1}. ${step}`),
          "",
          "---",
          `Exported from DietOS v${state.meta.version}`,
          `Export Date: ${exportTimestamp}`,
        ]

        const description = descriptionParts.filter((part) => part !== "").join("\\n")
        
        // Generate unique ID for this event
        const uid = `dietos-${day.toLowerCase()}-${mealType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`

        const summary = `[${mealType.toUpperCase()}] ${dish.name} (${dish.prepTime} min)`

        icsContent.push("BEGIN:VEVENT")
        icsContent.push(`UID:${uid}`)
        icsContent.push(`DTSTAMP:${dtstamp}`)
        icsContent.push(`SUMMARY:${summary}`)
        icsContent.push(`DTSTART:${start}`)
        icsContent.push(`DTEND:${end}`)
        icsContent.push(`DESCRIPTION:${description}`)
        icsContent.push("END:VEVENT")
      })
    })

    icsContent.push("END:VCALENDAR")

    // Generate filename based on export date and time
    const exportDate = new Date()
    const year = exportDate.getFullYear()
    const month = String(exportDate.getMonth() + 1).padStart(2, "0")
    const day = String(exportDate.getDate()).padStart(2, "0")
    const hours = String(exportDate.getHours()).padStart(2, "0")
    const minutes = String(exportDate.getMinutes()).padStart(2, "0")
    const seconds = String(exportDate.getSeconds()).padStart(2, "0")
    const filename = `dietos_plan_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.ics`

    const element = document.createElement("a")
    const file = new Blob([icsContent.join("\r\n")], { type: "text/calendar" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    element.remove()

    setExportDialogOpen(false)
    toast({
      title: "Export Successful",
      description: `Calendar exported for ${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""}`,
    })
  }

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSelectAll = () => {
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    setSelectedDays(allDays)
  }

  const handleDeselectAll = () => {
    setSelectedDays([])
  }

  const handleExportClick = () => {
    setExportDialogOpen(true)
  }

  const handleExportConfirm = () => {
    if (selectedDays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day to export",
        variant: "destructive",
      })
      return
    }
    exportICS(selectedDays)
  }

  // Eating out toggle handler
  const handleEatingOutToggle = (day: string) => {
    setEatingOutDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(day)) {
        newSet.delete(day)
      } else {
        newSet.add(day)
      }
      return newSet
    })
  }

  // Calculate meal budgets based on daily calorie target
  const calculateMealBudgets = () => {
    const dailyCalories = state.settings.targets.calories
    return {
      breakfast: Math.round(dailyCalories * 0.25),
      lunch: Math.round(dailyCalories * 0.35),
      snack: Math.round(dailyCalories * 0.10),
      dinner: Math.round(dailyCalories * 0.30),
    }
  }

  // Generate ChatGPT prompt for a specific meal
  const generateMealPrompt = (mealType: string) => {
    const budgets = calculateMealBudgets()
    const proteinTarget = state.settings.targets.protein
    const mealBudget = budgets[mealType as keyof typeof budgets]
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1)

    return `I'm following a meal plan with specific calorie targets per meal. For ${mealName}, my target is ~${mealBudget} kcal.

Daily protein target: ${proteinTarget}g

Please analyze this restaurant menu image and suggest healthier options for ${mealName} that fit within this calorie budget (~${mealBudget} kcal). Consider:
1. Calorie content per dish
2. Protein content
3. Overall nutritional balance
4. Healthier preparation methods if available

Provide specific recommendations with approximate calorie counts.`
  }

  // Copy meal-specific prompt to clipboard
  const handleCopyMealPrompt = async (mealType: string) => {
    const prompt = generateMealPrompt(mealType)
    try {
      await navigator.clipboard.writeText(prompt)
      toast({
        title: "Copied to clipboard",
        description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} prompt has been copied. Paste it into ChatGPT with your menu image.`,
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
    <div className="space-y-4">
      <div className="border-b-2 border-primary pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Weekly Plan</h2>
        <p className="text-[9px] text-muted-foreground italic mt-1">
          Choose the items, you can randomize, and also individual swap meals. Once done, use the{" "}
          <ArrowUpFromLine size={10} className="inline align-middle mx-0.5" /> button to export this to Google Calendar
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsEditMode(!isEditMode)}
          title="Edit"
        >
          <Edit size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRandomize}
          disabled={!isEditMode}
          title="Randomize"
        >
          <Shuffle size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleExportClick}
          title="Export Calendar"
        >
          <ArrowUpFromLine size={14} />
        </Button>
      </div>
      <div className="space-y-2">
        {days.map((day) => {
          const isEatingOut = eatingOutDays.has(day)
          const budgets = calculateMealBudgets()
          
          return (
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
                  {/* Toggle at the top */}
                  <div className="pb-2 border-b border-border">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`eating-out-${day}`}
                        className="text-[9px] font-bold uppercase tracking-tight cursor-pointer text-muted-foreground"
                      >
                        I am eating out
                      </label>
                      <Switch
                        id={`eating-out-${day}`}
                        checked={isEatingOut}
                        onCheckedChange={() => handleEatingOutToggle(day)}
                        className="w-[34px]"
                      />
                    </div>
                  </div>

                  {["breakfast", "lunch", "snack", "dinner"].map((slot) => (
                    <div key={slot} className="flex items-center gap-4">
                      <div className="w-20">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${getMealTextColorClasses(slot)}`}>
                          {slot}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        {isEatingOut ? (
                          <span className="font-bold uppercase text-[11px] tracking-tight">
                            ~{budgets[slot as keyof typeof budgets]} kcal
                          </span>
                        ) : (
                          <Select
                            value={state.weeklyPlan[day][slot as keyof WeeklyPlan[string]]}
                            onValueChange={(val) => handleSwap(day, slot as keyof WeeklyPlan[string], val)}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger className="h-10 border-2 font-bold uppercase text-[11px] tracking-tight" disabled={!isEditMode}>
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
                        )}
                        {isEatingOut && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-2"
                            onClick={() => handleCopyMealPrompt(slot)}
                            title={`Copy ${slot} prompt`}
                          >
                            <Bot size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Days to Export</DialogTitle>
            <DialogDescription>
              Choose which days from the current week you want to export to your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>
            <div className="space-y-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={selectedDays.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <label
                    htmlFor={day}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportConfirm} disabled={selectedDays.length === 0}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
