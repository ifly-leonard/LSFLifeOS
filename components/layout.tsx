"use client"

import type React from "react"

import { Calendar, Utensils, ShoppingCart, Settings, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: "today", icon: Clock, label: "Today" },
    { id: "week", icon: Calendar, label: "Week" },
    { id: "dishes", icon: Utensils, label: "Dishes" },
    { id: "groceries", icon: ShoppingCart, label: "Groceries" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="flex flex-col h-screen max-w-[390px] mx-auto bg-background border-x border-border shadow-2xl relative overflow-hidden">
      <header className="px-6 py-8 border-b border-border bg-white flex justify-between items-baseline">
        <h1 className="text-2xl font-bold tracking-tighter uppercase italic">DietOS</h1>
        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest">v1.0.0</span>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">{children}</main>

      <nav className="fixed bottom-0 w-full max-w-[390px] bg-white border-t border-border flex justify-around items-center py-4 z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === tab.id ? "text-primary scale-110" : "text-muted-foreground opacity-60 hover:opacity-100",
            )}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
