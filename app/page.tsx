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

export default function DietOSApp() {
  const { state, updateState } = useDietOS()
  const [activeTab, setActiveTab] = useState("today")
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Show splash screen on every page load (not cached)
    setShowSplash(true)
  }, [])

  const handleDismissSplash = () => {
    setShowSplash(false)
  }

  if (!state) return null

  return (
    <>
      {showSplash && <SplashScreen onDismiss={handleDismissSplash} />}
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === "today" && <TodayView state={state} />}
        {activeTab === "week" && <WeekView state={state} updateState={updateState} />}
        {activeTab === "dishes" && <DishesView state={state} updateState={updateState} />}
        {activeTab === "groceries" && <GroceriesView state={state} />}
        {activeTab === "settings" && <SettingsView state={state} updateState={updateState} />}
      </Layout>
    </>
  )
}
