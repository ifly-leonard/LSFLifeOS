"use client"

import { useState, useEffect } from "react"
import { useDietOS } from "@/hooks/use-dietos"
import { Layout } from "@/components/layout"
import { SplashScreen } from "@/components/splash-screen"
import { TodayView } from "@/components/views/today"
import { WeekView } from "@/components/views/week"
import { DishesView } from "@/components/views/dishes"
import { GroceriesView } from "@/components/views/groceries"
import { SettingsView } from "@/components/views/settings"
import { LauncherView } from "@/components/views/launcher"
import { PlaceholderAppView } from "@/components/views/placeholder-app"

const VERSION_STORAGE_KEY = "dietos_app_version"
const CURRENT_VERSION = "1.5.0"

export default function DietOSApp() {
  const { state, updateState } = useDietOS()
  const [activeTab, setActiveTab] = useState("today")
  const [activeApp, setActiveApp] = useState("launcher")
  const [showSplash, setShowSplash] = useState(false)

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
        {activeApp === "dietos" && (
          <>
            {activeTab === "today" && <TodayView state={state} />}
            {activeTab === "week" && <WeekView state={state} updateState={updateState} />}
            {activeTab === "dishes" && <DishesView state={state} updateState={updateState} />}
            {activeTab === "groceries" && <GroceriesView state={state} />}
            {activeTab === "settings" && <SettingsView state={state} updateState={updateState} />}
          </>
        )}
        {["wardrobeos", "laundryos", "sops"].includes(activeApp) && (
          <PlaceholderAppView name={
            activeApp === "wardrobeos" ? "Wardrobe OS" : 
            activeApp === "laundryos" ? "Laundry OS" : 
            "SOPs"
          } />
        )}
      </Layout>
    </>
  )
}
