"use client"

import { Construction } from "lucide-react"

interface PlaceholderAppProps {
  name: string
}

export function PlaceholderAppView({ name }: PlaceholderAppProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-6">
      <Construction className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
      <h2 className="text-2xl font-black tracking-tighter uppercase">{name}</h2>
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        This app is currently under construction. Please check back later!
      </p>
    </div>
  )
}
