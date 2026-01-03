import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Flame, UtensilsCrossed } from "lucide-react"

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
            <Dialog key={m.type}>
              <DialogTrigger asChild>
                <Card className="p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98]">
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
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Time
                          </span>
                          <span className="text-xs font-bold">{dish.prepTime}m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Cals
                          </span>
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
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-[400px] h-[80vh] flex flex-col p-0 overflow-hidden border-2 border-primary rounded-none">
                <DialogHeader className="p-6 border-b-2 border-primary bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 border border-primary">
                      {m.type} @ {m.time}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {dish.name}
                  </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                    {/* Nutrition Info */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Flame size={12} /> Nutrients
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Cals", val: dish.calories },
                          { label: "Prot", val: `${dish.protein}g` },
                          { label: "Carb", val: `${dish.carbs}g` },
                          { label: "Fat", val: `${dish.fat}g` },
                        ].map((n) => (
                          <div key={n.label} className="bg-muted p-2 border border-border flex flex-col items-center">
                            <span className="text-[8px] font-bold uppercase text-muted-foreground">{n.label}</span>
                            <span className="text-xs font-black">{n.val ?? "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Grocery Checklist / Ingredients */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 size={12} /> Grocery Checklist
                      </h4>
                      <div className="space-y-2">
                        {dish.ingredients && dish.ingredients.length > 0 ? (
                          dish.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 border border-border bg-white">
                              <div className="w-4 h-4 border-2 border-primary/20" />
                              <span className="text-xs font-bold uppercase tracking-tight">{ing}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-bold text-muted-foreground italic uppercase">Data not available</p>
                        )}
                      </div>
                    </section>

                    {/* Recipe / Steps */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <UtensilsCrossed size={12} /> Recipe Instructions
                      </h4>
                      <div className="space-y-4">
                        {dish.steps && dish.steps.length > 0 ? (
                          dish.steps.map((step, i) => (
                            <div key={i} className="flex gap-4">
                              <span className="text-lg font-black text-primary/20 leading-none">
                                {(i + 1).toString().padStart(2, "0")}
                              </span>
                              <p className="text-xs font-bold leading-relaxed uppercase tracking-tight">{step}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-bold text-muted-foreground italic uppercase">Data not available</p>
                        )}
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )
        })}
      </div>
    </div>
  )
}
