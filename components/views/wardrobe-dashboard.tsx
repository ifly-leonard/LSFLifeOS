"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, RefreshCcw, Settings } from "lucide-react"
import { Color, Category, DUMMY_WARDROBE, WardrobeItem, Status } from "@/lib/wardrobe-data"
import type { LifeOSState } from "@/lib/lifeos-state"

const SKIN_TONES = [
  { id: "fair", hex: "#f8d3c5" },
  { id: "light", hex: "#fcdbc6" },
  { id: "medium", hex: "#e0ac69" },
  { id: "olive", hex: "#c68642" },
  { id: "deep", hex: "#8d5524" },
  { id: "rich", hex: "#3d2210" },
]

interface WardrobeDashboardProps {
  onNavigate?: (tab: string) => void
  state?: LifeOSState
}

export function WardrobeDashboardView({ onNavigate, state }: WardrobeDashboardProps) {
  const items = DUMMY_WARDROBE
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const [todaysOutfit, setTodaysOutfit] = useState<WardrobeItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const NEUTRAL_COLORS = [Color.Black, Color.White, Color.Grey, Color.Beige, Color.Brown, Color.Navy]
  const ACCENT_COLORS = Object.values(Color).filter(c => !NEUTRAL_COLORS.includes(c))
  const EARTH_TONES = [Color.Olive, Color.Brown, Color.Beige, Color.Maroon]

  function analyzeColorMatch(colors: Color[]) {
    const uniqueColors = Array.from(new Set(colors))
    if (uniqueColors.length === 1) {
      if (uniqueColors[0] === Color.Black) return { name: "All Black Everything", desc: "A sleek, monochromatic high-contrast look." }
      return { name: "Monochromatic", desc: "A unified, single-color contemporary silhouette." }
    }
    
    if (uniqueColors.includes(Color.Black) && uniqueColors.includes(Color.White) && uniqueColors.every(c => NEUTRAL_COLORS.includes(c))) {
      return { name: "High Contrast Minimalist", desc: "Classic black and white base offering strong visual geometry." }
    }

    const isAllNeutral = uniqueColors.every(c => NEUTRAL_COLORS.includes(c))
    if (isAllNeutral) {
      if (uniqueColors.includes(Color.Navy) && uniqueColors.includes(Color.Brown)) {
        return { name: "Classic Menswear", desc: "Timeless pairing of navy and brown neutrals." }
      }
      return { name: "Neutral Core", desc: "Safe, highly versatile neutral palette." }
    }

    const earthToneCount = uniqueColors.filter(c => EARTH_TONES.includes(c)).length
    if (earthToneCount >= 2 && !uniqueColors.includes(Color.Black)) {
      return { name: "Earth Tone Harmony", desc: "Natural, grounded colors that complement organically." }
    }
    
    const pops = uniqueColors.filter(c => !NEUTRAL_COLORS.includes(c))
    if (pops.length === 1) {
      return { name: `Neutral Base + ${pops[0]} Pop`, desc: `Grounding neutrals elevated by a single accent color.` }
    }

    return { name: "Dynamic Contrast", desc: "A bold, eclectic mix of tones creating striking visual interest." }
  }

  const generateOutfit = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const available = items.filter(i => i.status === Status.Clean)
      
      const tops = available.filter(i => i.category === Category.Tops)
      const bottoms = available.filter(i => i.category === Category.Bottoms)
      const footwear = available.filter(i => i.category === Category.Footwear)
      const accessories = available.filter(i => i.category === Category.Accessories)
      
      const selectRandom = (arr: WardrobeItem[]) => {
        if (arr.length > 0) return arr[Math.floor(Math.random() * arr.length)]
        return null
      }

      const outfit: WardrobeItem[] = []
      const top = selectRandom(tops)
      const bot = selectRandom(bottoms)
      const shoe = selectRandom(footwear)
      const acc = selectRandom(accessories)

      if (top) outfit.push(top)
      if (bot) outfit.push(bot)
      if (shoe) outfit.push(shoe)
      if (acc) outfit.push(acc)

      setTodaysOutfit(outfit)
      setIsGenerating(false)
    }, 400)
  }

  useEffect(() => {
    generateOutfit()
  }, [])

  const weeklyLookbook = [
    { day: "SUN", date: "29", image: "https://image.pollinations.ai/prompt/menswear%20street%20style%20outfit%20minimalist%20photography?width=300&height=400&nologo=true&seed=11", items: [items[0], items[12], items[25]] },
    { day: "MON", date: "30", image: "https://image.pollinations.ai/prompt/smart%20casual%20mens%20outfit%20studio%20photography?width=300&height=400&nologo=true&seed=22", items: [items[1], items[13], items[26]] },
    { day: "TUE", date: "31", image: null, items: [] },
    { day: "WED", date: "01", image: null, items: [] },
    { day: "THU", date: "02", image: null, items: [] },
    { day: "FRI", date: "03", image: null, items: [] },
    { day: "SAT", date: "04", image: null, items: [] },
  ]



  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-primary pb-2">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Dashboard</h2>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Wardrobe Insights & Analytics
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors border-2 border-transparent hover:border-black/5" onClick={() => onNavigate?.("settings")}>
          <Settings size={18} />
        </Button>
      </div>

      {/* Today's Outfit Suggestion */}
      <Card className="p-5 border-2 border-primary/20 bg-muted/5">
        <div className="flex justify-between items-end border-b-2 border-primary pb-1 mb-4">
          <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-1">
            <Sparkles size={14} className="text-primary" />
            TODAY'S SUGGESTION
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateOutfit}
            className="h-6 px-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black"
            disabled={isGenerating}
          >
            <RefreshCcw size={10} className={`mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>

        {isGenerating ? (
          <div className="grid grid-cols-4 gap-2 animate-pulse mb-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted border-2 border-primary/10 w-full" />
            ))}
          </div>
        ) : todaysOutfit.length > 0 ? (
          <>
            <div className={`grid ${todaysOutfit.length > 3 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-3`}>
              {todaysOutfit.map(item => (
                <div key={item.id} className="relative aspect-[3/4] border-2 border-primary/20 bg-muted overflow-hidden flex flex-col group">
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20 shadow-sm z-10" style={{ backgroundColor: item.primary_color === 'navy' ? '#1e3a8a' : item.primary_color === 'maroon' ? '#7f1d1d' : item.primary_color === 'olive' ? '#3f6212' : item.primary_color }} title={item.primary_color} />
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                  <div className="absolute inset-x-0 bottom-0 bg-white/90 p-1 border-t-2 border-primary/20">
                    <p className="text-[7px] font-black uppercase tracking-widest text-center truncate">{item.subcategory}</p>
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const colors = todaysOutfit.map(i => i.primary_color)
              const match = analyzeColorMatch(colors)
              return (
                <div className="flex flex-col gap-2 border-t-2 border-primary/10 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Palette Worn:</span>
                    <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
                      {Array.from(new Set(colors)).map(color => (
                        <span key={color as string} className="text-[7px] font-black uppercase tracking-widest px-1 py-0.5 border border-primary/20 flex items-center gap-1 bg-white shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full border border-black/20" style={{ backgroundColor: color === 'navy' ? '#1e3a8a' : color === 'maroon' ? '#7f1d1d' : color === 'olive' ? '#3f6212' : (color as string) }} />
                          {color as string}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Composition Fit Check:</span>
                    </div>
                    {(() => {
                      const globalSkinTone = state?.settings?.wardrobe?.skinTone || "#e0ac69"
                      const getHex = (c: string) => c === 'navy' ? '#1e3a8a' : c === 'maroon' ? '#7f1d1d' : c === 'olive' ? '#3f6212' : c
                      const topColor = getHex(todaysOutfit.find(i => i.category === Category.Tops)?.primary_color || globalSkinTone)
                      const bottomColor = getHex(todaysOutfit.find(i => i.category === Category.Bottoms)?.primary_color || globalSkinTone)
                      const shoeColor = getHex(todaysOutfit.find(i => i.category === Category.Footwear)?.primary_color || globalSkinTone)
                      const accColor = todaysOutfit.find(i => i.category === Category.Accessories)?.primary_color
                      
                      return (
                        <div className="w-full aspect-[2/1] bg-muted/20 border-2 border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner" style={{ backgroundColor: globalSkinTone }}>
                          <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none" />
                          
                          <div className="w-3/4 max-w-[180px] flex flex-col items-center z-10 p-2 gap-1 rounded border-2 border-black/10 bg-white/20 backdrop-blur-sm shadow-xl transition-transform duration-300 group-hover:scale-105">
                             {/* Top Block */}
                             <div className="h-10 w-full rounded-sm border-2 border-black/20 shadow-sm relative overflow-hidden" style={{ backgroundColor: topColor }}>
                                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                                {accColor && (
                                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: getHex(accColor) }} title="Accessory Color" />
                                )}
                             </div>
                             
                             {/* Bottom Block */}
                             <div className="h-6 w-[90%] rounded-sm border-2 border-black/20 shadow-sm relative overflow-hidden" style={{ backgroundColor: bottomColor }}>
                                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                             </div>
                             
                             {/* Shoe Block */}
                             <div className="h-2 w-1/2 rounded-sm border border-black/20 shadow-sm relative overflow-hidden" style={{ backgroundColor: shoeColor }}>
                                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                             </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="bg-primary/5 p-2 border border-primary/10 flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <Sparkles size={10} />
                      {match.name}
                    </span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 leading-snug">
                      {match.desc}
                    </span>
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-500 text-center py-4 border-2 border-dashed border-red-500/20 bg-red-500/5">
            No clean items found! Do laundry.
          </p>
        )}
      </Card>

      {/* Weekly Lookbook Gallery */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-tighter border-b-2 border-primary pb-1 flex justify-between items-end">
          <span>Weekly Lookbook</span>
          <span className="text-[8px] font-bold text-muted-foreground tracking-widest">SUN - SAT</span>
        </h3>
        
        <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6">
          {weeklyLookbook.map((look) => (
            <div key={look.day} className="flex flex-col gap-1 snap-start min-w-[110px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-primary text-white">
                  {look.day}
                </span>
                <span className="text-[8px] font-bold text-muted-foreground tracking-widest">
                  {look.date}
                </span>
              </div>
              
              {look.image ? (
                <div 
                  className="aspect-[3/4] w-full border-2 border-primary/20 bg-muted relative overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedDay(look)}
                >
                  <img 
                    src={look.image} 
                    alt={`Lookbook for ${look.day}`}
                    className="w-full h-full object-cover mix-blend-multiply transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-primary/30 pointer-events-none transition-colors" />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full border-2 border-dashed border-primary/20 bg-muted/10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-center px-2">
                    Not Worn
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto w-[95vw] rounded-none sm:rounded-lg">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center justify-between pr-4">
                  <span>{selectedDay.day} LOOK</span>
                  <span className="text-sm font-bold text-muted-foreground">{selectedDay.date} MAR</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="aspect-[3/4] w-full border-2 border-primary/20 bg-muted relative">
                  <img 
                    src={selectedDay.image} 
                    alt={`Look for ${selectedDay.day}`}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 border-2 border-primary">
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">AI Logged</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
                    Items Worn
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDay.items?.map((item: WardrobeItem) => (
                      <div key={item.id} className="group p-1 flex flex-col border-2 border-primary/10 bg-muted/10">
                        <div className="aspect-[4/5] bg-muted w-full mb-1 border border-border">
                          <img src={item.image_url} alt={item.title} className="object-cover w-full h-full mix-blend-multiply" />
                        </div>
                        <span className="font-bold uppercase text-[8px] line-clamp-2 leading-tight tracking-tight px-1 mb-1">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full mt-6 border-2 font-black uppercase tracking-widest text-xs h-12"
                    onClick={() => {
                      setSelectedDay(null)
                      // Small timeout to allow dialog closing animation
                      setTimeout(() => onNavigate?.("inventory"), 150)
                    }}
                  >
                    View in Inventory
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
