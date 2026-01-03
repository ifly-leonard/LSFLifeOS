import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { groupGroceries } from "@/lib/grocery-utils"

export function GroceriesView({ state }: { state: DietOSState }) {
  const getAggregatedGroceries = () => {
    const counts: { [key: string]: number } = {}
    Object.values(state.weeklyPlan).forEach((day) => {
      Object.values(day).forEach((dishId) => {
        const dish = state.dishes.find((d) => d.id === dishId)
        if (dish) {
          dish.ingredients.forEach((ing) => {
            counts[ing] = (counts[ing] || 0) + 1
          })
        }
      })
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }

  const groceries = getAggregatedGroceries()
  const grouped = groupGroceries(groceries)

  const renderGroceryList = (items: { name: string; count: number }[], title: string) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-tighter border-b-2 border-primary pb-1">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center space-x-3 pb-2 border-b border-border last:border-0 last:pb-0"
            >
              <Checkbox id={item.name} className="h-5 w-5 border-2 rounded-none" />
              <label
                htmlFor={item.name}
                className="flex-1 text-xs font-black uppercase tracking-tight leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex justify-between"
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground">x{item.count}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-2">Grocery List</h2>

      <Card className="p-6 border-2 border-primary shadow-none">
        <div className="space-y-6">
          {groceries.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground font-bold uppercase text-xs tracking-widest">
              No ingredients in weekly plan
            </p>
          ) : (
            <>
              {renderGroceryList(grouped.proteins, "Proteins")}
              {renderGroceryList(grouped.vegetables, "Vegetables")}
              {renderGroceryList(grouped.pantry, "Pantry")}
            </>
          )}
        </div>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest">
        Quantities aggregated across all weekly meals
      </p>
    </div>
  )
}
