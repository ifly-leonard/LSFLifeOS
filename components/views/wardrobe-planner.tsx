"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, RefreshCcw, Save, CalendarPlus, CalendarDays, Trash2 } from "lucide-react"
import { Status, Category, DUMMY_WARDROBE, WardrobeItem } from "@/lib/wardrobe-data"
import { buildBestOutfit, getValidSwapItem, analyzeOutfit } from "@/lib/color-engine"
import { toast } from "sonner"

type DayPlan = {
  id: string
  day: string
  date: string
  fullDate: Date
  goingOut: boolean
  eventType: string
  outfit: WardrobeItem[] | null
}

const EVENT_FORMALITY_MAP: Record<string, string> = {
  deep_work: "casual",
  office_day: "smart_casual",
  investor_pitch: "formal",
  networking: "smart_casual",
  media_appearance: "smart_casual",
  travel: "casual",
  gala_dinner: "formal"
}

const EVENT_OPTIONS = [
  { value: "deep_work", label: "Deep Work / Focus" },
  { value: "office_day", label: "Office / Team Sync" },
  { value: "investor_pitch", label: "Investor Pitch" },
  { value: "media_appearance", label: "Podcast / Media" },
  { value: "networking", label: "Networking / Dinner" },
  { value: "travel", label: "Airport / Travel" },
  { value: "gala_dinner", label: "Gala / Event" }
]

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

export function WardrobePlannerView() {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([])
  const [phase, setPhase] = useState<'setup' | 'review'>('setup')
  const [isGenerating, setIsGenerating] = useState(false)
  const [spinningDays, setSpinningDays] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const saved = localStorage.getItem("lifeos_wardrobe_plan")
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

  const generateSingleOutfit = (eventType: string) => {
    const available = DUMMY_WARDROBE.filter(i => i.status === Status.Clean)
    
    const targetFormality = EVENT_FORMALITY_MAP[eventType] || "casual"
    let formalityMatch = available.filter(i => i.formality === targetFormality)
    
    if (formalityMatch.length < 3) {
      formalityMatch = available
    }

    const tops = formalityMatch.filter(i => i.category === Category.Tops)
    const bottoms = formalityMatch.filter(i => i.category === Category.Bottoms)
    const footwear = formalityMatch.filter(i => i.category === Category.Footwear)
    const accessories = formalityMatch.filter(i => i.category === Category.Accessories)

    const fallbackCategory = (c: string) => available.filter(i => i.category === c as unknown as Category)

    const bestOutfit = buildBestOutfit(tops, bottoms, footwear, accessories, fallbackCategory)
    
    return bestOutfit || []
  }

  const handleAutoPlan = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setWeekPlan(prev => prev.map(day => {
        if (day.goingOut) {
          return { ...day, outfit: generateSingleOutfit(day.eventType) }
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
          return { ...day, outfit: generateSingleOutfit(eventType) }
        }
        return day
      }))
      setSpinningDays(prev => ({ ...prev, [id]: false }))
    }, 400)
  }

  const handleSwapSingleItem = (dayId: string, itemToSwap: WardrobeItem, eventType: string) => {
      setWeekPlan(prev => prev.map(day => {
          if (day.id === dayId && day.outfit) {
              const available = DUMMY_WARDROBE.filter(i => i.status === Status.Clean && i.category === itemToSwap.category && i.id !== itemToSwap.id)
              
              const targetFormality = EVENT_FORMALITY_MAP[eventType] || "casual"
              let match = available.filter(i => i.formality === targetFormality)
              
              if (match.length === 0) match = available
              
              if (match.length > 0) {
                  const newItem = getValidSwapItem(day.outfit, itemToSwap, match)
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
            return { ...d, outfit: generateSingleOutfit(d.eventType) }
         }
         return d
       }))
    }
  }

  const handleSaveState = () => {
    localStorage.setItem("lifeos_wardrobe_plan", JSON.stringify(weekPlan))
    toast("Plan saved securely", { description: "Your wardrobe choices are in the bag." })
  }

  const handleClearPlan = () => {
    if (confirm("Are you sure you want to clear your entire week plan?")) {
      localStorage.removeItem("lifeos_wardrobe_plan")
      setWeekPlan(getInitialWeek())
      setPhase('setup')
    }
  }

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeOS//Wardrobe Planner//EN\n"
    
    weekPlan.forEach(day => {
      if (day.goingOut && day.outfit) {
        const summary = `Outfit: ${day.eventType.replace('_', ' ').toUpperCase()}`
        const description = `Outfit Details:\\n` + day.outfit.map(item => `- ${item.title} (Color: ${item.primary_color})`).join('\\n')
        
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

  return (
    <div className="space-y-6 pb-24">
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
                        {EVENT_OPTIONS.map(opt => (
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
                      onValueChange={(val) => {
                        updateDay(day.id, { eventType: val })
                      }}
                    >
                      <SelectTrigger className="w-[160px] h-8 border-2 font-bold uppercase text-[10px] tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_OPTIONS.map(opt => (
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                          <Sparkles size={10} />
                          Assigned Look
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRegenerateDay(day.id, day.eventType)}
                          className="h-6 px-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black"
                          disabled={spinningDays[day.id]}
                        >
                          <RefreshCcw size={10} className={`mr-1 ${spinningDays[day.id] ? 'animate-spin' : ''}`} />
                          Swap Whole Look
                        </Button>
                      </div>

                      {/* Composition Engine Feedback */}
                      {(() => {
                        const { palette, ruleName } = analyzeOutfit(day.outfit)
                        return (
                          <div className="mb-3 px-2 py-2 bg-muted/10 border-2 border-primary/20 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Color Engine</span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary leading-none">
                                Rule: {ruleName}
                              </span>
                            </div>
                            <div className="flex border-2 border-black/80 shadow-sm bg-black/80">
                              {palette.map((colorHex, idx) => (
                                <div 
                                  key={idx} 
                                  className="w-4 h-4" 
                                  style={{ backgroundColor: colorHex }} 
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                      
                      <div className={`grid ${day.outfit.length > 3 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                        {day.outfit.map(item => (
                          <div 
                            key={item.id} 
                            className="group p-1 flex flex-col border-2 border-primary/10 bg-muted/10 cursor-pointer hover:border-primary/50 transition-colors relative"
                            onClick={() => handleSwapSingleItem(day.id, item, day.eventType)}
                            title="Click to swap this item"
                          >
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 z-10 bg-primary/10 p-1 rounded-full text-primary backdrop-blur-sm transition-opacity">
                               <RefreshCcw size={10} />
                            </div>
                            <div className="aspect-[4/5] bg-muted w-full mb-1 border border-border">
                              <img src={item.image_url} alt={item.title} className="object-cover w-full h-full mix-blend-multiply" />
                            </div>
                            <span className="font-bold uppercase text-[8px] line-clamp-2 leading-tight tracking-tight px-1 mb-1 group-hover:text-primary transition-colors">
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[7px] font-bold text-muted-foreground uppercase text-center mt-2 tracking-widest opacity-60">
                        Tap any item to swap it manually
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 cursor-pointer group" onClick={() => handleRegenerateDay(day.id, day.eventType)}>
                      <div className="border-2 border-dashed border-primary/20 py-4 flex flex-col items-center justify-center gap-1 group-hover:bg-primary/5 transition-colors">
                        <Sparkles size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                          Tap To Generate Outfit
                        </span>
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
