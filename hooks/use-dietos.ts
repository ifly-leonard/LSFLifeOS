"use client"

import { useState, useEffect } from "react"
import { type DietOSState, INITIAL_STATE } from "@/lib/dietos-state"

const STORAGE_KEY = "dietos_state"

export function useDietOS() {
  const [state, setState] = useState<DietOSState | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setState(JSON.parse(saved))
      } catch (e) {
        setState(INITIAL_STATE)
      }
    } else {
      setState(INITIAL_STATE)
    }
  }, [])

  const updateState = (newState: DietOSState) => {
    const updated = {
      ...newState,
      meta: {
        ...newState.meta,
        lastUpdated: new Date().toISOString(),
      },
    }
    setState(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return { state, updateState }
}
