"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LifeOSState } from "@/lib/lifeos-state"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ImagePlus, Pipette } from "lucide-react"

export function WardrobeSettingsView({ state, updateState, onNavigate }: { state: LifeOSState; updateState: (s: LifeOSState) => void; onNavigate: (tab: string) => void }) {
  const wardrobe = state.settings.wardrobe || { skinTone: "#e0ac69", bodyType: "athletic", dressingPreference: "minimalist" }
  const [photoUrl, setPhotoUrl] = useState<string | null>(wardrobe.skinToneImage || null)
  const [pickingColor, setPickingColor] = useState<string | null>(wardrobe.skinTone || null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ObjectUrl = URL.createObjectURL(file)
      setPhotoUrl(ObjectUrl)
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        const img = new Image()
        img.onload = () => {
          const MAX_STORAGE_SIZE = 300
          let w = img.width
          let h = img.height
          if (w > MAX_STORAGE_SIZE || h > MAX_STORAGE_SIZE) {
            if (w > h) {
              h = Math.floor(h * (MAX_STORAGE_SIZE / w))
              w = MAX_STORAGE_SIZE
            } else {
              w = Math.floor(w * (MAX_STORAGE_SIZE / h))
              h = MAX_STORAGE_SIZE
            }
          }
          
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = w
          tempCanvas.height = h
          const ctx = tempCanvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) return
          ctx.drawImage(img, 0, 0, w, h)
          
          // Auto extract from center region
          const cx = Math.floor(w / 2)
          const cy = Math.floor(h / 2)
          const s = 40 // 40x40 center sample
          const sx = Math.max(0, cx - 20)
          const sy = Math.max(0, cy - 20)
          const sw = Math.min(s, w)
          const sh = Math.min(s, h)
          
          const imgData = ctx.getImageData(sx, sy, sw, sh).data
          let r = 0, g = 0, b = 0, count = 0
          for (let i = 0; i < imgData.length; i += 4) {
            r += imgData[i]
            g += imgData[i+1]
            b += imgData[i+2]
            count++
          }
          const autoHex = "#" + [Math.floor(r/count), Math.floor(g/count), Math.floor(b/count)].map(v => v.toString(16).padStart(2, '0')).join('')
          
          const resizedDataUrl = tempCanvas.toDataURL("image/jpeg", 0.7)
          
          setPickingColor(autoHex)
          setPhotoUrl(resizedDataUrl)
          
          updateState({ 
            ...state, 
            settings: { 
              ...state.settings, 
              wardrobe: { 
                ...wardrobe, 
                skinTone: autoHex,
                skinToneImage: resizedDataUrl
              } 
            } 
          })
        }
        img.src = base64
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.floor((clientX - rect.left) * scaleX)
    const y = Math.floor((clientY - rect.top) * scaleY)

    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = "#" + [pixel[0], pixel[1], pixel[2]].map(val => val.toString(16).padStart(2, '0')).join('')
    
    setPickingColor(hex)
    updateState({ ...state, settings: { ...state.settings, wardrobe: { ...wardrobe, skinTone: hex } } })
  }

  useEffect(() => {
    if (!photoUrl || !canvasRef.current) return
    const img = new Image()
    img.src = photoUrl
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      
      const MAX_SIZE = 300
      let w = img.width
      let h = img.height
      if (w > MAX_SIZE || h > MAX_SIZE) {
        if (w > h) {
          h *= MAX_SIZE / w
          w = MAX_SIZE
        } else {
          w *= MAX_SIZE / h
          h = MAX_SIZE
        }
      }
      
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)
    }
  }, [photoUrl])

  return (
    <div className="space-y-6 pb-24 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-start mb-6 border-b-2 border-primary pb-2">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Settings</h2>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Wardrobe Engine Configuration
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors border-2 border-transparent hover:border-black/5" onClick={() => onNavigate("dashboard")}>
          <LayoutDashboard size={18} />
        </Button>
      </div>

      <Card className="p-4 border-2 border-primary/20 space-y-6">
        <div>
            <label className="text-[10px] font-black uppercase flex justify-between items-center mb-3 text-primary tracking-widest">
              <span>Base Skin Tone Extraction</span>
              <div 
                className="w-5 h-5 rounded-full border-2 border-black/20 shadow-sm transition-colors duration-300" 
                style={{ backgroundColor: pickingColor || wardrobe.skinTone }} 
              />
            </label>
            
            <div className="border-2 border-dashed border-primary/20 bg-muted/30 rounded flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
              {!photoUrl ? (
                <div className="flex flex-col items-center p-6 text-center cursor-pointer hover:bg-black/5 transition-colors w-full h-full" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={28} className="text-primary mb-3 opacity-60" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Capture Self Portrait</span>
                  <span className="text-[8px] font-bold text-muted-foreground mt-2 px-2 leading-snug uppercase tracking-widest">
                    Take a photo in white/natural light. You can then extract your exact skin tone.
                  </span>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center p-3">
                  <div className="text-[8px] font-black uppercase text-primary tracking-widest mb-3 flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <Pipette size={12} /> Tap your skin on the image
                  </div>
                  <canvas 
                    ref={canvasRef} 
                    onClick={handleCanvasClick}
                    onTouchStart={handleCanvasClick}
                    className="max-w-full h-auto cursor-crosshair rounded border-2 border-black/10 shadow-md active:scale-[0.98] transition-transform"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4 text-[9px] h-7 font-black uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white"
                    onClick={() => { 
                      setPhotoUrl(null); 
                      setPickingColor(null); 
                      // Hard reset removes the image
                      updateState({ ...state, settings: { ...state.settings, wardrobe: { ...wardrobe, skinToneImage: undefined } } })
                    }}
                  >
                    Hard Reset Photo
                  </Button>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-3 leading-snug">
              This anchors the base color match for your composition fit check in the dashboard generator.
            </p>
        </div>

        <div className="border-t-2 border-primary/10 pt-4">
            <label className="text-[10px] font-black uppercase block mb-2 text-primary tracking-widest">Global Body Topology</label>
            <Select value={wardrobe.bodyType} onValueChange={(val) => updateState({ ...state, settings: { ...state.settings, wardrobe: { ...wardrobe, bodyType: val } } })}>
            <SelectTrigger className="h-10 border-2 font-bold uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="slim" className="font-bold uppercase text-[10px] tracking-widest">Slim</SelectItem>
                <SelectItem value="athletic" className="font-bold uppercase text-[10px] tracking-widest">Athletic</SelectItem>
                <SelectItem value="broad" className="font-bold uppercase text-[10px] tracking-widest">Broad / Heavy</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="border-t-2 border-primary/10 pt-4">
            <label className="text-[10px] font-black uppercase block mb-2 text-primary tracking-widest">Generative Preference</label>
            <Select value={wardrobe.dressingPreference} onValueChange={(val) => updateState({ ...state, settings: { ...state.settings, wardrobe: { ...wardrobe, dressingPreference: val } } })}>
            <SelectTrigger className="h-10 border-2 font-bold uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="minimalist" className="font-bold uppercase text-[10px] tracking-widest">Minimalist & Clean</SelectItem>
                <SelectItem value="streetwear" className="font-bold uppercase text-[10px] tracking-widest">Streetwear</SelectItem>
                <SelectItem value="classic" className="font-bold uppercase text-[10px] tracking-widest">Classic Menswear</SelectItem>
            </SelectContent>
            </Select>
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-snug">
              Instructs the auto-planner on the overall stylistic strictness of suggestions.
            </p>
        </div>
      </Card>
    </div>
  )
}
