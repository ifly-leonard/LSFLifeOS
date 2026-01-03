"use client"

import { useState, useRef } from "react"
import type { DietOSState } from "@/lib/dietos-state"
import { validateDietOSState } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getMealTextColorClasses } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Helper function to convert local time in a timezone to UTC
function convertToUTC(localDate: Date, timezone: string): Date {
  // Get the time string in the target timezone
  const year = localDate.getFullYear()
  const month = localDate.getMonth()
  const date = localDate.getDate()
  const hours = localDate.getHours()
  const minutes = localDate.getMinutes()
  
  // Create a date string that represents this time in the target timezone
  // We'll use Intl.DateTimeFormat to get the UTC equivalent
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  
  // Create a date object representing the local time
  const localTimeStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  
  // Use a trick: format the date in UTC, then calculate the difference
  // Actually, simpler: create date in UTC, then use formatter to see what it would be in timezone
  const testDate = new Date(`${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`)
  
  // Get what this UTC time would be in the target timezone
  const parts = formatter.formatToParts(testDate)
  const tzYear = parseInt(parts.find(p => p.type === "year")?.value || "0")
  const tzMonth = parseInt(parts.find(p => p.type === "month")?.value || "0") - 1
  const tzDate = parseInt(parts.find(p => p.type === "day")?.value || "0")
  const tzHours = parseInt(parts.find(p => p.type === "hour")?.value || "0")
  const tzMinutes = parseInt(parts.find(p => p.type === "minute")?.value || "0")
  
  // Calculate offset: if UTC time shows different values in timezone, adjust
  const tzLocalDate = new Date(Date.UTC(tzYear, tzMonth, tzDate, tzHours, tzMinutes))
  const offset = testDate.getTime() - tzLocalDate.getTime()
  
  // Apply offset to get UTC time
  return new Date(testDate.getTime() - offset)
}

// Simpler approach: use the fact that we can create a date and format it
function localTimeToUTC(year: number, month: number, date: number, hours: number, minutes: number, timezone: string): Date {
  // Create a date string in ISO format
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  
  // Create a date assuming it's in UTC
  const utcDate = new Date(dateStr + "Z")
  
  // Get what this UTC time represents in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  
  const tzParts = formatter.formatToParts(utcDate)
  const tzYear = parseInt(tzParts.find(p => p.type === "year")?.value || "0")
  const tzMonth = parseInt(tzParts.find(p => p.type === "month")?.value || "0") - 1
  const tzDate = parseInt(tzParts.find(p => p.type === "day")?.value || "0")
  const tzHours = parseInt(tzParts.find(p => p.type === "hour")?.value || "0")
  const tzMinutes = parseInt(tzParts.find(p => p.type === "minute")?.value || "0")
  
  // Calculate the difference
  const tzAsUTC = new Date(Date.UTC(tzYear, tzMonth, tzDate, tzHours, tzMinutes))
  const offset = utcDate.getTime() - tzAsUTC.getTime()
  
  // The UTC time we want is the original UTC time minus the offset
  return new Date(utcDate.getTime() - offset)
}

export function SettingsView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<"overwrite" | "merge" | null>(null)
  const [pendingImport, setPendingImport] = useState<DietOSState | null>(null)
  const [showRawJSON, setShowRawJSON] = useState(false)
  const [rawJSONText, setRawJSONText] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingJSONState, setPendingJSONState] = useState<DietOSState | null>(null)
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
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `dietos_state_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const exportICS = (selectedDays: string[]) => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DietOS//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const today = new Date()
    const exportTimestamp = new Date().toISOString()
    
    // Find the Monday of the current week (or today if it's Monday)
    // Use local time to determine what day it is for the user
    // getDay() returns 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentDayOfWeek = today.getDay()
    // Calculate days to subtract to get to Monday of current week
    // Sunday (0) -> add 1 to get next Monday
    // Monday (1) -> use today (0 days)
    // Tuesday-Saturday (2-6) -> subtract (dayOfWeek - 1) to get this week's Monday
    let daysToMonday: number
    if (currentDayOfWeek === 0) {
      // Sunday: use next Monday
      daysToMonday = 1
    } else if (currentDayOfWeek === 1) {
      // Monday: use today
      daysToMonday = 0
    } else {
      // Tuesday-Saturday: go back to this week's Monday
      daysToMonday = -(currentDayOfWeek - 1)
    }
    
    // Calculate the Monday of the current week in local time, then convert to UTC
    // This ensures we use the user's local week definition
    const localWeekMonday = new Date(today)
    localWeekMonday.setDate(today.getDate() + daysToMonday)
    localWeekMonday.setHours(0, 0, 0, 0)
    
    // Convert to UTC for ICS file (which uses UTC)
    const weekMonday = new Date(Date.UTC(
      localWeekMonday.getFullYear(),
      localWeekMonday.getMonth(),
      localWeekMonday.getDate(),
      0, 0, 0, 0
    ))
    
    // Validate that weekMonday is actually a Monday (in UTC)
    if (weekMonday.getUTCDay() !== 1) {
      console.error("Date calculation error: weekMonday is not a Monday!", weekMonday)
      toast({
        title: "Export Error",
        description: "Date calculation error. Please try again.",
        variant: "destructive",
      })
      return
    }

<<<<<<< HEAD
    // Process each day in the weekly plan
    Object.keys(state.weeklyPlan).forEach((dayName) => {
      const plan = state.weeklyPlan[dayName]
      const targetDayIndex = daysOrder.indexOf(dayName)
      if (targetDayIndex === -1) return
=======
    selectedDays.forEach((day) => {
      const plan = state.weeklyPlan[day]
      if (!plan) return

      const dayIndex = allDays.indexOf(day)
      if (dayIndex === -1) {
        console.error(`Invalid day: ${day}`)
        return
      }

      // Calculate the target date for this day ONCE, outside the meal loop
      // This ensures all meals for the same day use the same date
      // Use UTC methods to avoid timezone issues
      const targetDate = new Date(Date.UTC(
        weekMonday.getUTCFullYear(),
        weekMonday.getUTCMonth(),
        weekMonday.getUTCDate() + dayIndex,
        0, 0, 0, 0
      ))
      
      // Validate the target date is correct
      const expectedDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1 // Sunday is 0, Monday is 1, etc.
      if (targetDate.getUTCDay() !== expectedDayOfWeek) {
        console.error(`Date calculation error for ${day}: expected day ${expectedDayOfWeek}, got ${targetDate.getUTCDay()}`, targetDate)
        toast({
          title: "Date Calculation Error",
          description: `Error calculating date for ${day}. Please try again.`,
          variant: "destructive",
        })
        return
      }
>>>>>>> 70de6f2 (Add dish disable feature with backward/forward compatibility and fix meal card width)

      Object.entries(plan).forEach(([mealType, dishId]) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (!dish) return

        const mealTime = state.settings.defaultMealTimes[mealType as keyof typeof state.settings.defaultMealTimes]
        const [hours, minutes] = mealTime.split(":").map(Number)

<<<<<<< HEAD
        // Calculate the next occurrence of this day
        const eventDate = new Date(today)
        const currentDayIndex = today.getDay()
        let diff = targetDayIndex - currentDayIndex
        if (diff < 0) diff += 7 // Move to next week if day has passed

        eventDate.setDate(today.getDate() + diff)
        eventDate.setHours(hours, minutes, 0, 0)
=======
        // Use the pre-calculated targetDate and set the time using UTC
        // This prevents any date mutation or timezone issues
        const eventDate = new Date(Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          hours,
          minutes,
          0,
          0
        ))
>>>>>>> 70de6f2 (Add dish disable feature with backward/forward compatibility and fix meal card width)

        const start = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        // Event duration is 1 hour
        const end =
<<<<<<< HEAD
          new Date(eventDate.getTime() + (dish.prepTime || 30) * 60000)
            .toISOString()
            .replace(/[-:]/g, "")
            .split(".")[0] + "Z"

        // Generate a simple unique UID
        const uid = `dietos-${dayName.toLowerCase()}-${mealType.toLowerCase()}-${now}`
=======
          new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

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
>>>>>>> 70de6f2 (Add dish disable feature with backward/forward compatibility and fix meal card width)

        icsContent.push("BEGIN:VEVENT")
        icsContent.push(`UID:${uid}`)
        icsContent.push(`DTSTAMP:${now}`)
        icsContent.push(`SUMMARY:[${mealType.toUpperCase()}] ${dish.name}`)
        icsContent.push(`DTSTART:${start}`)
        icsContent.push(`DTEND:${end}`)
<<<<<<< HEAD
        icsContent.push(
          `DESCRIPTION:Macros: Cals ${dish.calories}, Prot ${dish.protein}g, Carb ${dish.carbs}g, Fat ${dish.fat}g\\n\\nIngredients:\\n- ${dish.ingredients.join("\\n- ")}\\n\\nInstructions:\\n${dish.steps.join(" > ")}`,
        )
=======
        icsContent.push(`DESCRIPTION:${description}`)
>>>>>>> 70de6f2 (Add dish disable feature with backward/forward compatibility and fix meal card width)
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

  const handleMealTimeChange = (meal: keyof typeof state.settings.defaultMealTimes, value: string) => {
    // Validate HH:MM format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(value)) {
      toast({
        title: "Invalid Time Format",
        description: "Please use HH:MM format (e.g., 08:00)",
        variant: "destructive",
      })
      return
    }

    updateState({
      ...state,
      settings: {
        ...state.settings,
        defaultMealTimes: {
          ...state.settings.defaultMealTimes,
          [meal]: value,
        },
      },
    })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      // Validate JSON structure
      const validation = validateDietOSState(parsed)
      if (!validation.valid || !validation.state) {
        throw new Error(validation.error || "Invalid JSON structure")
      }

      setPendingImport(validation.state)
      setImportDialogOpen(true)
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON file",
        variant: "destructive",
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImportConfirm = () => {
    if (!pendingImport || !importMode) return

    if (importMode === "overwrite") {
      updateState(pendingImport)
      toast({
        title: "Import Successful",
        description: "State has been overwritten with imported data",
      })
    } else if (importMode === "merge") {
      // Merge strategy: combine dishes, keep current weekly plan, merge settings
      const mergedState: DietOSState = {
        ...state,
        dishes: [...state.dishes, ...pendingImport.dishes.filter((d) => !state.dishes.some((sd) => sd.id === d.id))],
        ingredientsIndex: [
          ...new Set([...state.ingredientsIndex, ...pendingImport.ingredientsIndex]),
        ],
        settings: {
          ...state.settings,
          defaultMealTimes: pendingImport.settings.defaultMealTimes,
        },
      }
      updateState(mergedState)
      toast({
        title: "Import Successful",
        description: "State has been merged with imported data",
      })
    }

    setImportDialogOpen(false)
    setPendingImport(null)
    setImportMode(null)
  }

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-2">Settings</h2>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Default Meal Times</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-2 ${getMealTextColorClasses("breakfast")}`}>Breakfast</label>
              <Input
                type="text"
                value={state.settings.defaultMealTimes.breakfast}
                onChange={(e) => handleMealTimeChange("breakfast", e.target.value)}
                placeholder="08:00"
                className="h-10 font-bold uppercase"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
            </div>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-2 ${getMealTextColorClasses("lunch")}`}>Lunch</label>
              <Input
                type="text"
                value={state.settings.defaultMealTimes.lunch}
                onChange={(e) => handleMealTimeChange("lunch", e.target.value)}
                placeholder="13:00"
                className="h-10 font-bold uppercase"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
            </div>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-2 ${getMealTextColorClasses("snack")}`}>Snack</label>
              <Input
                type="text"
                value={state.settings.defaultMealTimes.snack}
                onChange={(e) => handleMealTimeChange("snack", e.target.value)}
                placeholder="16:00"
                className="h-10 font-bold uppercase"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
            </div>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-2 ${getMealTextColorClasses("dinner")}`}>Dinner</label>
              <Input
                type="text"
                value={state.settings.defaultMealTimes.dinner}
                onChange={(e) => handleMealTimeChange("dinner", e.target.value)}
                placeholder="20:00"
                className="h-10 font-bold uppercase"
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Targets (Read Only)</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-2 border-primary/20 bg-muted/30">
              <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Cals / Day</span>
              <span className="text-lg font-black">{state.settings.targets.calories}</span>
            </Card>
            <Card className="p-4 border-2 border-primary/20 bg-muted/30">
              <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Protein / Day</span>
              <span className="text-lg font-black">{state.settings.targets.protein}g</span>
            </Card>
          </div>
        </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calendar Integration</h3>
        <Button
          variant="outline"
          className="w-full h-14 border-2 border-primary font-black uppercase tracking-tighter text-md flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all bg-transparent"
          onClick={handleExportClick}
        >
          <Calendar size={20} />
          Export Calendar (.ics)
        </Button>
        <p className="text-[9px] text-muted-foreground text-center font-bold leading-tight uppercase tracking-widest">
          Import the downloaded file into Google Calendar or Apple Calendar to see your meal plan.
        </p>
      </section>

      <section className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Management</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 font-bold uppercase text-[10px] border border-border"
            onClick={exportJSON}
          >
            <Download size={14} className="mr-2" /> Export JSON
          </Button>
          <Button
            variant="ghost"
            className="flex-1 font-bold uppercase text-[10px] border border-border"
            onClick={handleImportClick}
          >
            <Upload size={14} className="mr-2" /> Import JSON
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      <section className="space-y-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Developer Tools</h3>
          <Button
            variant="ghost"
            className="font-bold uppercase text-[10px] border border-border"
            onClick={() => {
              if (!showRawJSON) {
                setRawJSONText(JSON.stringify(state, null, 2))
              }
              setShowRawJSON(!showRawJSON)
            }}
          >
            {showRawJSON ? "Hide" : "Show"} Raw JSON
          </Button>
        </div>
        {showRawJSON && (
          <div className="space-y-2">
            <textarea
              value={rawJSONText}
              onChange={(e) => setRawJSONText(e.target.value)}
              className="w-full h-64 p-3 font-mono text-xs border-2 border-border rounded-md bg-muted/30 focus:border-primary focus:outline-none"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-bold uppercase text-[10px]"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(rawJSONText)

                    // Validate JSON structure
                    const validation = validateDietOSState(parsed)
                    if (!validation.valid || !validation.state) {
                      throw new Error(validation.error || "Invalid JSON structure")
                    }

                    // Show confirmation dialog
                    setPendingJSONState(validation.state)
                    setConfirmDialogOpen(true)
                  } catch (error) {
                    toast({
                      title: "Invalid JSON",
                      description: error instanceof Error ? error.message : "Failed to parse JSON",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Apply Changes
              </Button>
              <Button
                variant="ghost"
                className="font-bold uppercase text-[10px] border border-border"
                onClick={() => {
                  setRawJSONText(JSON.stringify(state, null, 2))
                  toast({
                    title: "Reset",
                    description: "JSON reset to current state",
                  })
                }}
              >
                Reset
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground text-center font-bold uppercase tracking-widest">
              Edit JSON directly. Click "Apply Changes" to save. Invalid JSON will be rejected.
            </p>
          </div>
        )}
      </section>

      <div className="text-center pt-8">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] italic opacity-30">
          Designed for Executive Efficiency
        </p>
      </div>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import JSON</DialogTitle>
            <DialogDescription>
              How would you like to import the data?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant={importMode === "overwrite" ? "default" : "outline"}
              className="w-full"
              onClick={() => setImportMode("overwrite")}
            >
              Overwrite (Replace all current data)
            </Button>
            <Button
              variant={importMode === "merge" ? "default" : "outline"}
              className="w-full"
              onClick={() => setImportMode("merge")}
            >
              Merge (Combine with current data)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={!importMode}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm JSON Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply these changes? This will replace your current data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingJSONState) {
                  updateState(pendingJSONState)
                  toast({
                    title: "JSON Updated",
                    description: "State has been updated from raw JSON",
                  })
                  setConfirmDialogOpen(false)
                  setPendingJSONState(null)
                }
              }}
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
