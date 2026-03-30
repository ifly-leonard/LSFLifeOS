"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Settings, CalendarDays } from "lucide-react"
import { WardrobeItem } from "@/lib/wardrobe-data"
import { useWardrobeInventory } from "@/contexts/wardrobe-inventory-context"
import {
  recommendOutfitsForApp,
  appOutfitFromRecommendation,
  type EventType,
} from "@/lib/outfit-engine"
import type { LifeOSState } from "@/lib/lifeos-state"
import { WardrobeImage } from "@/components/wardrobe-image"
import { WardrobePlannedOutfitDetail } from "@/components/wardrobe-planned-outfit-detail"
import {
  loadWardrobePlanFromStorage,
  getPlannedOutfitForDate,
  hydrateOutfitFromWardrobe,
} from "@/lib/wardrobe-plan"
import { plannerEventLabel } from "@/lib/wardrobe-planner-events"

interface WardrobeDashboardProps {
  onNavigate?: (tab: string) => void
  state?: LifeOSState
}

export function WardrobeDashboardView({ onNavigate, state }: WardrobeDashboardProps) {
  const { items } = useWardrobeInventory()
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const [todaysOutfit, setTodaysOutfit] = useState<WardrobeItem[]>([])
  const [todayPlanEventKey, setTodayPlanEventKey] = useState<string | null>(null)

  const skinTone = state?.settings?.wardrobe?.skinTone ?? "#e0ac69"

  const loadTodayFromPlan = useCallback(() => {
    const plan = loadWardrobePlanFromStorage()
    const hit = getPlannedOutfitForDate(plan, new Date())
    if (hit) {
      setTodaysOutfit(hydrateOutfitFromWardrobe(hit.outfit, items))
      setTodayPlanEventKey(hit.entry.eventType)
    } else {
      setTodaysOutfit([])
      setTodayPlanEventKey(null)
    }
  }, [items])

  useEffect(() => {
    loadTodayFromPlan()
    const onPlanChange = () => loadTodayFromPlan()
    window.addEventListener("storage", onPlanChange)
    window.addEventListener("wardrobe-plan-updated", onPlanChange)
    return () => {
      window.removeEventListener("storage", onPlanChange)
      window.removeEventListener("wardrobe-plan-updated", onPlanChange)
    }
  }, [loadTodayFromPlan])

  const weeklyLookbook = useMemo(() => {
    const rotation: EventType[] = [
      "casual",
      "work",
      "travel",
      "dinner",
      "meeting",
      "casual",
      "work",
    ]
    const dates = ["29", "30", "31", "01", "02", "03", "04"]
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    return days.map((day, i) => {
      const recs = recommendOutfitsForApp(skinTone, items, { eventType: rotation[i] }, 15)
      const rec = recs[0]
      const outfitItems = rec ? appOutfitFromRecommendation(rec, items) : []
      const image = outfitItems[0]?.image_url ?? null
      return { day, date: dates[i], image, items: outfitItems }
    })
  }, [items, skinTone])



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

      {/* Today's planned outfit (from Week Planner) */}
      <Card className="p-5 border-2 border-primary/20 bg-muted/5">
        <div className="flex justify-between items-end border-b-2 border-primary pb-1 mb-4 gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-1">
              <Sparkles size={14} className="text-primary shrink-0" />
              Today&apos;s outfit
            </h3>
            {todaysOutfit.length > 0 && todayPlanEventKey ? (
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 leading-snug">
                From your week plan · {plannerEventLabel(todayPlanEventKey)}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.("planner")}
            className="h-6 shrink-0 px-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black"
          >
            <CalendarDays size={10} className="mr-1" />
            Planner
          </Button>
        </div>

        {todaysOutfit.length > 0 ? (
          <WardrobePlannedOutfitDetail
            outfit={todaysOutfit}
            skinTone={skinTone}
            plannerEventKey={todayPlanEventKey}
          />
        ) : (
          <div className="border-2 border-dashed border-primary/20 bg-muted/10 py-8 px-4 flex flex-col items-center gap-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
              No outfit planned for today. Mark today as an out day in the week planner, generate looks, and save your plan.
            </p>
            <Button
              className="border-2 font-black uppercase tracking-widest text-[10px] h-10"
              onClick={() => onNavigate?.("planner")}
            >
              <CalendarDays size={14} className="mr-2" />
              Open week planner
            </Button>
          </div>
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
                  <WardrobeImage
                    src={look.image}
                    alt={`Lookbook for ${look.day}`}
                    className="w-full h-full object-cover mix-blend-multiply transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-primary/30 pointer-events-none transition-colors" />
                </div>
              ) : look.items?.length ? (
                <div
                  className="aspect-[3/4] w-full border-2 border-primary/20 bg-muted relative overflow-hidden group cursor-pointer flex items-center justify-center p-1"
                  onClick={() => setSelectedDay(look)}
                >
                  <WardrobeImage
                    src={look.items[0].image_url}
                    alt={`Lookbook for ${look.day}`}
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full border-2 border-dashed border-primary/20 bg-muted/10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-center px-2">
                    No look
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
                {selectedDay.image ? (
                  <div className="aspect-[3/4] w-full border-2 border-primary/20 bg-muted relative">
                    <WardrobeImage
                      src={selectedDay.image}
                      alt={`Look for ${selectedDay.day}`}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 border-2 border-primary">
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">Logged</span>
                    </div>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
                    Items Worn
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDay.items?.map((item: WardrobeItem) => (
                      <div key={item.id} className="group p-1 flex flex-col border-2 border-primary/10 bg-muted/10">
                        <div className="aspect-[4/5] bg-muted w-full mb-1 border border-border">
                          <WardrobeImage src={item.image_url} alt={item.title} className="object-cover w-full h-full mix-blend-multiply" />
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
