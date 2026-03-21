"use client"

import type React from "react"
import Image from "next/image"

import { Calendar, Utensils, ShoppingCart, Settings, Home, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface LayoutProps {
  children: React.ReactNode
  activeTab?: string
  setActiveTab?: (tab: string) => void
  activeApp?: string
  setActiveApp?: (app: string) => void
}

const OS_NAMES: Record<string, string> = {
  launcher: "Life OS",
  dietos: "Diet",
  wardrobeos: "Wardrobe",
  laundryos: "Laundry",
  sops: "SOPs"
}

export function Layout({ children, activeTab, setActiveTab, activeApp = "launcher", setActiveApp }: LayoutProps) {
  const [versionModalOpen, setVersionModalOpen] = useState(false)

  const handleHardRefresh = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }
    window.location.reload()
  }
  const tabs = [
    { id: "today", icon: Home, label: "Home" },
    { id: "week", icon: Calendar, label: "Planner" },
    { id: "dishes", icon: Utensils, label: "Dishes" },
    { id: "groceries", icon: ShoppingCart, label: "Groceries" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  const title = OS_NAMES[activeApp] || "Life OS"

  return (
    <div className="flex flex-col h-screen max-w-[390px] mx-auto bg-background border-x border-border shadow-2xl relative overflow-hidden">
      <header className="px-6 py-8 border-b border-border bg-white flex justify-between items-baseline">
        <div className="flex items-center gap-2">
          {activeApp !== "launcher" && setActiveApp && (
            <button onClick={() => setActiveApp("launcher")} className="mr-2 hover:opacity-70 transition-opacity">
              <ChevronLeft size={24} />
            </button>
          )}
          <Image
            src="/lsf-branding/LSF Lion Logo Dark.png"
            alt="LSF Logo"
            width={80}
            height={32}
            className="h-8 w-auto hidden"
            priority
          />
          <span className="text-2xl font-bold tracking-tighter [font-variant:small-caps]">{title}</span>
        </div>
        <span 
          className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest cursor-pointer hover:text-primary transition-colors"
          onClick={() => setVersionModalOpen(true)}
        >
          v1.5.0
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">{children}</main>

      {activeApp === "dietos" && activeTab && setActiveTab && (
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
      )}
      <Dialog open={versionModalOpen} onOpenChange={setVersionModalOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>App Version</DialogTitle>
            <DialogDescription>
              Currently running version 1.5.0
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end p-2 mt-4">
            <button
              onClick={handleHardRefresh}
              className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Hard Refresh
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}
