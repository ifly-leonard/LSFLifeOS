"use client"

import { useState } from "react"
import { useDietOS } from "@/hooks/use-dietos"
import { Layout } from "@/components/layout"
import { TodayView } from "@/components/views/today"
import { WeekView } from "@/components/views/week"
import { DishesView } from "@/components/views/dishes"
import { GroceriesView } from "@/components/views/groceries"
import { SettingsView } from "@/components/views/settings"

export default function DietOSApp() {
  const { state, updateState } = useDietOS()
  const [activeTab, setActiveTab] = useState("today")

  if (!state) return null

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "today" && <TodayView state={state} />}
      {activeTab === "week" && <WeekView state={state} updateState={updateState} />}
      {activeTab === "dishes" && <DishesView state={state} updateState={updateState} />}
      {activeTab === "groceries" && <GroceriesView state={state} />}
      {activeTab === "settings" && <SettingsView state={state} updateState={updateState} />}
    </Layout>
  )
}
