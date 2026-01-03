"use client"

import type { DietOSState } from "@/lib/dietos-state"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Upload, Calendar } from "lucide-react"

export function SettingsView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `dietos_state_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const exportICS = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DietOS//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const today = new Date()

    days.forEach((day, index) => {
      const plan = state.weeklyPlan[day]
      Object.entries(plan).forEach(([mealType, dishId]) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (!dish) return

        const mealTime = state.settings.defaultMealTimes[mealType as keyof typeof state.settings.defaultMealTimes]
        const [hours, minutes] = mealTime.split(":").map(Number)

        // Calculate date for the upcoming week's specific day
        const eventDate = new Date(today)
        const currentDay = today.getDay() // 0 is Sun
        const targetDay = (index + 1) % 7 // Monday is 1
        const diff = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay)
        eventDate.setDate(today.getDate() + diff)
        eventDate.setHours(hours, minutes, 0, 0)

        const start = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        const end =
          new Date(eventDate.getTime() + dish.prepTime * 60000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

        icsContent.push("BEGIN:VEVENT")
        icsContent.push(`SUMMARY:[${mealType.toUpperCase()}] ${dish.name} (${dish.prepTime} min)`)
        icsContent.push(`DTSTART:${start}`)
        icsContent.push(`DTEND:${end}`)
        icsContent.push(
          `DESCRIPTION:Calories: ${dish.calories}\\nProtein: ${dish.protein}g\\nIngredients: ${dish.ingredients.join(", ")}\\nSteps: ${dish.steps.join(" > ")}`,
        )
        icsContent.push("END:VEVENT")
      })
    })

    icsContent.push("END:VCALENDAR")

    const element = document.createElement("a")
    const file = new Blob([icsContent.join("\r\n")], { type: "text/calendar" })
    element.href = URL.createObjectURL(file)
    element.download = "dietos_plan.ics"
    document.body.appendChild(element)
    element.click()
    element.remove()
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-2">Settings</h2>

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
          onClick={exportICS}
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
          <Button variant="ghost" className="flex-1 font-bold uppercase text-[10px] border border-border">
            <Upload size={14} className="mr-2" /> Import JSON
          </Button>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] italic opacity-30">
          Designed for Executive Efficiency
        </p>
      </div>
    </div>
  )
}
