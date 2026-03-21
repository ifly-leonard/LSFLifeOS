"use client"

import type { Dish } from "@/lib/dietos-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Youtube } from "lucide-react"

interface DishDetailDialogProps {
  dish: Dish | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DishDetailDialog({ dish, open, onOpenChange }: DishDetailDialogProps) {
  if (!dish) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">{dish.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-2 py-1">
              {dish.meal}
            </span>
            {dish.tags.map((tag) => (
              <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-1">
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 border-2 border-primary/20">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Prep Time
                </span>
                <span className="text-lg font-black">{dish.prepTime}m</span>
              </div>
            </Card>
            <Card className="p-4 border-2 border-primary/20">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Calories
                </span>
                <span className="text-lg font-black">{dish.calories}</span>
              </div>
            </Card>
            <Card className="p-4 border-2 border-primary/20">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Protein
                </span>
                <span className="text-lg font-black">{dish.protein}g</span>
              </div>
            </Card>
            <Card className="p-4 border-2 border-primary/20">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Carbs
                </span>
                <span className="text-lg font-black">{dish.carbs}g</span>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-4 border-2 border-primary/20">
              <div className="flex flex-col items-center mb-2">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Fat
                </span>
                <span className="text-lg font-black">{dish.fat}g</span>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
              Ingredients
            </h3>
            <ul className="space-y-2">
              {dish.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase w-6">{index + 1}.</span>
                  <span className="text-sm font-bold uppercase">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center justify-between gap-2 text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
              <span>Recipe Steps</span>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 px-3 flex items-center gap-1 text-xs font-bold uppercase tracking-tight"
                onClick={() => {
                  const query = `${dish.name} recipe`
                  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
                  window.open(url, "_blank", "noopener,noreferrer")
                }}
                title="Search this recipe on YouTube"
              >
                <Youtube className="h-3 w-3" />
                <span>Find recipe</span>
              </Button>
            </h3>
            <ol className="space-y-3">
              {dish.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-xs font-black uppercase w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

