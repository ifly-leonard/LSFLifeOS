"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BookOpen, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Category, Color, Status, type WardrobeItem } from "@/lib/wardrobe-data"
import { WardrobeImage } from "@/components/wardrobe-image"
import {
  WARDROBE_LOOKBOOK_STORAGE_KEY,
  loadLookbookStyles,
  type LookbookSlots,
  type SavedLookbookStyle,
} from "@/lib/wardrobe-lookbook-storage"
import { toast } from "sonner"

const SLOT_ORDER: Category[] = [
  Category.Layers,
  Category.Tops,
  Category.Bottoms,
  Category.Footwear,
  Category.Accessories,
]

const SLOT_LABEL: Record<Category, string> = {
  [Category.Tops]: "Tops",
  [Category.Bottoms]: "Bottoms",
  [Category.Footwear]: "Footwear",
  [Category.Layers]: "Layer",
  [Category.Accessories]: "Acc",
}

function emptySlots(): Record<Category, WardrobeItem | null> {
  return {
    [Category.Tops]: null,
    [Category.Bottoms]: null,
    [Category.Footwear]: null,
    [Category.Layers]: null,
    [Category.Accessories]: null,
  }
}

function outfitToSlots(outfit: WardrobeItem[] | null): Record<Category, WardrobeItem | null> {
  const next = emptySlots()
  if (!outfit?.length) return next
  for (const cat of SLOT_ORDER) {
    const found = outfit.find((i) => i.category === cat)
    if (found) next[cat] = found
  }
  return next
}

function slotsToOutfit(slots: Record<Category, WardrobeItem | null>): WardrobeItem[] {
  return SLOT_ORDER.map((c) => slots[c]).filter(Boolean) as WardrobeItem[]
}

function isWearable(item: WardrobeItem): boolean {
  return item.status === Status.Ready || item.status === Status.Clean
}

const COLOR_OPTIONS: { value: "all" | Color; label: string }[] = [
  { value: "all", label: "All colors" },
  ...Object.values(Color).map((c) => ({ value: c, label: c })),
]

type WardrobePlannerManualLookDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  wardrobeItems: WardrobeItem[]
  initialOutfit: WardrobeItem[] | null
  onApply: (outfit: WardrobeItem[]) => void
}

export function WardrobePlannerManualLookDialog({
  open,
  onOpenChange,
  wardrobeItems,
  initialOutfit,
  onApply,
}: WardrobePlannerManualLookDialogProps) {
  const [slots, setSlots] = useState<Record<Category, WardrobeItem | null>>(emptySlots)
  const [activeCategory, setActiveCategory] = useState<Category>(Category.Tops)
  const [colorFilter, setColorFilter] = useState<"all" | Color>("all")
  const [savedLooks, setSavedLooks] = useState<SavedLookbookStyle[]>([])

  const refreshSaved = useCallback(() => {
    setSavedLooks(loadLookbookStyles())
  }, [])

  useEffect(() => {
    if (open) {
      setSlots(outfitToSlots(initialOutfit))
      refreshSaved()
    }
  }, [open, initialOutfit, refreshSaved])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WARDROBE_LOOKBOOK_STORAGE_KEY) refreshSaved()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [refreshSaved])

  const pickItem = useCallback((item: WardrobeItem) => {
    setSlots((prev) => ({ ...prev, [activeCategory]: item }))
  }, [activeCategory])

  const clearSlot = useCallback((cat: Category) => {
    setSlots((prev) => ({ ...prev, [cat]: null }))
  }, [])

  const hydrateFromLookbookSlots = useCallback(
    (raw: LookbookSlots) => {
      const byId = new Map(wardrobeItems.map((i) => [i.id, i]))
      const next = emptySlots()
      for (const cat of SLOT_ORDER) {
        const id = raw[cat]
        if (id && byId.has(id)) next[cat] = byId.get(id)!
      }
      setSlots(next)
    },
    [wardrobeItems],
  )

  const candidates = useMemo(() => {
    return wardrobeItems.filter((i) => {
      if (i.category !== activeCategory || !isWearable(i)) return false
      if (colorFilter === "all") return true
      return i.primary_color === colorFilter
    })
  }, [wardrobeItems, activeCategory, colorFilter])

  const handleApply = () => {
    const outfit = slotsToOutfit(slots)
    if (outfit.length === 0) {
      toast.error("Pick at least one piece")
      return
    }
    onApply(outfit)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto w-[min(100vw-1rem,420px)] rounded-none sm:rounded-lg border-2 p-4 gap-0">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
            <BookOpen size={18} className="text-primary shrink-0" />
            Build look
          </DialogTitle>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed pt-1">
            Choose by type and color, or load a saved style from your look book.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {savedLooks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-primary">
                Saved looks
              </p>
              <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                {savedLooks.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      hydrateFromLookbookSlots(s.slots)
                      toast.success("Loaded", { description: s.name })
                    }}
                    className="text-left border-2 border-primary/15 bg-muted/20 px-2 py-1.5 hover:border-primary/40 transition-colors"
                  >
                    <p className="font-mono text-[8px] font-bold uppercase leading-snug break-all text-foreground line-clamp-2">
                      {s.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <CardMiniSlots
            slots={slots}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onClear={clearSlot}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest w-full">
              Filter picker
            </span>
            <Select
              value={colorFilter}
              onValueChange={(v) => setColorFilter(v as "all" | Color)}
            >
              <SelectTrigger className="h-8 flex-1 min-w-[140px] border-2 text-[10px] font-bold uppercase tracking-widest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-[10px] font-bold uppercase"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {SLOT_LABEL[activeCategory]} — ready / clean
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {candidates.length === 0 ? (
                <p className="col-span-3 text-[9px] font-bold uppercase text-muted-foreground py-6 text-center border-2 border-dashed border-primary/15">
                  No items match this type / color
                </p>
              ) : (
                candidates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pickItem(item)}
                    className={`flex flex-col border-2 p-1 text-left transition-colors ${
                      slots[activeCategory]?.id === item.id
                        ? "border-primary bg-primary/5"
                        : "border-primary/10 bg-muted/20 hover:border-primary/40"
                    }`}
                  >
                    <div className="aspect-[3/4] w-full bg-muted">
                      <WardrobeImage
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover mix-blend-multiply"
                      />
                    </div>
                    <span className="mt-1 line-clamp-2 text-[7px] font-bold uppercase leading-tight tracking-tight">
                      {item.title}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t-2 border-primary/10 mt-2">
          <Button
            variant="outline"
            className="border-2 font-black uppercase text-[10px] tracking-widest"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="border-2 font-black uppercase text-[10px] tracking-widest gap-1"
            onClick={handleApply}
          >
            <Check size={14} />
            Apply to day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CardMiniSlots({
  slots,
  activeCategory,
  onSelectCategory,
  onClear,
}: {
  slots: Record<Category, WardrobeItem | null>
  activeCategory: Category
  onSelectCategory: (c: Category) => void
  onClear: (c: Category) => void
}) {
  return (
    <div className="rounded-sm border-2 border-primary/20 bg-muted/20 p-2">
      <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
        Tap row · category
      </p>
      <div className="flex flex-col gap-0.5 max-w-[280px] mx-auto">
        {SLOT_ORDER.map((cat) => {
          const item = slots[cat]
          const label = SLOT_LABEL[cat]
          return (
            <div
              key={cat}
              role="button"
              onClick={() => onSelectCategory(cat)}
              className={`relative flex min-h-[44px] w-full items-center border border-primary/10 bg-background/80 px-1 ${
                activeCategory === cat ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {item ? (
                <>
                  <WardrobeImage
                    src={item.image_url}
                    alt={item.title}
                    className="h-10 w-10 shrink-0 object-contain mix-blend-multiply"
                  />
                  <span className="ml-1 line-clamp-2 text-[7px] font-bold uppercase leading-tight flex-1">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 bg-black px-1 py-0.5 text-[7px] font-black uppercase text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClear(cat)
                    }}
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span className="flex h-full min-h-[40px] w-full items-center justify-center text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
