"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  getServerSafeInventorySeed,
  loadWardrobeInventory,
  saveWardrobeInventory,
} from "@/lib/wardrobe-inventory-storage"
import type { WardrobeItem } from "@/lib/wardrobe-data"

type WardrobeInventoryContextValue = {
  items: WardrobeItem[]
  addItem: (item: WardrobeItem) => void
  updateItem: (id: string, patch: Partial<WardrobeItem>) => void
  removeItem: (id: string) => void
  isReady: boolean
}

const WardrobeInventoryContext = createContext<WardrobeInventoryContextValue | null>(null)

export function WardrobeInventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WardrobeItem[]>(getServerSafeInventorySeed)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setItems(loadWardrobeInventory())
    setIsReady(true)
  }, [])

  const addItem = useCallback((item: WardrobeItem) => {
    setItems((prev) => {
      const next = [...prev, item]
      saveWardrobeInventory(next)
      return next
    })
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<WardrobeItem>) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      saveWardrobeInventory(next)
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      saveWardrobeInventory(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ items, addItem, updateItem, removeItem, isReady }),
    [items, addItem, updateItem, removeItem, isReady],
  )

  return (
    <WardrobeInventoryContext.Provider value={value}>
      {children}
    </WardrobeInventoryContext.Provider>
  )
}

export function useWardrobeInventory(): WardrobeInventoryContextValue {
  const ctx = useContext(WardrobeInventoryContext)
  if (!ctx) {
    throw new Error("useWardrobeInventory must be used within WardrobeInventoryProvider")
  }
  return ctx
}
