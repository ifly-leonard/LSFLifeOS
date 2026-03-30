import { type LifeOSState, INITIAL_STATE, type Dish } from "./lifeos-state"
import defaultData from "./data.json"

const DB_NAME = "lifeos_db"
const STORE_NAME = "state"
const KEY = "lifeos_state"
const STORAGE_KEY = "lifeos_state"

let dbInstance: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"))
      return
    }

    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

async function loadFromIndexedDB(): Promise<LifeOSState | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(KEY)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result || null)
      }
    })
  } catch (error) {
    console.warn("IndexedDB load failed, falling back to localStorage:", error)
    return null
  }
}

function loadFromLocalStorage(): LifeOSState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch (error) {
    console.warn("localStorage load failed:", error)
    return null
  }
}

async function saveToIndexedDB(state: LifeOSState): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(state, KEY)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.warn("IndexedDB save failed, falling back to localStorage:", error)
    saveToLocalStorage(state)
  }
}

function saveToLocalStorage(state: LifeOSState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("localStorage save failed:", error)
  }
}

function migrateDishState(state: LifeOSState): LifeOSState {
  // Ensure all dishes have disabled field (defaults to false if missing)
  const migratedDishes = state.dishes.map((dish) => ({
    ...dish,
    disabled: dish.disabled ?? false,
  }))

  // Ensure timezone is set (defaults to Asia/Kolkata if missing)
  const migratedSettings = {
    ...state.settings,
    timezone: state.settings.timezone || "Asia/Kolkata",
  }

  return {
    ...state,
    dishes: migratedDishes,
    settings: migratedSettings,
  }
}

function cleanupDisabledDishesFromPlan(state: LifeOSState): LifeOSState {
  const enabledDishIds = new Set(
    state.dishes.filter((d) => !d.disabled).map((d) => d.id)
  )

  const cleanedPlan: LifeOSState["weeklyPlan"] = {}
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  for (const day of days) {
    const dayPlan = state.weeklyPlan[day] || {
      breakfast: "",
      lunch: "",
      snack: "",
      dinner: "",
    }

    // Get first available enabled dish for each meal type as fallback
    const getFirstEnabledDish = (mealType: Dish["meal"]): string => {
      const enabledDish = state.dishes.find(
        (d) => d.meal === mealType && !d.disabled
      )
      return enabledDish?.id || ""
    }

    cleanedPlan[day] = {
      breakfast: enabledDishIds.has(dayPlan.breakfast)
        ? dayPlan.breakfast
        : getFirstEnabledDish("breakfast"),
      lunch: enabledDishIds.has(dayPlan.lunch)
        ? dayPlan.lunch
        : getFirstEnabledDish("lunch"),
      snack: enabledDishIds.has(dayPlan.snack)
        ? dayPlan.snack
        : getFirstEnabledDish("snack"),
      dinner: enabledDishIds.has(dayPlan.dinner)
        ? dayPlan.dinner
        : getFirstEnabledDish("dinner"),
    }
  }

  return {
    ...state,
    weeklyPlan: cleanedPlan,
  }
}

export async function loadState(): Promise<LifeOSState> {
  let state: LifeOSState | null = null

  // Try IndexedDB first
  const indexedDBState = await loadFromIndexedDB()
  if (indexedDBState) {
    state = indexedDBState
  } else {
    // Fallback to localStorage
    const localStorageState = loadFromLocalStorage()
    if (localStorageState) {
      state = localStorageState
      // Migrate to IndexedDB if available
      try {
        await saveToIndexedDB(localStorageState)
      } catch {
        // Ignore migration errors
      }
    }
  }

  // If no state found, use default data
  if (!state) {
    state = defaultData as unknown as LifeOSState
  }

  // Apply migrations (this will ensure timezone is set)
  state = migrateDishState(state)
  state = cleanupDisabledDishesFromPlan(state)

  return state
}

export async function saveState(state: LifeOSState): Promise<void> {
  // Try IndexedDB first
  try {
    await saveToIndexedDB(state)
    // Also save to localStorage as backup
    saveToLocalStorage(state)
  } catch {
    // If IndexedDB fails, use localStorage
    saveToLocalStorage(state)
  }
}

