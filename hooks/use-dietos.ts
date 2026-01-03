"use client"

import { useState, useEffect } from "react"
import { type DietOSState } from "@/lib/dietos-state"
import { loadState, saveState } from "@/lib/storage"

export function useDietOS() {
  const [state, setState] = useState<DietOSState | null>(null)

  useEffect(() => {
    loadState().then((loadedState) => {
      setState(loadedState)
    })
  }, [])

  const updateState = async (newState: DietOSState) => {
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
