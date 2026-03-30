"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Dish } from "@/lib/lifeos-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X } from "lucide-react"

const dishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  meal: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  prepTime: z.number().min(1, "Prep time must be at least 1 minute"),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  tags: z.array(z.string()),
  ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
  steps: z.array(z.string()).min(1, "At least one step is required"),
  disabled: z.boolean().optional(),
})

type DishFormData = z.infer<typeof dishSchema>

interface DishFormProps {
  dish?: Dish | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dish: Dish) => void
}

export function DishForm({ dish, open, onOpenChange, onSubmit }: DishFormProps) {
  const [ingredientInput, setIngredientInput] = useState("")
  const [stepInput, setStepInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DishFormData>({
    resolver: zodResolver(dishSchema),
    defaultValues: dish
      ? {
          name: dish.name,
          meal: dish.meal,
          prepTime: dish.prepTime,
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fat: dish.fat,
          tags: dish.tags,
          ingredients: dish.ingredients,
          steps: dish.steps,
          disabled: dish.disabled ?? false,
        }
      : {
          name: "",
          meal: "breakfast",
          prepTime: 10,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          tags: [],
          ingredients: [],
          steps: [],
          disabled: false,
        },
  })

  const tags = watch("tags")
  const ingredients = watch("ingredients")
  const steps = watch("steps")

  useEffect(() => {
    if (dish) {
      reset({
        name: dish.name,
        meal: dish.meal,
        prepTime: dish.prepTime,
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
        tags: dish.tags,
        ingredients: dish.ingredients,
        steps: dish.steps,
        disabled: dish.disabled ?? false,
      })
    } else {
      reset({
        name: "",
        meal: "breakfast",
        prepTime: 10,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        tags: [],
        ingredients: [],
        steps: [],
        disabled: false,
      })
    }
  }, [dish, reset])

  const onFormSubmit = (data: DishFormData) => {
    const newDish: Dish = {
      id: dish?.id || Date.now().toString(),
      ...data,
      disabled: data.disabled ?? false,
    }
    onSubmit(newDish)
    onOpenChange(false)
  }

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setValue("ingredients", [...ingredients, ingredientInput.trim()])
      setIngredientInput("")
    }
  }

  const removeIngredient = (index: number) => {
    setValue(
      "ingredients",
      ingredients.filter((_, i) => i !== index)
    )
  }

  const addStep = () => {
    if (stepInput.trim()) {
      setValue("steps", [...steps, stepInput.trim()])
      setStepInput("")
    }
  }

  const removeStep = (index: number) => {
    setValue(
      "steps",
      steps.filter((_, i) => i !== index)
    )
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">
            {dish ? "Edit Dish" : "Add New Dish"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Dish Name
              </label>
              <Input {...register("name")} className="h-10" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Meal Type
              </label>
              <Select
                value={watch("meal")}
                onValueChange={(value) => setValue("meal", value as Dish["meal"])}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Prep Time (min)
              </label>
              <Input
                type="number"
                {...register("prepTime", { valueAsNumber: true })}
                className="h-10"
              />
              {errors.prepTime && <p className="text-xs text-destructive mt-1">{errors.prepTime.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Calories
              </label>
              <Input
                type="number"
                {...register("calories", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Protein (g)
              </label>
              <Input
                type="number"
                {...register("protein", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                Carbs (g)
              </label>
              <Input
                type="number"
                {...register("carbs", { valueAsNumber: true })}
                className="h-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Fat (g)
            </label>
            <Input
              type="number"
              {...register("fat", { valueAsNumber: true })}
              className="h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="disabled"
              checked={watch("disabled") ?? false}
              onCheckedChange={(checked) => setValue("disabled", checked === true)}
              className="h-5 w-5 border-2 rounded-none"
            />
            <label
              htmlFor="disabled"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer"
            >
              Disable Dish
            </label>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add tag..."
                className="h-10"
              />
              <Button type="button" onClick={addTag} size="icon" className="h-10 w-10">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-1 flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Ingredients
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addIngredient()
                  }
                }}
                placeholder="Add ingredient..."
                className="h-10"
              />
              <Button type="button" onClick={addIngredient} size="icon" className="h-10 w-10">
                <Plus size={16} />
              </Button>
            </div>
            {errors.ingredients && <p className="text-xs text-destructive mb-2">{errors.ingredients.message}</p>}
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                >
                  <span className="text-sm font-bold uppercase">{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="hover:text-destructive"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Recipe Steps
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addStep()
                  }
                }}
                placeholder="Add step..."
                className="h-10"
              />
              <Button type="button" onClick={addStep} size="icon" className="h-10 w-10">
                <Plus size={16} />
              </Button>
            </div>
            {errors.steps && <p className="text-xs text-destructive mb-2">{errors.steps.message}</p>}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-2 border rounded-md bg-muted/30"
                >
                  <span className="text-sm flex-1">
                    <span className="font-black uppercase mr-2">{index + 1}.</span>
                    {step}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="hover:text-destructive ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Dish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

