"use client"

import type { DietOSState, Dish } from "@/lib/dietos-state"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit2, Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { DishForm } from "./dish-form"
import { getMealColorClasses } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export function DishesView({ state, updateState }: { state: DietOSState; updateState: (s: DietOSState) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [mealFilter, setMealFilter] = useState<string>("all")
  const [showDisabled, setShowDisabled] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)

  const filteredDishes = state.dishes.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesMeal = mealFilter === "all" || d.meal === mealFilter
    const matchesDisabled = showDisabled || !d.disabled
    return matchesSearch && matchesMeal && matchesDisabled
  })

  // Calculate stats (only enabled dishes)
  const enabledDishes = state.dishes.filter((d) => !d.disabled)
  const totalDishes = enabledDishes.length
  const uniqueGroceries = new Set<string>()
  enabledDishes.forEach((dish) => {
    dish.ingredients.forEach((ingredient) => {
      uniqueGroceries.add(ingredient)
    })
  })
  const totalGroceries = uniqueGroceries.size

  const handleAdd = () => {
    setEditingDish(null)
    setFormOpen(true)
  }

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish)
    setFormOpen(true)
  }

  const handleClone = (dish: Dish) => {
    const clonedDish: Dish = {
      ...dish,
      id: Date.now().toString(),
      name: `${dish.name} (Copy)`,
    }
    setEditingDish(clonedDish)
    setFormOpen(true)
  }

  const handleFormSubmit = (dish: Dish) => {
    const existingIndex = state.dishes.findIndex((d) => d.id === dish.id)
    let newDishes: Dish[]

    if (existingIndex >= 0) {
      // Update existing dish
      newDishes = [...state.dishes]
      newDishes[existingIndex] = dish
    } else {
      // Add new dish
      newDishes = [...state.dishes, dish]
    }

    updateState({
      ...state,
      dishes: newDishes,
    })
  }

  const handleToggleDisabled = (dish: Dish) => {
    const existingIndex = state.dishes.findIndex((d) => d.id === dish.id)
    if (existingIndex >= 0) {
      const newDishes = [...state.dishes]
      newDishes[existingIndex] = {
        ...dish,
        disabled: !dish.disabled,
      }
      updateState({
        ...state,
        dishes: newDishes,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Dish Library</h2>
        <button
          onClick={handleAdd}
          className="bg-primary text-white p-1 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
        </button>
      </div>

      <Card className="p-4 border-2 border-primary shadow-none">
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Total Dishes</span>
            <span className="text-lg font-black">{totalDishes}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Groceries Listed</span>
            <span className="text-lg font-black">{totalGroceries}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="SEARCH BY DISH OR TAG..."
            className="pl-10 h-12 border-2 font-bold uppercase text-xs tracking-widest w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={mealFilter} onValueChange={setMealFilter}>
          <SelectTrigger className="w-full h-12 border-2 font-bold uppercase text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meals</SelectItem>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-disabled"
            checked={showDisabled}
            onCheckedChange={(checked) => setShowDisabled(checked === true)}
            className="h-5 w-5 border-2 rounded-none"
          />
          <label
            htmlFor="show-disabled"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer flex items-center gap-2"
          >
            {showDisabled ? <EyeOff size={14} /> : <Eye size={14} />}
            Show Disabled
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDishes.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground font-bold uppercase text-xs tracking-widest">
            No dishes found
          </p>
        ) : (
          filteredDishes.map((dish) => (
            <Card
              key={dish.id}
              className={`p-4 border border-border hover:border-primary transition-colors ${
                dish.disabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-bold uppercase text-md leading-tight">{dish.name}</h3>
                  {dish.disabled && (
                    <span className="text-[8px] font-black uppercase tracking-widest bg-muted px-2 py-0.5 text-muted-foreground">
                      DISABLED
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-muted-foreground">
                  <button
                    onClick={() => handleToggleDisabled(dish)}
                    className="hover:text-primary transition-colors"
                    aria-label={dish.disabled ? "Enable dish" : "Disable dish"}
                    title={dish.disabled ? "Enable dish" : "Disable dish"}
                  >
                    {dish.disabled ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleEdit(dish)}
                    className="hover:text-primary transition-colors"
                    aria-label="Edit dish"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleClone(dish)}
                    className="hover:text-primary transition-colors"
                    aria-label="Clone dish"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${getMealColorClasses(dish.meal)}`}>
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
          ))
        )}
      </div>

      <DishForm
        dish={editingDish}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
