"use client"

import { type ReactNode } from "react"
import { Sparkles, RefreshCcw } from "lucide-react"
import { Category, type WardrobeItem } from "@/lib/wardrobe-data"
import { COLOR_HEX } from "@/lib/color-engine"
import {
  displayPaletteHexesForAppOutfit,
  evaluateOutfitRecommendation,
  appWardrobeToEngineItems,
  plannerEventToEngineContext,
  type EventType,
} from "@/lib/outfit-engine"
import { WardrobeImage } from "@/components/wardrobe-image"

function resolveWardrobeHex(token: string): string {
  const t = token.trim()
  if (t.startsWith("#")) return t
  return COLOR_HEX[t.toLowerCase()] ?? t
}

function formatPrimaryColorName(token: string): string {
  if (token.startsWith("#")) return "Custom"
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

export type WardrobePlannedOutfitDetailProps = {
  outfit: WardrobeItem[]
  skinTone: string
  /** When set, scoring uses planner context; otherwise casual. */
  plannerEventKey?: string | null
  onItemClick?: (item: WardrobeItem) => void
  tapHint?: string | null
}

export function WardrobePlannedOutfitDetail({
  outfit,
  skinTone,
  plannerEventKey,
  onItemClick,
  tapHint = null,
}: WardrobePlannedOutfitDetailProps) {
  const pe = plannerEventKey
    ? plannerEventToEngineContext(plannerEventKey)
    : { eventType: "casual" as EventType, formality: undefined as undefined }

  const rec = evaluateOutfitRecommendation(
    skinTone,
    appWardrobeToEngineItems(outfit),
    pe.eventType,
    pe.formality,
  )

  const palette = displayPaletteHexesForAppOutfit(outfit)

  const globalSkinTone = skinTone
  const topItem = outfit.find((i) => i.category === Category.Tops)
  const bottomItem = outfit.find((i) => i.category === Category.Bottoms)
  const shoeItem = outfit.find((i) => i.category === Category.Footwear)
  const layerItem = outfit.find((i) => i.category === Category.Layers)

  const topToken = String(topItem?.primary_color ?? globalSkinTone)
  const bottomToken = String(bottomItem?.primary_color ?? globalSkinTone)
  const shoeToken = String(shoeItem?.primary_color ?? globalSkinTone)
  const layerToken = layerItem ? String(layerItem.primary_color) : null

  const topFill = resolveWardrobeHex(topToken)
  const bottomFill = resolveWardrobeHex(bottomToken)
  const shoeFill = resolveWardrobeHex(shoeToken)
  const layerFill = layerToken ? resolveWardrobeHex(layerToken) : null

  const topName = topItem ? formatPrimaryColorName(topItem.primary_color) : "Skin"
  const bottomName = bottomItem ? formatPrimaryColorName(bottomItem.primary_color) : "Skin"
  const shoeName = shoeItem ? formatPrimaryColorName(shoeItem.primary_color) : "Skin"
  const layerName = layerItem ? formatPrimaryColorName(layerItem.primary_color) : ""

  const inColorMeta = (slot: string, colorName: string, hex: string) => (
    <div className="relative z-20 mt-auto flex w-full min-w-0 items-end justify-between gap-1.5 px-1 py-1 mix-blend-normal">
      <div className="min-w-0 shrink bg-black px-1.5 py-1 text-white">
        <div className="text-[9px] font-black uppercase leading-tight tracking-tighter">{slot}</div>
        <div className="mt-0.5 text-[8px] font-bold capitalize leading-tight tracking-tight text-white/90">
          {colorName}
        </div>
      </div>
      <span className="shrink-0 bg-black px-1.5 py-1 font-mono text-[8px] font-medium uppercase leading-tight tracking-tight text-white tabular-nums">
        {hex}
      </span>
    </div>
  )

  const swatch = (fillHex: string, meta: ReactNode, minHClass: string, widthClass = "w-full") => (
    <div className={`relative isolate flex ${minHClass} ${widthClass} flex-col rounded-sm border-2 border-black/20 shadow-sm`}>
      <div className="absolute inset-0 z-0 overflow-hidden rounded-sm" style={{ backgroundColor: fillHex }}>
        <div className="pointer-events-none absolute inset-0 bg-black/10 mix-blend-multiply" />
      </div>
      {meta}
    </div>
  )

  return (
    <>
      <div className={`grid ${outfit.length > 3 ? "grid-cols-4" : "grid-cols-3"} gap-2 mb-3`}>
        {outfit.map((item) => (
          <div
            key={item.id}
            className={`relative aspect-[3/4] border-2 border-primary/20 bg-muted overflow-hidden flex flex-col group ${
              onItemClick ? "cursor-pointer active:scale-[0.99]" : ""
            }`}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            role={onItemClick ? "button" : undefined}
          >
            {onItemClick ? (
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 z-10 bg-primary/10 p-1 rounded-full text-primary backdrop-blur-sm transition-opacity pointer-events-none">
                <RefreshCcw size={10} />
              </div>
            ) : null}
            <div
              className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20 shadow-sm z-10"
              style={{ backgroundColor: COLOR_HEX[item.primary_color] ?? "#888888" }}
              title={item.primary_color}
            />
            <WardrobeImage src={item.image_url} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
            <div className="absolute inset-x-0 bottom-0 bg-white/90 p-1 border-t-2 border-primary/20">
              <p className="text-[7px] font-black uppercase tracking-widest text-center truncate">{item.subcategory}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-primary/10 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
            Palette worn:
          </span>
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
            {palette.map((colorHex, idx) => (
              <div key={idx} className="w-4 h-4 border border-primary/20 shadow-sm" style={{ backgroundColor: colorHex }} />
            ))}
          </div>
        </div>

        <div className="bg-primary/5 p-2 border border-primary/10 flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
            <Sparkles size={10} />
            {rec ? `${rec.paletteType.replace(/_/g, " ")} · ${rec.score.toFixed(1)}` : "Outfit engine"}
          </span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 leading-snug normal-case">
            {rec?.reason ?? "—"}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2 mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
              Composition fit check:
            </span>
          </div>
          <div
            className="group relative flex aspect-[4/3] min-h-[200px] w-full flex-col items-center justify-center overflow-hidden border-2 border-primary/20 bg-muted/20 shadow-inner"
            style={{ backgroundColor: globalSkinTone }}
          >
            <div className="pointer-events-none absolute inset-0 z-0 bg-black/5 mix-blend-multiply" />
            <div className="absolute left-2 right-2 top-1.5 z-30 flex items-center justify-between gap-1 mix-blend-normal">
              <span className="bg-black px-1.5 py-1 text-[9px] font-black uppercase leading-none tracking-tighter text-white">
                Skin
              </span>
              <span className="bg-black px-1.5 py-1 font-mono text-[8px] font-medium uppercase leading-none tracking-tight text-white tabular-nums">
                {globalSkinTone.trim()}
              </span>
            </div>

            <div className="z-10 mt-7 flex w-[92%] max-w-[240px] flex-col gap-1.5 rounded border-2 border-black/10 bg-white/20 p-2 shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              {swatch(topFill, inColorMeta("Tops", topName, topFill), "min-h-11")}
              {layerFill && swatch(layerFill, inColorMeta("Layer", layerName, layerFill), "min-h-9")}
              {swatch(bottomFill, inColorMeta("Bottoms", bottomName, bottomFill), "min-h-9")}
              <div className="flex w-full justify-center">
                {swatch(
                  shoeFill,
                  inColorMeta("Footwear", shoeName, shoeFill),
                  "min-h-10",
                  "w-[88%] max-w-[140px]",
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tapHint ? (
        <p className="text-[7px] font-bold text-muted-foreground uppercase text-center mt-2 tracking-widest opacity-60">
          {tapHint}
        </p>
      ) : null}
    </>
  )
}
