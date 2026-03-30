"use client"

import { Card } from "@/components/ui/card"
import { Utensils, Shirt, WashingMachine, FileText } from "lucide-react"
import type { ElementType } from "react"

interface LauncherProps {
  onSelectApp: (app: string) => void
}

interface AppOption {
  id: string
  name: string
  icon: ElementType
}

const apps: AppOption[] = [
  { id: "lifeos", name: "Diet", icon: Utensils },
  { id: "wardrobeos", name: "Wardrobe", icon: Shirt },
  { id: "laundryos", name: "Laundry", icon: WashingMachine },
  { id: "sops", name: "SOPs", icon: FileText },
]

export function LauncherView({ onSelectApp }: LauncherProps) {
  return (
    <div className="space-y-6 flex flex-col items-center justify-center h-full pt-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Life OS</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          Exclusive for Leonard Selvaraja Fernando's life.
        </p>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-4">
          Select an application
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full px-4">
        {apps.map((app) => (
          <Card
            key={app.id}
            className="flex flex-col items-center justify-center p-6 cursor-pointer border-2 hover:border-primary transition-all hover:scale-105 active:scale-95 shadow-sm"
            onClick={() => onSelectApp(app.id)}
          >
            <app.icon className="w-12 h-12 mb-4 text-black dark:text-white" strokeWidth={1.5} />
            <span className="text-sm font-bold uppercase tracking-widest text-center">{app.name}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
