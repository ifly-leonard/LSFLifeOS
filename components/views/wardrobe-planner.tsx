"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, RefreshCcw, Save, CalendarPlus, CalendarDays, Trash2, LayoutGrid } from "lucide-react"
import { Category, Status, WardrobeItem } from "@/lib/wardrobe-data"
import { useWardrobeInventory } from "@/contexts/wardrobe-inventory-context"
import {
  recommendOutfitsForApp,
  appOutfitFromRecommendation,
  appWardrobeToEngineItems,
  evaluateOutfitRecommendation,
  plannerEventToEngineContext,
  bestSwapForAppOutfit,
} from "@/lib/outfit-engine"
import { toast } from "sonner"
import { WardrobePlannedOutfitDetail } from "@/components/wardrobe-planned-outfit-detail"
import { WARDROBE_PLAN_STORAGE_KEY } from "@/lib/wardrobe-plan"
import { PLANNER_EVENT_OPTIONS } from "@/lib/wardrobe-planner-events"
import { WardrobePlannerManualLookDialog } from "@/components/wardrobe-planner-manual-look-dialog"

type DayPlan = {
  id: string
  day: string
  date: string
  fullDate: Date
  goingOut: boolean
  eventType: string
  outfit: WardrobeItem[] | null
}

const getInitialWeek = (): DayPlan[] => {
   const today = new Date()
   // Reset to start of day for consistent comparison/saving
   today.setHours(0, 0, 0, 0)
   
   // Adjust to the Sunday of the current week
   const startOfWeek = new Date(today)
   startOfWeek.setDate(today.getDate() - today.getDay())
   
   const days: DayPlan[] = []
   const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
   
   for (let i = 0; i < 7; i++) {
     const d = new Date(startOfWeek)
     d.setDate(startOfWeek.getDate() + i)
     days.push({
       id: d.toISOString(),
       day: dayNames[d.getDay()],
       date: d.getDate().toString().padStart(2, '0'),
       fullDate: d,
       goingOut: false,
       eventType: "deep_work",
       outfit: null
     })
   }
   return days
}

interface WardrobePlannerViewProps {
  skinToneHex?: string
}

function isSwapCandidateStatus(s: Status): boolean {
  return s === Status.Ready || s === Status.Clean
}

export function WardrobePlannerView({
  skinToneHex = "#e0ac69",
}: WardrobePlannerViewProps) {
  const { items: wardrobeItems } = useWardrobeInventory()
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([])
  const [phase, setPhase] = useState<'setup' | 'review'>('setup')
  const [isGenerating, setIsGenerating] = useState(false)
  const [spinningDays, setSpinningDays] = useState<Record<string, boolean>>({})
  /** Per-day offset into ranked `recommendOutfits` (deterministic “next look”). */
  const outfitVariantRef = useRef<Record<string, number>>({})
  const [manualBuildDayId, setManualBuildDayId] = useState<string | null>(null)

  useEffect(() => {
    if (phase !== "review" || weekPlan.length === 0) return
    try {
      localStorage.setItem(WARDROBE_PLAN_STORAGE_KEY, JSON.stringify(weekPlan))
      window.dispatchEvent(new Event("wardrobe-plan-updated"))
    } catch {
      /* storage full or disabled */
    }
  }, [weekPlan, phase])

  useEffect(() => {
    const saved = localStorage.getItem(WARDROBE_PLAN_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) {
          const hydrated = parsed.map((p: any) => ({ ...p, fullDate: new Date(p.fullDate) }))
          setWeekPlan(hydrated)
          setPhase('review')
          return
        }
      } catch (e) {
        console.error("Failed to parse saved plan", e)
      }
    }
    setWeekPlan(getInitialWeek())
  }, [])

  const generateSingleOutfit = (
    eventKey: string,
    dayId: string,
    opts?: { advanceVariant?: boolean; resetVariant?: boolean },
  ) => {
    if (opts?.resetVariant) outfitVariantRef.current[dayId] = 0
    if (opts?.advanceVariant) {
      outfitVariantRef.current[dayId] =
        (outfitVariantRef.current[dayId] ?? 0) + 1
    }
    const ctx = plannerEventToEngineContext(eventKey)
    const recs = recommendOutfitsForApp(
      skinToneHex,
      wardrobeItems,
      { eventType: ctx.eventType, formality: ctx.formality },
      40,
    )
    if (!recs.length) return []
    const v = outfitVariantRef.current[dayId] ?? 0
    const pick = recs[v % recs.length]
    return appOutfitFromRecommendation(pick, wardrobeItems)
  }

  /** Review phase: changing event re-runs the engine for that day (ranked pick #0). */
  const setDayEventTypeInReview = (dayId: string, eventType: string) => {
    setWeekPlan((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const next = { ...d, eventType }
        if (phase === "review" && d.goingOut) {
          outfitVariantRef.current[dayId] = 0
          next.outfit = generateSingleOutfit(eventType, dayId, {})
        }
        return next
      }),
    )
  }

  const handleAutoPlan = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setWeekPlan(prev => prev.map(day => {
        if (day.goingOut) {
          outfitVariantRef.current[day.id] = 0
          return {
            ...day,
            outfit: generateSingleOutfit(day.eventType, day.id, {}),
          }
        }
        return { ...day, outfit: null }
      }))
      setPhase('review')
      setIsGenerating(false)
    }, 800)
  }

  const handleRegenerateDay = (id: string, eventType: string) => {
    setSpinningDays(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setWeekPlan(prev => prev.map(day => {
        if (day.id === id) {
          const hadOutfit = Boolean(day.outfit && day.outfit.length > 0)
          return {
            ...day,
            outfit: generateSingleOutfit(eventType, id, {
              advanceVariant: hadOutfit,
              resetVariant: !hadOutfit,
            }),
          }
        }
        return day
      }))
      setSpinningDays(prev => ({ ...prev, [id]: false }))
    }, 400)
  }

  const handleSwapSingleItem = (dayId: string, itemToSwap: WardrobeItem, eventType: string) => {
      setWeekPlan(prev => prev.map(day => {
          if (day.id === dayId && day.outfit) {
              const available = wardrobeItems.filter(
                i => isSwapCandidateStatus(i.status) && i.category === itemToSwap.category && i.id !== itemToSwap.id,
              )
              const ctx = plannerEventToEngineContext(eventType)
              if (available.length > 0) {
                const newItem = bestSwapForAppOutfit(
                  skinToneHex,
                  wardrobeItems,
                  day.outfit,
                  itemToSwap,
                  available,
                  { eventType: ctx.eventType, formality: ctx.formality },
                )
                if (newItem) {
                  const newOutfit = day.outfit.map(i => i.id === itemToSwap.id ? newItem : i)
                  return { ...day, outfit: newOutfit }
                }
              }
          }
          return day
      }))
  }

  const updateDay = (id: string, updates: Partial<DayPlan>) => {
    setWeekPlan(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    if (updates.goingOut === false && phase === 'review') {
      setWeekPlan(prev => prev.map(d => d.id === id ? { ...d, outfit: null } : d))
    }
    if (updates.goingOut === true && phase === 'review') {
       // Auto-generate immediately if flipped to OUT in review phase
       setWeekPlan(prev => prev.map(d => {
         if (d.id === id && !d.outfit) {
            return {
              ...d,
              outfit: generateSingleOutfit(d.eventType, d.id, {
                resetVariant: true,
              }),
            }
         }
         return d
       }))
    }
  }

  const handleSaveState = () => {
    localStorage.setItem(WARDROBE_PLAN_STORAGE_KEY, JSON.stringify(weekPlan))
    window.dispatchEvent(new Event("wardrobe-plan-updated"))
    toast("Plan saved securely", { description: "Your wardrobe choices are in the bag." })
  }

  const handleClearPlan = () => {
    if (confirm("Are you sure you want to clear your entire week plan?")) {
      localStorage.removeItem(WARDROBE_PLAN_STORAGE_KEY)
      setWeekPlan(getInitialWeek())
      setPhase('setup')
    }
  }

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeOS//Wardrobe Planner//EN\n"
    
    weekPlan.forEach(day => {
      if (day.goingOut && day.outfit) {
        const summary = `Outfit: ${day.eventType.replace('_', ' ').toUpperCase()}`
        const pe = plannerEventToEngineContext(day.eventType)
        const engine = appWardrobeToEngineItems(day.outfit)
        const rec = evaluateOutfitRecommendation(
          skinToneHex,
          engine,
          pe.eventType,
          pe.formality,
        )
        const reasonLine = rec
          ? `\\nEngine: ${rec.paletteType} (${rec.score.toFixed(1)}) — ${rec.reason}`
          : ""
        const description =
          `Outfit Details:\\n` +
          day.outfit.map((item) => `- ${item.title} (Color: ${item.primary_color})`).join("\\n") +
          reasonLine
        
        const d = new Date(day.fullDate)
        // Set event time to 9 AM
        d.setHours(9, 0, 0, 0)
        
        const formatICSDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }
        
        const dtstart = formatICSDate(d)
        // Add 1 hour duration
        const endD = new Date(d.getTime() + 60 * 60 * 1000)
        const dtend = formatICSDate(endD)

        icsContent += "BEGIN:VEVENT\n"
        icsContent += `DTSTART:${dtstart}\n`
        icsContent += `DTEND:${dtend}\n`
        icsContent += `SUMMARY:${summary}\n`
        icsContent += `DESCRIPTION:${description}\n`
        icsContent += "END:VEVENT\n"
      }
    })

    icsContent += "END:VCALENDAR"
    
    // Trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'wardrobe_plan.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast("Calendar File Generated", { description: "Your .ics file has been downloaded." })
  }

  if (!weekPlan.length) return null // loading state

  const manualBuildDay = manualBuildDayId
    ? weekPlan.find((d) => d.id === manualBuildDayId)
    : null

  return (
    <div className="space-y-6 pb-24">
      <WardrobePlannerManualLookDialog
        open={manualBuildDayId !== null}
        onOpenChange={(o) => !o && setManualBuildDayId(null)}
        wardrobeItems={wardrobeItems}
        initialOutfit={manualBuildDay?.outfit ?? null}
        onApply={(outfit) => {
          if (!manualBuildDayId) return
          setWeekPlan((prev) =>
            prev.map((d) =>
              d.id === manualBuildDayId ? { ...d, outfit } : d,
            ),
          )
          setManualBuildDayId(null)
          const hasCore = [Category.Tops, Category.Bottoms, Category.Footwear].every(
            (cat) => outfit.some((i) => i.category === cat),
          )
          toast("Look applied", {
            description: hasCore
              ? "Swap pieces or run the engine any time."
              : "Swap pieces or run the engine any time. Add top, bottom, and shoes for a full outfit.",
          })
        }}
      />
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black uppercase tracking-tighter">Week Planner</h2>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Automate your week's outfits
          </p>
        </div>
        {phase === 'review' && (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleSaveState} className="w-8 h-8 border-2" title="Save Plan">
              <Save size={14} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportICS} className="w-8 h-8 border-2" title="Export to Calendar">
              <CalendarPlus size={14} />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleClearPlan} className="w-8 h-8 border-2" title="Clear Plan">
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      {phase === 'setup' ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <Card className="p-4 border-2 border-primary/20 space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-1">
                Step 1: Planning days
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Toggle the days you want to plan outfits for.
              </p>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
               {weekPlan.map(day => (
                 <Button
                   key={day.id}
                   variant={day.goingOut ? 'default' : 'outline'}
                   className={`h-12 w-full flex flex-col items-center justify-center p-0 border-2 transition-all ${!day.goingOut ? 'border-dashed' : ''}`}
                   onClick={() => updateDay(day.id, { goingOut: !day.goingOut })}
                 >
                   <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{day.day}</span>
                   <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">{day.date}</span>
                 </Button>
               ))}
            </div>
          </Card>

          {weekPlan.some(d => d.goingOut) && (
            <Card className="p-4 border-2 border-primary/20 space-y-4 animate-in slide-in-from-top-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-1">
                  Step 2: Event Types
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Set the vibe for your selected days.
                </p>
              </div>

              <div className="space-y-3">
                {weekPlan.filter(d => d.goingOut).map(day => (
                   <div key={`event-${day.id}`} className="flex justify-between items-center bg-muted/10 p-2 border-2 border-primary/10">
                     <span className="text-[11px] font-black uppercase tracking-widest flex w-24">
                       {day.day} {day.date}
                     </span>
                     <Select 
                      value={day.eventType} 
                      onValueChange={(val) => updateDay(day.id, { eventType: val })}
                     >
                      <SelectTrigger className="w-[180px] h-8 border-2 font-bold uppercase text-[10px] tracking-widest bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANNER_EVENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="font-bold uppercase text-[10px] tracking-widest">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                     </Select>
                   </div>
                ))}
              </div>
            </Card>
          )}

          <Button 
            className="w-full h-14 border-2 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            onClick={handleAutoPlan}
            disabled={!weekPlan.some(d => d.goingOut) || isGenerating}
          >
            <Sparkles size={16} className={isGenerating ? "animate-pulse text-yellow-300" : ""} />
            {isGenerating ? "PLANNING..." : "AUTO-PLAN SELECTED DAYS"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
          <Button 
            variant="outline"
            className="w-full h-10 border-2 border-dashed font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 mb-2"
            onClick={() => setPhase('setup')}
          >
            <CalendarDays size={14} />
            MODIFY PLANNING DAYS
          </Button>
          
          {weekPlan.filter(day => day.goingOut).map(day => (
            <Card key={day.id} className="p-4 border-2 border-primary/20">
              {/* Day Header */}
              <div className="flex justify-between items-start mb-4 border-b-2 border-primary/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-xl font-black uppercase tracking-tighter leading-none">{day.day}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {day.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex gap-1 w-40">
                  <Button 
                    variant={!day.goingOut ? "default" : "outline"} 
                    className="flex-1 h-8 px-2 border-2 font-black uppercase text-[10px] tracking-widest leading-none bg-muted/20"
                    style={!day.goingOut ? { backgroundColor: 'black', color: 'white' } : {}}
                    onClick={() => updateDay(day.id, { goingOut: false })}
                  >
                    IN
                  </Button>
                  <Button 
                    variant={day.goingOut ? "default" : "outline"}
                    className="flex-1 h-8 px-2 border-2 font-black uppercase text-[10px] tracking-widest leading-none"
                    onClick={() => updateDay(day.id, { goingOut: true })}
                  >
                    OUT
                  </Button>
                </div>
              </div>

              {/* Event Settings */}
              {day.goingOut && (
                <div className="animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Event Style</span>
                    <Select 
                      value={day.eventType} 
                      onValueChange={(val) => setDayEventTypeInReview(day.id, val)}
                    >
                      <SelectTrigger className="w-[160px] h-8 border-2 font-bold uppercase text-[10px] tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANNER_EVENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="font-bold uppercase text-[10px] tracking-widest">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Outfit Area */}
                  {day.outfit ? (
                    <div className="pt-2 border-t-2 border-dashed border-primary/10">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                          <Sparkles size={10} />
                          Planned look
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManualBuildDayId(day.id)}
                            className="h-6 px-2 text-[8px] font-bold uppercase tracking-widest border-2"
                          >
                            <LayoutGrid size={10} className="mr-1 shrink-0" />
                            Build look
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateDay(day.id, day.eventType)}
                            className="h-6 px-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black"
                            disabled={spinningDays[day.id]}
                          >
                            <RefreshCcw size={10} className={`mr-1 ${spinningDays[day.id] ? "animate-spin" : ""}`} />
                            Engine
                          </Button>
                        </div>
                      </div>

                      <Card className="p-4 border-2 border-primary/20 bg-muted/5">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-3 leading-snug">
                          Outfit breakdown — palette, engine score &amp; skin-tone composition for this day.
                        </p>
                        <WardrobePlannedOutfitDetail
                          outfit={day.outfit}
                          skinTone={skinToneHex}
                          plannerEventKey={day.eventType}
                          onItemClick={(item) => handleSwapSingleItem(day.id, item, day.eventType)}
                          tapHint="Tap any piece to swap it"
                        />
                      </Card>
                    </div>
                  ) : (
                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto min-h-14 border-2 py-3 flex flex-col items-center justify-center gap-1 font-black uppercase"
                          onClick={() => setManualBuildDayId(day.id)}
                        >
                          <LayoutGrid size={16} className="text-primary" />
                          <span className="text-[9px] tracking-widest">Build look manually</span>
                          <span className="text-[7px] font-bold text-muted-foreground normal-case tracking-normal px-1">
                            Type, color, saved looks
                          </span>
                        </Button>
                        <button
                          type="button"
                          className="border-2 border-dashed border-primary/20 py-3 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 transition-colors rounded-md"
                          onClick={() => handleRegenerateDay(day.id, day.eventType)}
                        >
                          <Sparkles size={16} className="text-muted-foreground" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            Engine suggestion
                          </span>
                          <span className="text-[7px] font-bold text-muted-foreground normal-case tracking-normal px-1">
                            Rules-first ranked pick
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
