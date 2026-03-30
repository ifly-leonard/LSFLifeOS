"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BookOpen, Trash2, Plus, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Category, Status, type WardrobeItem } from "@/lib/wardrobe-data"
import { useWardrobeInventory } from "@/contexts/wardrobe-inventory-context"
import { WardrobeImage } from "@/components/wardrobe-image"
import {
  formatLookbookStyleName,
  loadLookbookStyles,
  saveLookbookStyles,
  type LookbookSlots,
  type SavedLookbookStyle,
  LOOKBOOK_NAME_PREFIX,
} from "@/lib/wardrobe-lookbook-storage"
import { toast } from "sonner"

const SLOT_ORDER: Category[] = [
  Category.Layers,
  Category.Tops,
  Category.Bottoms,
  Category.Footwear,
  Category.Accessories,
]

function isWearable(item: WardrobeItem): boolean {
  return item.status === Status.Ready || item.status === Status.Clean
}

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

export function WardrobeLookbookView() {
  const { items } = useWardrobeInventory()
  const [slots, setSlots] = useState<Record<Category, WardrobeItem | null>>(emptySlots)
  const [activeCategory, setActiveCategory] = useState<Category>(Category.Tops)
  const [saved, setSaved] = useState<SavedLookbookStyle[]>([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [descriptorInput, setDescriptorInput] = useState("")
  const [namePreview, setNamePreview] = useState("")

  useEffect(() => {
    setSaved(loadLookbookStyles())
  }, [])

  useEffect(() => {
    setNamePreview(formatLookbookStyleName(descriptorInput))
  }, [descriptorInput])

  const pickItem = useCallback((item: WardrobeItem) => {
    setSlots((prev) => ({ ...prev, [activeCategory]: item }))
  }, [activeCategory])

  const clearSlot = useCallback((cat: Category) => {
    setSlots((prev) => ({ ...prev, [cat]: null }))
  }, [])

  const candidates = useMemo(() => {
    return items.filter((i) => i.category === activeCategory && isWearable(i))
  }, [items, activeCategory])

  const hydrateSlots = useCallback(
    (raw: LookbookSlots) => {
      const byId = new Map(items.map((i) => [i.id, i]))
      const next = emptySlots()
      for (const cat of SLOT_ORDER) {
        const id = raw[cat]
        if (id && byId.has(id)) next[cat] = byId.get(id)!
      }
      setSlots(next)
    },
    [items],
  )

  const handleSaveLook = () => {
    const name = namePreview.trim() || formatLookbookStyleName(descriptorInput)
    if (!name.startsWith(`${LOOKBOOK_NAME_PREFIX} ·`)) {
      toast.error("Name must follow STYLE · DESCRIPTOR · YYMMDD")
      return
    }
    const slotIds: LookbookSlots = {}
    for (const cat of SLOT_ORDER) {
      const it = slots[cat]
      if (it) slotIds[cat] = it.id
    }
    if (Object.keys(slotIds).length === 0) {
      toast.error("Add at least one piece to the canvas")
      return
    }
    const entry: SavedLookbookStyle = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      slots: slotIds,
    }
    const next = [entry, ...saved]
    saveLookbookStyles(next)
    setSaved(next)
    setSaveOpen(false)
    setDescriptorInput("")
    toast.success("Look saved", { description: name })
  }

  const removeSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id)
    saveLookbookStyles(next)
    setSaved(next)
    toast("Removed from look book")
  }

  const loadSaved = (entry: SavedLookbookStyle) => {
    hydrateSlots(entry.slots)
    toast.success("Loaded onto canvas", { description: entry.name })
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="border-b-2 border-primary pb-2">
        <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          Look book
        </h3>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 leading-relaxed">
          Stack pieces on the canvas, then save as a named style. Convention:{" "}
          <span className="text-foreground font-mono text-[8px] normal-case">
            STYLE · DESCRIPTOR · YYMMDD
          </span>
        </p>
      </div>

      {/* Canvas */}
      <Card className="p-3 border-2 border-primary/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/80 to-background overflow-hidden">
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
          Canvas
        </p>
        <div className="relative mx-auto flex min-h-[260px] max-w-[260px] flex-col items-center justify-start gap-0 rounded-sm border-2 border-dashed border-primary/25 bg-white/40 p-2 shadow-inner">
          {SLOT_ORDER.map((cat) => {
            const item = slots[cat]
            const label = SLOT_LABEL[cat]
            return (
              <div
                key={cat}
                className={`relative w-full flex-1 min-h-[48px] border border-primary/10 bg-muted/30 ${
                  activeCategory === cat ? "ring-2 ring-primary ring-offset-1" : ""
                }`}
                onClick={() => setActiveCategory(cat)}
                role="button"
              >
                {item ? (
                  <>
                    <WardrobeImage
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full max-h-[72px] object-contain object-center mix-blend-multiply"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 z-10 bg-black px-1 py-0.5 text-[7px] font-black uppercase text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearSlot(cat)
                      }}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <div className="flex h-full min-h-[44px] items-center justify-center text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[7px] font-bold text-muted-foreground uppercase text-center mt-2 tracking-widest">
          Tap a row to choose category · Add pieces below
        </p>
      </Card>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {SLOT_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`border-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
              activeCategory === cat
                ? "border-primary bg-primary text-white"
                : "border-primary/20 bg-muted/30 text-muted-foreground"
            }`}
          >
            {SLOT_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Picker */}
      <div>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Add {SLOT_LABEL[activeCategory]} (ready / clean)
        </p>
        <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {candidates.length === 0 ? (
            <p className="col-span-3 text-[9px] font-bold uppercase text-muted-foreground py-4 text-center border-2 border-dashed border-primary/15">
              No wearable items in this category
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

      <Button
        className="w-full border-2 font-black uppercase tracking-widest text-xs h-11 gap-2"
        onClick={() => setSaveOpen(true)}
      >
        <Save size={16} />
        Save as style
      </Button>

      {/* Saved list */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-primary/20 pb-1">
            Saved looks
          </h4>
          {saved.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2 border-2 border-primary/10 bg-muted/10 p-2"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => loadSaved(s)}
              >
                <p className="font-mono text-[9px] font-bold uppercase leading-snug break-all text-primary">
                  {s.name}
                </p>
                <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 border-2 border-destructive/30 text-destructive"
                onClick={() => removeSaved(s.id)}
                aria-label="Delete look"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-[min(100vw-1rem,380px)] rounded-none sm:rounded-lg border-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tighter">
              Save look
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Descriptor (one short label)
              </label>
              <Input
                value={descriptorInput}
                onChange={(e) => setDescriptorInput(e.target.value)}
                placeholder="e.g. summer office, weekend casual"
                className="mt-1 border-2 font-medium text-sm"
              />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Full style name (editable)
              </p>
              <Input
                value={namePreview}
                onChange={(e) => setNamePreview(e.target.value)}
                className="border-2 font-mono text-[11px] font-bold uppercase"
              />
              <p className="text-[8px] font-bold text-muted-foreground mt-2 leading-relaxed normal-case">
                Pattern: <strong>{LOOKBOOK_NAME_PREFIX} · DESCRIPTOR · YYMMDD</strong>. Descriptor becomes
                SCREAMING_SNAKE; date is today unless you edit the full line.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-2 font-black uppercase text-xs" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button className="border-2 font-black uppercase text-xs gap-1" onClick={handleSaveLook}>
              <Plus size={14} />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
