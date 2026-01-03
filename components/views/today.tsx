import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"

export function TodayView({ state }: { state: DietOSState }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const todayName = days[new Date().getDay()]
  const plan = state.weeklyPlan[todayName]

  const meals = [
    { type: "Breakfast", time: state.settings.defaultMealTimes.breakfast, id: plan.breakfast },
    { type: "Lunch", time: state.settings.defaultMealTimes.lunch, id: plan.lunch },
    { type: "Snack", time: state.settings.defaultMealTimes.snack, id: plan.snack },
    { type: "Dinner", time: state.settings.defaultMealTimes.dinner, id: plan.dinner },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">{todayName}</h2>
        <span className="text-xs font-bold text-muted-foreground uppercase">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="space-y-4">
        {meals.map((m) => {
          const dish = state.dishes.find((d) => d.id === m.id)
          if (!dish) return null

          return (
            <Card
              key={m.type}
              className="p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-colors"
            >
              <div className="flex">
                <div className="w-16 bg-muted flex flex-col items-center justify-center border-r border-border py-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    {m.type}
                  </span>
                  <span className="text-sm font-black">{m.time}</span>
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
    </div>
  )
}
