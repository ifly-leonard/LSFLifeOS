"use client"

import type { DietOSState } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit2, Copy } from "lucide-react"
import { useState } from "react"

export function DishesView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDishes = state.dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Dish Library</h2>
        <button className="bg-primary text-white p-1 hover:opacity-90">
          <Plus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="SEARCH BY DISH OR TAG..."
          className="pl-10 h-12 border-2 font-bold uppercase text-xs tracking-widest"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDishes.map((dish) => (
          <Card key={dish.id} className="p-4 border border-border hover:border-primary transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold uppercase text-md leading-tight">{dish.name}</h3>
              <div className="flex gap-2 text-muted-foreground">
                <button className="hover:text-primary">
                  <Edit2 size={14} />
                </button>
                <button className="hover:text-primary">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5">
                {dish.meal}
              </span>
              {dish.tags.map((tag) => (
                <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 border-t border-border pt-3">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Cals</span>
                <span className="text-xs font-black">{dish.calories}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Prot</span>
                <span className="text-xs font-black">{dish.protein}g</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Time</span>
                <span className="text-xs font-black">{dish.prepTime}m</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
