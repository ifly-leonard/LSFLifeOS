"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import {
  Category,
  Color,
  Formality,
  DUMMY_WARDROBE,
  WardrobeItem,
  Status
} from "@/lib/wardrobe-data"

const NEUTRAL_COLORS = [Color.Black, Color.White, Color.Grey, Color.Beige, Color.Brown, Color.Navy]
const ACCENT_COLORS = Object.values(Color).filter(c => !NEUTRAL_COLORS.includes(c))

export function WardrobeOSView() {
  const [items, setItems] = useState<WardrobeItem[]>(DUMMY_WARDROBE)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all")
  const [selectedFormality, setSelectedFormality] = useState<Formality | "all">("all")
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const stats = useMemo(() => {
    const totalItems = items.length

    // Color distribution
    const colorCounts = items.reduce((acc, item) => {
      acc[item.primary_color] = (acc[item.primary_color] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const colorDistribution = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count, percentage: totalItems ? Math.round((count / totalItems) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)

    const ownedColors = Object.keys(colorCounts)
    const allColors = Object.values(Color)
    const missingColors = allColors.filter(c => !ownedColors.includes(c))

    // Neutral vs Accent
    const neutralCount = items.filter(item => NEUTRAL_COLORS.includes(item.primary_color)).length
    const accentCount = totalItems - neutralCount
    const neutralPercentage = totalItems ? Math.round((neutralCount / totalItems) * 100) : 0

    // Category coverage
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categories = Object.values(Category).map(cat => ({
      name: cat,
      count: categoryCounts[cat] || 0
    }))

    // Duplicates (Same subcategory & color)
    const itemSignatures = items.map(i => `${i.subcategory}-${i.primary_color}`)
    const duplicates = itemSignatures.filter((sig, index, self) => self.indexOf(sig) !== index)
    // Find the actual items that are duplicated
    const duplicatedItems = items.filter(i => duplicates.includes(`${i.subcategory}-${i.primary_color}`))
    // Group duplicates
    const duplicateGroups = duplicates.reduce((acc, sig) => {
      acc[sig] = items.filter(i => `${i.subcategory}-${i.primary_color}` === sig).length
      return acc
    }, {} as Record<string, number>)

    return {
      totalItems,
      colorDistribution,
      missingColors,
      neutralPercentage,
      accentPercentage: 100 - neutralPercentage,
      categories,
      duplicateGroups
    }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchFormality = selectedFormality === "all" || item.formality === selectedFormality
      
      return matchSearch && matchCategory && matchFormality
    })
  }, [items, searchQuery, selectedCategory, selectedFormality])

  const categories = ["all", ...Object.values(Category)]
  const formalities = ["all", ...Object.values(Formality)]

  const handleItemClick = (item: WardrobeItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.Clean: return "bg-green-500"
      case Status.Dirty: return "bg-red-500"
      case Status.Ironing: return "bg-yellow-500"
      default: return "bg-muted"
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-primary pb-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black uppercase tracking-tighter">Inventory</h2>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Browse and coordinate your wardrobe
          </p>
        </div>
        <button
          className="bg-primary text-white p-1 hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Stats Card */}
      <Card 
        className="p-4 border-2 border-primary/20 bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors" 
        onClick={() => setShowStats(!showStats)}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Total Items</span>
            <span className="text-lg font-black">{items.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Currently Clean</span>
            <span className="text-lg font-black text-green-600">{items.filter(i => i.status === Status.Clean).length}</span>
          </div>
          <div className="flex flex-col items-end justify-center">
             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest border-2 border-primary bg-primary text-white px-2 py-1">
               {showStats ? "HIDE INSIGHTS" : "VIEW INSIGHTS"}
             </span>
          </div>
        </div>
      </Card>

      {showStats && (
        <div className="space-y-4 animate-in slide-in-from-top-2 mb-4">
          {/* Category Coverage Overview */}
          <Card className="p-5 border-2 border-primary/20">
            <h3 className="text-sm font-black uppercase tracking-tighter mb-4 border-b-2 border-primary pb-1">
              Category Coverage
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {stats.categories.map(cat => (
                <div key={cat.name} className="flex flex-col items-center">
                  <div className="w-full flex justify-center py-3 bg-muted border-2 border-primary/10 mb-2">
                    <span className="text-lg font-black">{cat.count}</span>
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center leading-tight">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Balance Insight */}
            <Card className="p-4 border-2 border-primary/20 bg-muted/30">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                Neutral / Accent Match
              </span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black">{stats.neutralPercentage}%</span>
                <span className="text-[10px] font-black uppercase text-muted-foreground">Neutral</span>
              </div>
              <div className="flex h-3 w-full border-2 border-primary/20 mb-1 bg-primary/20">
                <div className="h-full bg-primary" style={{ width: `${stats.neutralPercentage}%` }} />
              </div>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {stats.accentPercentage}% Accents
              </span>
            </Card>

            {/* Owned Palette Visualization */}
            <Card className="p-4 border-2 border-primary/20 bg-muted/30">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                Active Palette
              </span>
              <div className="flex flex-wrap gap-2">
                {stats.colorDistribution.map((cd) => (
                  <div 
                    key={cd.color}
                    className="w-6 h-6 border-2 border-primary/20 shadow-sm transition-transform hover:scale-110" 
                    style={{ backgroundColor: cd.color === 'navy' ? '#1e3a8a' : cd.color === 'maroon' ? '#7f1d1d' : cd.color === 'olive' ? '#3f6212' : cd.color }} 
                    title={`${cd.color} - ${cd.count} items`}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Color Distribution Breakdown */}
          <Card className="p-5 border-2 border-primary/20">
            <h3 className="text-sm font-black uppercase tracking-tighter mb-4 border-b-2 border-primary pb-1">
              Color Dominance
            </h3>
            <div className="space-y-3">
              {stats.colorDistribution.map((cd) => (
                <div key={cd.color} className="flex items-center gap-3">
                  <span className="w-16 text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                    {cd.color}
                  </span>
                  <div className="flex-1 h-3 border-2 border-primary/10 bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${cd.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-black">
                    {cd.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Gap Analysis */}
          {stats.missingColors.length > 0 && (
            <Card className="p-5 border-2 border-yellow-500/30 bg-yellow-500/5">
              <h3 className="text-sm font-black uppercase tracking-tighter mb-2 text-yellow-700 pb-1">
                Gap Analysis
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Colors completely missing from wardrobe
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.missingColors.map(color => (
                  <span key={color} className="px-2 py-1 border-2 border-yellow-500/30 text-[10px] font-black uppercase tracking-widest text-yellow-700 bg-white">
                    {color}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Duplicate Detection */}
          {Object.keys(stats.duplicateGroups).length > 0 && (
            <Card className="p-5 border-2 border-red-500/30 bg-red-500/5">
              <h3 className="text-sm font-black uppercase tracking-tighter mb-2 text-red-700 pb-1">
                Duplicate Detection
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Potential redundancies based on color and subcategory
              </p>
              <div className="space-y-2">
                {Object.entries(stats.duplicateGroups).map(([sig, count]) => {
                  const [sub, col] = sig.split('-')
                  return (
                    <div key={sig} className="flex justify-between items-center py-2 border-b border-red-500/20 last:border-0 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-red-500/30" style={{ backgroundColor: col === 'navy' ? '#1e3a8a' : col === 'maroon' ? '#7f1d1d' : col === 'olive' ? '#3f6212' : col }} />
                        <span className="font-bold text-xs uppercase tracking-tight text-red-900 leading-none">
                          {col} {sub}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-1">
                        {count} items
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="SEARCH BY ITEM OR SUB..."
              className="pl-10 h-12 border-2 font-bold uppercase text-xs tracking-widest w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
            className="h-12 border-2 px-3"
            aria-label="Toggle filters"
          >
            <Filter size={16} />
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
            <Select value={selectedCategory} onValueChange={(val: any) => setSelectedCategory(val)}>
              <SelectTrigger className="flex-1 h-12 border-2 font-bold uppercase text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="uppercase font-bold text-xs tracking-widest leading-tight">
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFormality} onValueChange={(val: any) => setSelectedFormality(val)}>
              <SelectTrigger className="flex-1 h-12 border-2 font-bold uppercase text-xs">
                <SelectValue placeholder="Formality" />
              </SelectTrigger>
              <SelectContent>
                {formalities.map((fw) => (
                  <SelectItem key={fw} value={fw} className="uppercase font-bold text-xs tracking-widest leading-tight">
                    {fw === "all" ? "All Formality" : fw.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground font-bold uppercase text-xs tracking-widest">
          No items found
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group p-2 flex flex-col border-2 border-primary/10 hover:border-primary transition-colors cursor-pointer active:scale-[0.98] overflow-hidden"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative aspect-[4/5] bg-muted w-full mb-2 border border-border">
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="object-cover w-full h-full mix-blend-multiply"
                  loading="lazy"
                />
                <div className="absolute top-1 left-1 flex gap-1 flex-col">
                  {item.status !== Status.Clean && (
                    <span className="text-[6px] font-black uppercase tracking-widest bg-red-500 text-white px-1 py-0.5">
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <h3 className="font-bold uppercase text-xs flex-1 line-clamp-2 leading-tight tracking-tight">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-primary text-primary">
                    {item.subcategory}
                  </span>
                  <div className="flex items-center gap-1 border border-border px-1">
                    <div className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: item.primary_color }} />
                    <span className="text-[7px] font-black uppercase tracking-widest">{item.primary_color}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Item Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] rounded-none sm:rounded-lg">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter pr-4">{selectedItem.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-2 py-1">
                    {selectedItem.category}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-1">
                    {selectedItem.formality.replace("_", " ")}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 text-white ${
                    selectedItem.status === Status.Clean ? "bg-green-600" :
                    selectedItem.status === Status.Dirty ? "bg-red-600" : "bg-yellow-600"
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>

                <div className="aspect-square bg-muted w-full border-2 border-primary/20 relative">
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.title} 
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                  <div className="absolute bottom-2 right-2 bg-white/90 p-2 border-2 border-primary font-black uppercase tracking-widest text-[10px]">
                    Wears: {selectedItem.wear_count}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 border-2 border-primary/20">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">
                        Material
                      </span>
                      <span className="text-xs font-black uppercase tracking-tight text-center leading-tight">{selectedItem.material}</span>
                    </div>
                  </Card>
                  <Card className="p-3 border-2 border-primary/20">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">
                        Fit
                      </span>
                      <span className="text-xs font-black uppercase tracking-tight text-center leading-tight">{selectedItem.fit}</span>
                    </div>
                  </Card>
                  <Card className="p-3 border-2 border-primary/20">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">
                        Pattern
                      </span>
                      <span className="text-xs font-black uppercase tracking-tight text-center leading-tight">{selectedItem.pattern}</span>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
                    Color Profile
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 border-2 border-primary/20" style={{ backgroundColor: selectedItem.primary_color }} />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Main</span>
                    </div>
                    {selectedItem.secondary_colors.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 border-2 border-primary/20" style={{ backgroundColor: color }} />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Acc</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-2 border-primary pb-1">
                    History
                  </h3>
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground text-xs">Last Worn</span>
                    <span>{new Date(selectedItem.last_worn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
