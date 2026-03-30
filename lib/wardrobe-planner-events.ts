export const PLANNER_EVENT_OPTIONS = [
  { value: "deep_work", label: "Deep Work / Focus" },
  { value: "office_day", label: "Office / Team Sync" },
  { value: "investor_pitch", label: "Investor Pitch" },
  { value: "media_appearance", label: "Podcast / Media" },
  { value: "networking", label: "Networking / Dinner" },
  { value: "travel", label: "Airport / Travel" },
  { value: "gala_dinner", label: "Gala / Event" },
] as const

export function plannerEventLabel(eventKey: string): string {
  return PLANNER_EVENT_OPTIONS.find((o) => o.value === eventKey)?.label ?? eventKey.replace(/_/g, " ")
}
