"use client"

import { useState, useEffect } from "react"
import { type LifeOSState } from "@/lib/lifeos-state"
import { loadState, saveState } from "@/lib/storage"

export function useLifeOS() {
  const [state, setState] = useState<LifeOSState | null>(null)

  useEffect(() => {
    loadState().then((loadedState) => {
      setState(loadedState)
    })
  }, [])

  const updateState = async (newState: LifeOSState) => {
    const updated = {
      ...newState,
      meta: {
        ...newState.meta,
        lastUpdated: new Date().toISOString(),
      },
    }
    setState(updated)
    await saveState(updated)
  }

  return { state, updateState }
}
