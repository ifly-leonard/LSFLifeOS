"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { toast } from "sonner"
import { useLifeOS } from "@/hooks/use-lifeos"
import {
  appWardrobeToEngineItems,
  displayPaletteHexesForAppOutfit,
  evaluateOutfitRecommendation,
} from "@/lib/outfit-engine"
import {
  LOOKBOOK_NAME_PREFIX,
  formatLookbookStyleName,
  loadLookbookStyles,
  saveLookbookStyles,
  type LookbookSlots,
  type SavedLookbookStyle,
} from "@/lib/wardrobe-lookbook-storage"

type Point = { x: number; y: number }

const SLOT_ORDER: Category[] = [
  Category.Tops,
  Category.Bottoms,
  Category.Footwear,
  Category.Layers,
  Category.Accessories,
]

const SLOT_LABEL: Record<Category, string> = {
  [Category.Tops]: "Tops",
  [Category.Bottoms]: "Bottoms",
  [Category.Footwear]: "Footwear",
  [Category.Layers]: "Layer",
  [Category.Accessories]: "Acc",
}

const DEFAULT_POSITIONS: Record<Category, Point> = {
  [Category.Layers]: { x: 0.52, y: 0.22 },
  [Category.Tops]: { x: 0.52, y: 0.26 },
  [Category.Bottoms]: { x: 0.52, y: 0.58 },
  [Category.Footwear]: { x: 0.52, y: 0.82 },
  [Category.Accessories]: { x: 0.28, y: 0.44 },
}

function isWearableStatus(s: Status) {
  return s === Status.Ready || s === Status.Clean
}

function emptyCanvas() {
  return {
    [Category.Tops]: null,
    [Category.Bottoms]: null,
    [Category.Footwear]: null,
    [Category.Layers]: null,
    [Category.Accessories]: null,
  } as Record<Category, WardrobeItem | null>
}

function emptyPositions() {
  return { ...DEFAULT_POSITIONS } as Record<Category, Point>
}

function outfitItemsFromSlots(slots: LookbookSlots, byId: Map<string, WardrobeItem>): WardrobeItem[] {
  const ids = Object.values(slots).filter(Boolean) as string[]
  const items: WardrobeItem[] = []
  for (const id of ids) {
    const it = byId.get(id)
    if (it) items.push(it)
  }
  return items
}

function resolveLookToSlotsFromCanvas(canvas: Record<Category, WardrobeItem | null>): LookbookSlots {
  const slots: LookbookSlots = {}
  for (const cat of SLOT_ORDER) {
    const it = canvas[cat]
    if (it) slots[cat] = it.id
  }
  return slots
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function WardrobeLookbookView() {
  const { items } = useWardrobeInventory()
  const { state: lifeosState } = useLifeOS()
  const skinToneHex = lifeosState?.settings?.wardrobe?.skinTone ?? "#e0ac69"

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const [saved, setSaved] = useState<SavedLookbookStyle[]>([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [descriptorInput, setDescriptorInput] = useState("")
  const namePreview = useMemo(
    () => formatLookbookStyleName(descriptorInput),
    [descriptorInput],
  )

  const [activeCategory, setActiveCategory] = useState<Category>(Category.Tops)
  const [canvas, setCanvas] = useState<Record<Category, WardrobeItem | null>>(() => emptyCanvas())
  const [positions, setPositions] = useState<Record<Category, Point>>(() => emptyPositions())

  const boardRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    cat: Category
    offsetX: number
    offsetY: number
    rect: DOMRect
  } | null>(null)

  const [draggingCat, setDraggingCat] = useState<Category | null>(null)

  useEffect(() => {
    setSaved(loadLookbookStyles())
  }, [])

  const candidates = useMemo(() => {
    return items.filter((i) => i.category === activeCategory && isWearableStatus(i.status))
  }, [items, activeCategory])

  const resetCanvas = useCallback(() => {
    setCanvas(emptyCanvas())
    setPositions(emptyPositions())
    setActiveCategory(Category.Tops)
  }, [])

  const loadSaved = useCallback(
    (entry: SavedLookbookStyle) => {
      const nextCanvas = emptyCanvas()
      for (const cat of Object.keys(entry.slots) as Category[]) {
        const id = entry.slots[cat]
        if (id) nextCanvas[cat] = byId.get(id) ?? null
      }
      setCanvas(nextCanvas)
      setPositions(emptyPositions())
      setActiveCategory(Category.Tops)
      toast.success("Loaded look onto canvas", { description: entry.name })
    },
    [byId],
  )

  const analyzeCanvas = useCallback(
    (outfit: WardrobeItem[]) => {
      const engineItems = appWardrobeToEngineItems(outfit)
      return evaluateOutfitRecommendation(skinToneHex, engineItems, "casual", undefined)
    },
    [skinToneHex],
  )

  const handleAddPiece = useCallback(
    (item: WardrobeItem) => {
      setCanvas((prev) => ({
        ...prev,
        [activeCategory]: item,
      }))
      // Keep current position for that category; if empty, it still has defaults.
    },
    [activeCategory],
  )

  const handleRemovePiece = useCallback((cat: Category) => {
    setCanvas((prev) => ({ ...prev, [cat]: null }))
  }, [])

  const handleDragStart = useCallback(
    (cat: Category, e: React.PointerEvent) => {
      if (!boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const p = positions[cat] ?? DEFAULT_POSITIONS[cat]
      const centerX = rect.left + p.x * rect.width
      const centerY = rect.top + p.y * rect.height

      dragRef.current = {
        cat,
        offsetX: e.clientX - centerX,
        offsetY: e.clientY - centerY,
        rect,
      }
      setDraggingCat(cat)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [positions],
  )

  useEffect(() => {
    if (!draggingCat) return

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const { rect, cat, offsetX, offsetY } = d

      const rawX = (e.clientX - rect.left - offsetX) / rect.width
      const rawY = (e.clientY - rect.top - offsetY) / rect.height

      // Pad so thumbnails don't fully leave the canvas.
      const pad = 0.06
      const x = clamp(rawX, pad, 1 - pad)
      const y = clamp(rawY, pad, 1 - pad)

      setPositions((prev) => ({ ...prev, [cat]: { x, y } }))
    }

    const onUp = () => {
      dragRef.current = null
      setDraggingCat(null)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp, { once: true })

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [draggingCat])

  const handleSave = useCallback(() => {
    const slotIds = resolveLookToSlotsFromCanvas(canvas)
    if (Object.keys(slotIds).length === 0) {
      toast.error("Add at least one piece to the canvas")
      return
    }

    const name = namePreview.trim() || formatLookbookStyleName(descriptorInput)
    if (!name.startsWith(`${LOOKBOOK_NAME_PREFIX} ·`)) {
      toast.error("Name must follow STYLE · DESCRIPTOR · YYMMDD")
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
    setCreateOpen(false)
    setDescriptorInput("")
    toast.success("Look saved", { description: name })
  }, [canvas, descriptorInput, namePreview, saved])

  const handleDelete = useCallback(
    (id: string) => {
      const next = saved.filter((s) => s.id !== id)
      saveLookbookStyles(next)
      setSaved(next)
      toast("Removed from look book")
    },
    [saved],
  )

  const canvasOutfit = useMemo(() => {
    const list: WardrobeItem[] = []
    for (const cat of SLOT_ORDER) {
      const it = canvas[cat]
      if (it) list.push(it)
    }
    return list
  }, [canvas])

  const canvasRec = useMemo(() => {
    if (canvasOutfit.length === 0) return null
    return analyzeCanvas(canvasOutfit)
  }, [canvasOutfit, analyzeCanvas])

  const canvasPalette = useMemo(() => {
    return canvasOutfit.length ? displayPaletteHexesForAppOutfit(canvasOutfit) : []
  }, [canvasOutfit])

  return (
    <div className="space-y-5 pb-24">
      {/* Saved Looks */}
      <div className="border-b-2 border-primary pb-3">
        <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          Saved looks
        </h3>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 leading-relaxed">
          Style analysis (engine) · Load onto a free canvas · Save new combinations
        </p>
      </div>

      {saved.length === 0 ? (
        <Card className="p-4 border-2 border-primary/20 bg-muted/10">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center leading-relaxed">
            No saved looks yet. Create one below.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {saved.map((entry) => {
            const outfit = outfitItemsFromSlots(entry.slots, byId)
            const rec = outfit.length ? analyzeCanvas(outfit) : null
            const palette = outfit.length
              ? displayPaletteHexesForAppOutfit(outfit)
              : []
            return (
              <Card key={entry.id} className="p-2 !gap-2 border-2 border-primary/20 bg-muted/10 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] font-bold uppercase leading-snug text-primary break-all line-clamp-2">
                      {entry.name}
                    </p>
                    <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 leading-tight">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 border-2 border-destructive/30 text-destructive"
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete look"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                <div className="grid grid-cols-[70px_1fr] gap-2">
                  <div className="grid grid-cols-2 gap-1 border border-primary/15 bg-muted/20 p-1 h-[104px]">
                    {outfit.slice(0, 4).map((item) => (
                      <div key={item.id} className="aspect-[3/4] border border-primary/10 bg-muted overflow-hidden">
                        <WardrobeImage
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover mix-blend-multiply"
                        />
                      </div>
                    ))}
                    {outfit.length === 0 ? (
                      <div className="col-span-2 flex min-h-[92px] items-center justify-center text-[7px] font-bold uppercase tracking-widest text-muted-foreground border border-dashed border-primary/15">
                        No preview
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex flex-col justify-between gap-1">
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">
                        Style analysis
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary leading-snug mt-0.5 line-clamp-2">
                        {rec
                          ? `${rec.paletteType.replace(/_/g, " ")} · ${rec.score.toFixed(1)}`
                          : "Needs tops + bottoms + footwear"}
                      </p>
                      <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest leading-snug line-clamp-3 mt-1">
                        {rec?.reason ?? "Not analyzable yet. Add core pieces and retry."}
                      </p>
                    </div>

                    <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0.5">
                      {palette.map((hex, idx) => (
                        <div
                          key={idx}
                          className="w-3.5 h-3.5 border border-primary/20 shadow-sm rounded-sm shrink-0"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full border-2 font-black uppercase tracking-widest text-[8px] h-8"
                  onClick={() => loadSaved(entry)}
                >
                  Load
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create New Look */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tighter">Create new look</h3>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 leading-relaxed">
              Drag pieces freely (Excalidraw-style), then save as a named look.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-2 font-black uppercase tracking-widest text-xs h-10"
            onClick={() => {
              if (createOpen) {
                setCreateOpen(false)
              } else {
                resetCanvas()
                setCreateOpen(true)
              }
            }}
          >
            {createOpen ? "Close" : "New look"}
          </Button>
        </div>

        {createOpen && (
          <>
            {/* Free canvas */}
            <Card className="p-3 border-2 border-primary/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/80 to-background overflow-hidden">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
                Free canvas
              </p>

          <div
            ref={boardRef}
            className="relative mx-auto h-[420px] w-[280px] max-w-full overflow-hidden rounded-sm border-2 border-dashed border-primary/25 bg-white/40 shadow-inner touch-none select-none
              bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)]
              bg-[size:24px_24px]"
          >
            {/* Canvas background label */}
            <div className="pointer-events-none absolute left-2 top-2 bg-black/60 px-2 py-0.5 text-white text-[7px] font-black uppercase tracking-widest rounded-sm">
              Drag to position
            </div>

            {/* Pieces */}
            {SLOT_ORDER.map((cat) => {
              const item = canvas[cat]
              const pos = positions[cat] ?? DEFAULT_POSITIONS[cat]
              if (!item) return null
              return (
                <div
                  key={cat}
                  className="absolute"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: 92,
                    height: 120,
                  }}
                >
                  <div
                    className={`relative h-full w-full rounded-sm border-2 border-black/20 shadow-sm bg-muted/20 overflow-hidden cursor-grab ${
                      draggingCat === cat ? "cursor-grabbing" : ""
                    }`}
                    onPointerDown={(e) => handleDragStart(cat, e)}
                    role="button"
                    aria-label={`Drag ${SLOT_LABEL[cat]}`}
                  >
                    <WardrobeImage
                      src={item.image_url}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                    <div className="absolute left-1 bottom-1 bg-black/70 px-1.5 py-0.5 text-white">
                      <div className="text-[7px] font-black uppercase leading-none tracking-widest">
                        {SLOT_LABEL[cat]}
                      </div>
                      <div className="text-[6px] font-bold uppercase leading-none tracking-tight text-white/90 line-clamp-1">
                        {item.primary_color}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="absolute right-1 top-1 bg-black/80 text-white rounded-full px-2 py-0.5 text-[10px] font-black leading-none"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePiece(cat)
                      }}
                      aria-label={`Remove ${SLOT_LABEL[cat]}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                Canvas analysis
              </p>
              <Button
                className="h-9 border-2 font-black uppercase tracking-widest text-[10px] px-2"
                onClick={() => setSaveOpen(true)}
                disabled={canvasOutfit.length === 0}
              >
                <Save size={14} className="mr-1" />
                Save style
              </Button>
            </div>

            {canvasOutfit.length === 0 ? (
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-snug">
                Add tops, bottoms, and footwear to unlock style analysis.
              </p>
            ) : (
              <>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none">
                  {canvasRec
                    ? `${canvasRec.paletteType.replace(/_/g, " ")} · ${canvasRec.score.toFixed(1)}`
                    : "Needs tops + bottoms + footwear"}
                </p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-snug">
                  {canvasRec?.reason ?? "Add core pieces and try again."}
                </p>
                {canvasPalette.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
                    {canvasPalette.map((hex, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 border border-primary/20 shadow-sm rounded-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Add pieces */}
        <div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Add pieces to the canvas
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.values(Category).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`border-2 px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
                  activeCategory === cat
                    ? "border-primary bg-primary text-white"
                    : "border-primary/20 bg-muted/30 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {SLOT_LABEL[cat]}
              </button>
            ))}
          </div>

          <div className="max-h-[260px] overflow-y-auto pr-1">
            {candidates.length === 0 ? (
              <p className="text-[9px] font-bold uppercase text-muted-foreground text-center border-2 border-dashed border-primary/15 py-6">
                No wearable items in this category
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {candidates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddPiece(item)}
                    className={`flex flex-col border-2 p-1 text-left transition-colors ${
                      canvas[activeCategory]?.id === item.id
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
                    <span className="mt-1 line-clamp-2 text-[7px] font-bold uppercase leading-tight tracking-tight px-0.5">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save dialog */}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent className="max-w-[min(100vw-1rem,380px)] rounded-none sm:rounded-lg border-2">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-tighter">
                Save look style
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Descriptor
                </p>
                <Input
                  value={descriptorInput}
                  onChange={(e) => setDescriptorInput(e.target.value)}
                  placeholder="e.g. summer office, weekend casual"
                  className="mt-1 border-2 font-medium"
                />
              </div>

              <div className="rounded border-2 border-primary/20 bg-muted/10 p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Name preview
                </p>
                <p className="font-mono text-[11px] font-black uppercase leading-tight text-primary break-all">
                  {namePreview}
                </p>
              </div>

              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed normal-case">
                Saved name follows: {LOOKBOOK_NAME_PREFIX} · DESCRIPTOR · YYMMDD (today).
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="border-2 font-black uppercase text-xs" onClick={() => setSaveOpen(false)}>
                Cancel
              </Button>
              <Button className="border-2 font-black uppercase text-xs gap-1" onClick={handleSave}>
                <Plus size={14} />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}

