"use client"

import { useState, useEffect, useRef } from "react"
import { useLifeOS } from "@/hooks/use-lifeos"
import { useToast } from "@/hooks/use-toast"
import { Layout } from "@/components/layout"
import { SplashScreen } from "@/components/splash-screen"
import { TodayView } from "@/components/views/today"
import { WeekView } from "@/components/views/week"
import { DishesView } from "@/components/views/dishes"
import { GroceriesView } from "@/components/views/groceries"
import { SettingsView } from "@/components/views/settings"
import { LauncherView } from "@/components/views/launcher"
import { PlaceholderAppView } from "@/components/views/placeholder-app"
import { WardrobeOSView } from "@/components/views/wardrobeos"
import { WardrobeDashboardView } from "@/components/views/wardrobe-dashboard"
import { WardrobePlannerView } from "@/components/views/wardrobe-planner"
import { WardrobeSettingsView } from "@/components/views/wardrobe-settings"

const VERSION_STORAGE_KEY = "lifeos_app_version"
const CURRENT_VERSION = "1.5.0"

export default function LifeOSApp() {
  const { state, updateState } = useLifeOS()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("today")
  const [activeApp, setActiveApp] = useState("launcher")
  const [showSplash, setShowSplash] = useState(false)
  const activeAppRef = useRef(activeApp)

  useEffect(() => {
    activeAppRef.current = activeApp
    if (activeApp === "wardrobeos" && !["dashboard", "inventory", "add_new", "planner", "shopping", "settings"].includes(activeTab)) {
      setActiveTab("dashboard")
    } else if (activeApp === "lifeos" && !["today", "week", "dishes", "groceries", "settings"].includes(activeTab)) {
      setActiveTab("today")
    }
  }, [activeApp, activeTab])

  useEffect(() => {
    let backPressCount = 0
    let backPressTimer: NodeJS.Timeout

    const handlePopState = (e: PopStateEvent) => {
      if (activeAppRef.current !== "launcher") {
        setActiveApp("launcher")
        window.history.pushState(null, "", window.location.pathname)
        return
      }

      backPressCount++
      if (backPressCount === 1) {
        window.history.pushState(null, "", window.location.pathname)
        toast({
          description: "Press back again to exit",
          duration: 2000,
        })
        backPressTimer = setTimeout(() => {
          backPressCount = 0
        }, 2000)
      } else {
        window.history.back()
      }
    }

    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.pathname)
      window.addEventListener("popstate", handlePopState)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", handlePopState)
      }
      clearTimeout(backPressTimer)
    }
  }, [toast])

  useEffect(() => {
    // Check if this is a new version
    const checkVersion = () => {
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY)
      if (storedVersion !== CURRENT_VERSION) {
        setShowSplash(true)
        localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION)
      }
    }

    // Listen for service worker messages about new versions
    if ("serviceWorker" in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "NEW_VERSION_AVAILABLE") {
          const newVersion = event.data.version
          const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY)
          if (storedVersion !== newVersion) {
            setShowSplash(true)
            localStorage.setItem(VERSION_STORAGE_KEY, newVersion)
          }
        }
      }

      navigator.serviceWorker.addEventListener("message", handleMessage)

      // Listen for service worker update events
      const handleSWUpdate = () => {
        checkVersion()
      }
      window.addEventListener("sw-updated", handleSWUpdate)

      // Check for updates on load
      navigator.serviceWorker.ready.then((registration) => {
        registration.update()
      })

      // Check version on mount
      checkVersion()

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage)
        window.removeEventListener("sw-updated", handleSWUpdate)
      }
    } else {
      // If no service worker, just check version
      checkVersion()
    }
  }, [])

  const handleDismissSplash = () => {
    setShowSplash(false)
  }

  if (!state) return null

  return (
    <>
      {showSplash && <SplashScreen onDismiss={handleDismissSplash} />}
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeApp={activeApp}
        setActiveApp={setActiveApp}
      >
        {activeApp === "launcher" && <LauncherView onSelectApp={setActiveApp} />}
        {activeApp === "lifeos" && (
          <>
            {activeTab === "today" && <TodayView state={state} />}
            {activeTab === "week" && <WeekView state={state} updateState={updateState} />}
            {activeTab === "dishes" && <DishesView state={state} updateState={updateState} />}
            {activeTab === "groceries" && <GroceriesView state={state} />}
            {activeTab === "settings" && <SettingsView state={state} updateState={updateState} />}
          </>
        )}
        {activeApp === "wardrobeos" && (
          <>
            {(activeTab === "dashboard" || !["dashboard", "inventory", "add_new", "planner", "shopping", "settings"].includes(activeTab)) && <WardrobeDashboardView onNavigate={setActiveTab} state={state} />}
            {activeTab === "inventory" && <WardrobeOSView />}
            {activeTab === "add_new" && <PlaceholderAppView name="Add New" />}
            {activeTab === "planner" && <WardrobePlannerView />}
            {activeTab === "shopping" && <PlaceholderAppView name="Shopping" />}
            {activeTab === "settings" && <WardrobeSettingsView state={state} updateState={updateState} onNavigate={setActiveTab} />}
          </>
        )}
        {["laundryos", "sops"].includes(activeApp) && (
          <PlaceholderAppView name={
            activeApp === "laundryos" ? "Laundry OS" : "SOPs"
          } />
        )}
      </Layout>
    </>
  )
}
