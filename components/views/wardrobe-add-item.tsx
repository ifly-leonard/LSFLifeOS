"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Camera, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useWardrobeInventory } from "@/contexts/wardrobe-inventory-context"
import { useWardrobeAddFlow } from "@/hooks/use-wardrobe-add-flow"
import {
  Category,
  Color,
  Fit,
  Formality,
  Material,
  Pattern,
  Status,
  Subcategory,
  type WardrobeItem,
} from "@/lib/wardrobe-data"
import { defaultEmptyDraft, type ExtractedWardrobeDraft } from "@/lib/wardrobe/extract-item"
import { cn } from "@/lib/utils"
import { COLOR_HEX } from "@/lib/color-engine"

const TIPS = [
  "Place the item on a plain background.",
  "Keep the full item inside the frame.",
  "Use good, even lighting.",
  "Avoid clutter and harsh shadows.",
  "One item per photo.",
]

const SUBS_BY_CATEGORY: Record<Category, Subcategory[]> = {
  [Category.Tops]: [
    Subcategory.Shirt,
    Subcategory.Tshirt,
    Subcategory.Sweater,
  ],
  [Category.Bottoms]: [
    Subcategory.Chinos,
    Subcategory.Jeans,
    Subcategory.Shorts,
  ],
  [Category.Footwear]: [
    Subcategory.Sneakers,
    Subcategory.Loafers,
    Subcategory.Boots,
  ],
  [Category.Layers]: [
    Subcategory.Jacket,
    Subcategory.Sweater,
    Subcategory.Coat,
  ],
  [Category.Accessories]: [
    Subcategory.Watch,
    Subcategory.Belt,
    Subcategory.Chain,
    Subcategory.Bracelet,
    Subcategory.Earring,
  ],
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().toLowerCase().replace("#", "")
  if (m.length !== 6) return null
  const r = Number.parseInt(m.slice(0, 2), 16)
  const g = Number.parseInt(m.slice(2, 4), 16)
  const b = Number.parseInt(m.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b }
}

function nearestAppColor(hex: string): Color {
  const target = hexToRgb(hex)
  if (!target) return Color.Navy
  let best: { color: Color; d: number } | null = null
  for (const c of Object.values(Color)) {
    const rgb = hexToRgb(COLOR_HEX[c] ?? COLOR_HEX[c.toLowerCase()])
    if (!rgb) continue
    const d =
      (target.r - rgb.r) ** 2 +
      (target.g - rgb.g) ** 2 +
      (target.b - rgb.b) ** 2
    if (!best || d < best.d) {
      best = { color: c, d }
    }
  }
  return best?.color ?? Color.Navy
}

type WardrobeAddItemViewProps = {
  onSaved: () => void
  onCancel: () => void
}

export function WardrobeAddItemView({ onSaved, onCancel }: WardrobeAddItemViewProps) {
  const { addItem } = useWardrobeInventory()
  const flow = useWardrobeAddFlow()

  const [form, setForm] = useState<ExtractedWardrobeDraft>(defaultEmptyDraft)
  const [primaryColorHex, setPrimaryColorHex] = useState<string>(COLOR_HEX[Color.Navy])
  const [pickedHexes, setPickedHexes] = useState<string[]>([])

  useEffect(() => {
    if (flow.phase === "extracted" && flow.draft) {
      const d = flow.draft
      const subs = SUBS_BY_CATEGORY[d.category]
      const sub = subs.includes(d.subcategory as Subcategory)
        ? d.subcategory
        : subs[0]
      setForm({ ...d, subcategory: sub })
      setPrimaryColorHex(COLOR_HEX[d.primary_color] ?? COLOR_HEX[Color.Navy])
      setPickedHexes([])
    }
    if (flow.phase === "failed") {
      setForm(defaultEmptyDraft())
      setPrimaryColorHex(COLOR_HEX[Color.Navy])
      setPickedHexes([])
    }
  }, [flow.phase, flow.draft])

  useEffect(() => {
    const hexes = flow.detectedPaletteHexes
    if (!hexes || hexes.length === 0) return
    setPickedHexes(hexes)
    const primaryHex = hexes[0]
    const primary = nearestAppColor(primaryHex)
    const secondary = hexes
      .slice(1)
      .map((h) => nearestAppColor(h))
      .filter((c, i, arr) => c !== primary && arr.indexOf(c) === i)
    setPrimaryColorHex(primaryHex)
    setForm((f) => ({
      ...f,
      primary_color: primary,
      secondary_colors: secondary,
    }))
  }, [flow.detectedPaletteHexes])

  useEffect(() => {
    if (flow.phase !== "capturing" || !flow.pendingIntent) return
    void flow.startCapture()
  }, [flow.phase, flow.pendingIntent, flow.startCapture])

  const handleSave = () => {
    if (!flow.storedImagePath) return
    const item: WardrobeItem = {
      id: crypto.randomUUID(),
      title: form.title.trim() || "Wardrobe item",
      category: form.category,
      subcategory: form.subcategory,
      primary_color: form.primary_color,
      secondary_colors: form.secondary_colors,
      pattern: form.pattern,
      material: form.material,
      fit: form.fit,
      formality: form.formality,
      image_url: flow.storedImagePath,
      status: form.status,
      wear_count: 0,
      last_worn: todayIsoDate(),
      brand: form.brand?.trim() || undefined,
      size: form.size?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    }
    addItem(item)
    flow.goIdle()
    onSaved()
  }

  const handleCancel = async () => {
    await flow.retakeFromForm()
    onCancel()
  }

  const setCategory = (c: Category) => {
    setForm((f) => {
      const subs = SUBS_BY_CATEGORY[c]
      const nextSub = subs.includes(f.subcategory as Subcategory)
        ? f.subcategory
        : subs[0]
      return { ...f, category: c, subcategory: nextSub }
    })
  }

  const toggleSecondary = (c: Color) => {
    setForm((f) => {
      const has = f.secondary_colors.includes(c)
      return {
        ...f,
        secondary_colors: has
          ? f.secondary_colors.filter((x) => x !== c)
          : [...f.secondary_colors, c],
      }
    })
  }

  const addHexColor = (hex: string) => {
    const clean = hex.toLowerCase()
    setPickedHexes((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
    const mapped = nearestAppColor(clean)
    setForm((f) => {
      if (f.primary_color === mapped || f.secondary_colors.includes(mapped)) return f
      if (f.secondary_colors.length < 6) {
        return { ...f, secondary_colors: [...f.secondary_colors, mapped] }
      }
      return f
    })
  }

  return (
    <div className="space-y-4 pb-28">
      {/* idle */}
      {flow.phase === "idle" && (
        <>
          <header className="flex items-center gap-2 border-b-2 border-primary pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => void handleCancel()}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Add item</h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Photo first — we fill in the rest
              </p>
            </div>
          </header>
          {flow.permissionHint && (
            <p className="text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 px-3 py-2">
              {flow.permissionHint}
            </p>
          )}
          <Card className="p-4 border-2 border-primary/20 space-y-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
              Take a flat-lay or hanger photo for best results
            </p>
            <Button
              type="button"
              className="w-full h-12 font-black uppercase tracking-widest text-xs"
              onClick={flow.openCameraIntent}
            >
              <Camera className="mr-2 h-4 w-4" />
              Open camera
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-black uppercase tracking-widest text-xs border-2"
              onClick={flow.openGalleryIntent}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Choose from gallery
            </Button>
          </Card>
        </>
      )}

      {/* tips */}
      {flow.phase === "showing_tips" && (
        <>
          <header className="flex items-center gap-2 border-b-2 border-primary pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={flow.backFromTips}
            >
              <ArrowLeft size={18} />
            </Button>
            <h2 className="text-lg font-black uppercase tracking-tighter">Take a clear photo</h2>
          </header>
          <Card className="p-4 border-2 border-primary/20 space-y-3">
            <ul className="space-y-2">
              {TIPS.map((t) => (
                <li
                  key={t}
                  className="text-xs font-medium leading-snug pl-3 border-l-2 border-primary/40"
                >
                  {t}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="w-full h-11 font-black uppercase tracking-widest text-xs"
              onClick={flow.confirmTipsOpenCapture}
            >
              {flow.pendingIntent === "gallery" ? "Got it, choose photo" : "Got it, open camera"}
            </Button>
          </Card>
        </>
      )}

      {/* capturing */}
      {flow.phase === "capturing" && (
        <Card className="p-6 border-2 border-dashed border-primary/40 text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-tight">Opening picker…</p>
          <p className="text-[11px] text-muted-foreground">
            If nothing opens, check camera or file permissions.
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-2"
            onClick={() => {
              flow.goIdle()
            }}
          >
            Cancel
          </Button>
        </Card>
      )}

      {/* preview */}
      {flow.phase === "previewing" && flow.previewObjectUrl && (
        <>
          <header className="flex items-center gap-2 border-b-2 border-primary pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={flow.retakeFromPreview}
            >
              <ArrowLeft size={18} />
            </Button>
            <h2 className="text-lg font-black uppercase tracking-tighter">Preview</h2>
          </header>
          <div className="aspect-[4/5] w-full border-2 border-primary/20 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flow.previewObjectUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 font-black uppercase tracking-widest text-[10px]"
              onClick={flow.retakeFromPreview}
            >
              Retake
            </Button>
            <Button
              type="button"
              className="flex-1 font-black uppercase tracking-widest text-[10px]"
              onClick={() => void flow.acceptPreview()}
            >
              Use photo
            </Button>
          </div>
        </>
      )}

      {/* processing */}
      {flow.phase === "processing" && (
        <Card className="p-6 border-2 border-primary/20 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-tight">{flow.processingLabel}</p>
            <div className="h-1 w-full bg-muted rounded overflow-hidden">
              <div className="h-full w-2/3 bg-primary animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This runs on your device. A moment…
          </p>
        </Card>
      )}

      {/* form extracted / failed */}
      {(flow.phase === "extracted" || flow.phase === "failed") && flow.formImageDisplayPath && (
        <>
          <header className="flex items-center gap-2 border-b-2 border-primary pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => void handleCancel()}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Confirm & save</h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Adjust anything — it is your closet
              </p>
            </div>
          </header>

          {flow.phase === "failed" && (
            <p className="text-xs font-medium text-amber-800 border border-amber-200 bg-amber-50 px-3 py-2">
              We could not auto-fill details. Your photo is saved below — fill in manually.
            </p>
          )}
          {flow.bgRemovalFailed && (
            <p className="text-xs text-muted-foreground border border-border px-3 py-2">
              Background cleanup was skipped; we used your original photo.
            </p>
          )}
          <div className="aspect-[4/5] max-h-56 w-full mx-auto border-2 border-primary/20 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flow.formImageDisplayPath}
              alt="Item"
              className="w-full h-full object-contain"
            />
          </div>

          <Card className="p-4 border-2 border-primary/10 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block">Title</span>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 border-2"
                placeholder="e.g. Navy cotton tee"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Category</span>
                <Select value={form.category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Category).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Type</span>
                <Select
                  value={String(form.subcategory)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, subcategory: v as Subcategory }))
                  }
                >
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBS_BY_CATEGORY[form.category].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase flex justify-between items-center tracking-widest">
                <span>Primary color</span>
                <span
                  className="w-5 h-5 rounded-full border-2 border-black/20 shadow-sm"
                  style={{ backgroundColor: primaryColorHex }}
                />
              </label>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 items-center">
                <Select
                  value={form.primary_color}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, primary_color: v as Color }))
                  }
                >
                  <SelectTrigger className="border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Color).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="color"
                  aria-label="Pick primary color"
                  className="h-9 w-10 border-2 border-border rounded bg-transparent p-0.5 cursor-pointer"
                  value={primaryColorHex}
                  onChange={(e) => {
                    const hex = e.target.value
                    setPrimaryColorHex(hex)
                    setForm((f) => ({ ...f, primary_color: nearestAppColor(hex) }))
                    addHexColor(hex)
                  }}
                />
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Auto-tagged from cleaned image
              </p>
              {pickedHexes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pickedHexes.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className="h-6 px-2 border border-border text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                      onClick={() => addHexColor(hex)}
                      title={`Use ${hex}`}
                    >
                      <span className="inline-block w-2.5 h-2.5 border border-black/20" style={{ backgroundColor: hex }} />
                      {hex}
                    </button>
                  ))}
                  <input
                    type="color"
                    aria-label="Add another extracted color"
                    className="h-6 w-8 border border-border rounded p-0.5 cursor-pointer"
                    value={primaryColorHex}
                    onChange={(e) => addHexColor(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block">
                Secondary colors
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.values(Color).map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-bold uppercase border px-2 py-1 cursor-pointer",
                      form.secondary_colors.includes(c) ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    <Checkbox
                      checked={form.secondary_colors.includes(c)}
                      onCheckedChange={() => toggleSecondary(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Pattern</span>
                <Select
                  value={form.pattern}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, pattern: v as Pattern }))
                  }
                >
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Pattern).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Material</span>
                <Select
                  value={form.material}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, material: v as Material }))
                  }
                >
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Material).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Fit</span>
                <Select
                  value={form.fit}
                  onValueChange={(v) => setForm((f) => ({ ...f, fit: v as Fit }))}
                >
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Fit).map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Formality</span>
                <Select
                  value={form.formality}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, formality: v as Formality }))
                  }
                >
                  <SelectTrigger className="mt-1 border-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Formality).map((x) => (
                      <SelectItem key={x} value={x}>
                        {x.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block">Status</span>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Status }))
                }
              >
                <SelectTrigger className="mt-1 border-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.Ready}>ready</SelectItem>
                  <SelectItem value={Status.Clean}>clean</SelectItem>
                  <SelectItem value={Status.Dirty}>dirty</SelectItem>
                  <SelectItem value={Status.Ironing}>ironing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Brand</span>
                <Input
                  value={form.brand ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="mt-1 border-2"
                  placeholder="Optional"
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Size</span>
                <Input
                  value={form.size ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                  className="mt-1 border-2"
                  placeholder="Optional"
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Notes</span>
                <Input
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1 border-2"
                  placeholder="Optional"
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full h-12 font-black uppercase tracking-widest text-xs"
              onClick={handleSave}
            >
              Save item
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 font-black uppercase tracking-widest text-[10px]"
              onClick={() => void flow.retakeFromForm()}
            >
              Retake photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full font-black uppercase tracking-widest text-[10px] text-muted-foreground"
              onClick={() => void handleCancel()}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
