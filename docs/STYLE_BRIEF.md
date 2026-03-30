# LSFLifeOS (LifeOS) — UI Style Brief

## Overview

LSFLifeOS (branded as **LifeOS**) is a mobile-first PWA for meal planning and diet management. The UI follows an **executive, editorial** aesthetic: sharp edges, bold typography, uppercase labels, and a restrained navy-based color palette. The tagline "Designed for Executive Efficiency" captures the design intent.

---

## Design Philosophy

- **Executive / Editorial**: Clean, authoritative, no-nonsense
- **Mobile-first**: Max width 390px, bottom navigation, touch-friendly
- **Information-dense**: Prioritizes clarity and scannability over decoration
- **Personalized**: Designed for a specific user (Leonard Selvaraja Fernando)

---

## Color System

### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.98 0 0)` | Soft off-white page background |
| `--foreground` | `oklch(0.15 0.02 240)` | Deep navy gray text |
| `--primary` | `oklch(0.25 0.05 240)` | Executive dark navy (buttons, accents) |
| `--primary-foreground` | `oklch(1 0 0)` | White text on primary |
| `--secondary` | `oklch(0.9 0.02 240)` | Light navy tint |
| `--muted` | `oklch(0.95 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.45 0 0)` | Secondary text |
| `--accent` | `oklch(0.35 0.08 240)` | Hover/active states |
| `--destructive` | `oklch(0.5 0.2 25)` | Errors, destructive actions |
| `--border` | `oklch(0.9 0 0)` | Borders |
| `--ring` | `oklch(0.25 0.05 240)` | Focus rings |

### Meal-Specific Colors (Semantic)

| Meal | Light Mode | Dark Mode |
|------|------------|-----------|
| **Breakfast** | Amber (`amber-50`, `amber-700`) | `amber-950/20`, `amber-300` |
| **Lunch** | Blue (`blue-50`, `blue-700`) | `blue-950/20`, `blue-300` |
| **Snack** | Green (`green-50`, `green-700`) | `green-950/20`, `green-300` |
| **Dinner** | Purple (`purple-50`, `purple-700`) | `purple-950/20`, `purple-300` |

Use `getMealColorClasses()` and `getMealTextColorClasses()` from `lib/utils.ts` for meal badges, labels, and sidebars.

### Chart Colors

- `--chart-1` through `--chart-5`: Used for Recharts visualizations (nutrition, etc.)

---

## Typography

### Font Stack

- **Sans**: Geist, Geist Fallback
- **Mono**: Geist Mono, Geist Mono Fallback (developer tools, JSON)

### Type Scale & Conventions

| Element | Classes | Usage |
|---------|---------|-------|
| Page title | `text-xl font-black uppercase tracking-tighter` | Section headers (e.g., "Today", "Weekly Plan") |
| Section title | `text-lg font-black uppercase tracking-tighter` | Subsection headers |
| Label (small) | `text-[9px]`–`text-[10px] font-bold uppercase tracking-widest` | Metadata, labels |
| Body emphasis | `font-bold uppercase tracking-tight` | List items, dish names |
| Muted helper | `text-[9px] text-muted-foreground italic` | Helper text |
| Version / meta | `text-[10px] text-muted-foreground uppercase tracking-widest` | Version badge, footer |

### Typography Rules

- **Uppercase** for most labels, headings, and buttons
- **Tracking**: `tracking-tighter` for large headings, `tracking-widest` for small labels
- **Weight**: `font-black` (900) for headings, `font-bold` (700) for emphasis

---

## Border Radius

- **Base**: `--radius: 0rem` — **Sharp, executive edges** (no rounded corners on primary surfaces)
- Cards and buttons may use `rounded-md` or `rounded-xl` where the base Card component overrides
- Checkboxes: `rounded-[4px]` or `rounded-none` for a more rigid look

---

## Layout

### Shell

- **Max width**: 390px (centered, `mx-auto`)
- **Height**: Full viewport (`h-screen`)
- **Structure**: Header → Scrollable main → Fixed bottom nav
- **Borders**: `border-x border-border` on shell; `shadow-2xl` for depth

### Header

- Logo (LSF Lion) + "Diet OS" wordmark
- `text-2xl font-bold tracking-tighter [font-variant:small-caps]` for "Diet OS"
- Version badge: `text-[10px] uppercase tracking-widest`

### Bottom Navigation

- 5 tabs: Home, Planner, Dishes, Groceries, Settings
- Icons: Lucide (Home, Calendar, Utensils, ShoppingCart, Settings)
- Active state: `text-primary scale-110`; inactive: `text-muted-foreground opacity-60`
- Labels: `text-[10px] font-bold uppercase tracking-wider`

### Spacing

- Section gaps: `space-y-4`, `space-y-6`, `space-y-8`
- Card padding: `p-4`, `p-6`
- Content padding: `p-6 pb-24` (extra bottom for nav)

---

## Components

### Card

- Base: `bg-card rounded-xl border py-6 shadow-sm`
- Variants: `border-2 border-primary/10` for emphasis
- Hover: `hover:border-primary/30 transition-colors`
- Active/press: `active:scale-[0.98]` for tappable cards

### Button

- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`
- Common override: `font-bold uppercase text-[10px] tracking-widest` for compact actions

### Input

- Height: `h-9` default; `h-10`, `h-12` for larger fields
- Border: `border-2` for emphasis in forms
- Placeholder: `text-muted-foreground`

### Checkbox

- Size: `h-5 w-5` for list items
- Style: `border-2 rounded-none` for sharp, editorial look
- Checked: `bg-primary text-primary-foreground`

### Tabs

- List: `border-2 border-primary/10` for Today view (Meals / Groceries / Nutrition)
- Trigger: `text-xs` for compact labels
- Active: `bg-background text-foreground shadow-sm`

### Dialog

- Radix-based; uses standard Card-like styling
- Footer: Cancel (outline) + primary action

---

## Patterns

### Section Header

```
border-b-2 border-primary pb-2
```

### Meal Card (Today View)

- Left sidebar: meal type + time, colored by meal (breakfast/lunch/snack/dinner)
- Right: dish name, Time/Cals/Protein grid
- Border: `border-2 border-primary/10`

### Grocery Checklist

- Checkbox + label; checked items: `line-through text-muted-foreground`
- Group headers: `border-l-4` with meal color

### Nutrition Summary

- Grid: `grid-cols-2` or `grid-cols-4`
- Cells: `border-2 border-primary/10 bg-muted/30`
- Progress bars: `h-2 bg-muted rounded-full` with `bg-primary` fill

### Empty State

- `text-center text-muted-foreground font-bold uppercase text-xs tracking-widest`

---

## Animations

- `animate-in fade-in` for modals and splash
- `animate-in fade-in slide-in-from-top-2` for expandable sections
- `transition-colors`, `transition-opacity`, `transition-all` for interactive states

---

## Iconography

- **Library**: Lucide React
- **Sizes**: 14px (inline), 16px (buttons), 20px (nav)
- **Stroke**: `strokeWidth={2}` default; `2.5` for active nav

---

## Accessibility

- Focus: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Invalid: `aria-invalid:ring-destructive/20`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`

---

## File Reference

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS variables, theme, base styles |
| `components/ui/*` | Reusable UI primitives (shadcn/Radix) |
| `components/views/*` | View-specific layouts |
| `lib/utils.ts` | `cn()`, `getMealColorClasses()`, `getMealTextColorClasses()` |

---

## Branding

- **Product name**: Diet OS
- **Logo**: LSF Lion (from `/lsf-branding/`)
- **Tagline**: "Designed for Executive Efficiency"
- **Personalization**: "Designed Exclusively For Leonard Selvaraja Fernando"
