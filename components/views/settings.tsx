"use client"

import { useState, useRef } from "react"
import type { LifeOSState } from "@/lib/lifeos-state"
import { validateLifeOSState } from "@/lib/validation"
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


export function SettingsView({ state, updateState }: { state: LifeOSState; updateState: (s: LifeOSState) => void }) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<"overwrite" | "merge" | null>(null)
  const [pendingImport, setPendingImport] = useState<LifeOSState | null>(null)
  const [showRawJSON, setShowRawJSON] = useState(false)
  const [rawJSONText, setRawJSONText] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingJSONState, setPendingJSONState] = useState<LifeOSState | null>(null)
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
    downloadAnchorNode.setAttribute("download", `lifeos_state_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
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
      "PRODID:-//LifeOS//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const now = new Date()
    const exportTimestamp = new Date().toISOString()
    const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    
    // Get current date in browser's local timezone
    // JavaScript Date objects automatically use the browser's timezone
    const currentDay = now.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Calculate Monday of current week
    // If Sunday (0), use next Monday. Otherwise, go back to this week's Monday
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
      // Store date components to prevent any mutation issues
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
      // This prevents any potential mutation issues
      const targetYearValue = targetDate.getFullYear()
      const targetMonthValue = targetDate.getMonth()
      const targetDateValue = targetDate.getDate()
      
      // Debug: Log the stored components
      console.log(`[Export] ${day}: Stored date components - Year: ${targetYearValue}, Month: ${targetMonthValue + 1}, Date: ${targetDateValue}`)

      // Process each meal for this day in explicit order to ensure consistency
      // Use explicit meal order instead of Object.entries to guarantee order
      const mealOrder: Array<keyof typeof plan> = ["breakfast", "lunch", "snack", "dinner"]
      
      mealOrder.forEach((mealType) => {
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
        // Create a fresh Date object each time to prevent any mutation
        // IMPORTANT: Use the stored components directly, don't reference targetDate
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
        
        // Convert to UTC for ICS format (ICS requires UTC times)
        // toISOString() automatically converts to UTC
        const utcDateStr = eventDate.toISOString()
        const start = utcDateStr.replace(/[-:]/g, "").split(".")[0] + "Z"
        
        // Validate the ICS date format
        const datePart = start.substring(0, 8)
        const expectedDatePart = `${targetYearValue}${String(targetMonthValue + 1).padStart(2, "0")}${String(targetDateValue).padStart(2, "0")}`
        if (datePart !== expectedDatePart) {
          console.error(`[Export] ${day} ${mealType}: ICS date mismatch! Expected ${expectedDatePart}, got ${datePart}`)
          console.error(`  Full ICS: ${start}`)
          console.error(`  Event date: ${eventDate.toLocaleString()}`)
          console.error(`  Components: Year=${targetYearValue}, Month=${targetMonthValue + 1}, Date=${targetDateValue}, Hours=${hours}, Minutes=${minutes}`)
        }
        
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
          `Exported from LifeOS v${state.meta.version}`,
          `Export Date: ${exportTimestamp}`,
        ]

        const description = descriptionParts.filter((part) => part !== "").join("\\n")
        
        // Generate unique ID for this event
        const uid = `lifeos-${day.toLowerCase()}-${mealType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`

        icsContent.push("BEGIN:VEVENT")
        icsContent.push(`UID:${uid}`)
        icsContent.push(`DTSTAMP:${dtstamp}`)
        icsContent.push(`SUMMARY:[${mealType.toUpperCase()}] ${dish.name} (${dish.prepTime} min)`)
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
    const filename = `lifeos_plan_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.ics`

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
    // Allow typing freely - update state immediately for better UX
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

  const handleMealTimeBlur = (meal: keyof typeof state.settings.defaultMealTimes, value: string) => {
    // Validate on blur (when user finishes editing)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(value)) {
      toast({
        title: "Invalid Time Format",
        description: "Please use HH:MM format with hours 00-23 and minutes 00-59 (e.g., 08:00, 20:00)",
        variant: "destructive",
      })
      // Reset to previous valid value or default
      const defaultTimes: Record<string, string> = {
        breakfast: "08:00",
        lunch: "13:00",
        snack: "16:00",
        dinner: "20:00",
      }
      updateState({
        ...state,
        settings: {
          ...state.settings,
          defaultMealTimes: {
            ...state.settings.defaultMealTimes,
            [meal]: defaultTimes[meal] || "00:00",
          },
        },
      })
      return
    }
    
    // Additional validation: parse and verify the values are within valid ranges
    const [hours, minutes] = value.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      toast({
        title: "Invalid Time Range",
        description: `Hours must be 0-23 and minutes must be 0-59. You entered ${hours}:${minutes}`,
        variant: "destructive",
      })
      // Reset to previous valid value or default
      const defaultTimes: Record<string, string> = {
        breakfast: "08:00",
        lunch: "13:00",
        snack: "16:00",
        dinner: "20:00",
      }
      updateState({
        ...state,
        settings: {
          ...state.settings,
          defaultMealTimes: {
            ...state.settings.defaultMealTimes,
            [meal]: defaultTimes[meal] || "00:00",
          },
        },
      })
      return
    }
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
      const validation = validateLifeOSState(parsed)
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
      const mergedState: LifeOSState = {
        ...state,
        dishes: [...state.dishes, ...pendingImport.dishes.filter((d) => !state.dishes.some((sd) => sd.id === d.id))],
        ingredientsIndex: [
          ...new Set([...state.ingredientsIndex, ...pendingImport.ingredientsIndex]),
        ],
        settings: {
          ...state.settings,
          defaultMealTimes: pendingImport.settings.defaultMealTimes,
          timezone: pendingImport.settings.timezone || state.settings.timezone || "Asia/Kolkata",
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
          <p className="text-[9px] text-muted-foreground italic">
            This time is when the events will be added to your Google Calendar
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-2 ${getMealTextColorClasses("breakfast")}`}>Breakfast</label>
              <Input
                type="text"
                value={state.settings.defaultMealTimes.breakfast}
                onChange={(e) => handleMealTimeChange("breakfast", e.target.value)}
                onBlur={(e) => handleMealTimeBlur("breakfast", e.target.value)}
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
                onBlur={(e) => handleMealTimeBlur("lunch", e.target.value)}
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
                onBlur={(e) => handleMealTimeBlur("snack", e.target.value)}
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
                onBlur={(e) => handleMealTimeBlur("dinner", e.target.value)}
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
          <p className="text-[9px] text-muted-foreground italic">
            Just ensure your meals are within this calorie budget
          </p>
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
                    const validation = validateLifeOSState(parsed)
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
