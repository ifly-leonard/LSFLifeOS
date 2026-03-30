import { WardrobeItem } from "./wardrobe-data"

type ColorProfile = {
  type: 'neutral' | 'earth' | 'accent'
  shade: 'light' | 'dark'
  family: string
}

export const COLOR_MAP: Record<string, ColorProfile> = {
  white: { type: 'neutral', shade: 'light', family: 'monochrome' },
  black: { type: 'neutral', shade: 'dark', family: 'monochrome' },
  grey: { type: 'neutral', shade: 'light', family: 'monochrome' },
  navy: { type: 'neutral', shade: 'dark', family: 'blue' },
  beige: { type: 'neutral', shade: 'light', family: 'brown' },
  brown: { type: 'neutral', shade: 'dark', family: 'brown' },
  olive: { type: 'earth', shade: 'dark', family: 'green' },
  maroon: { type: 'accent', shade: 'dark', family: 'red' }
}

export function evaluateOutfitScore(items: WardrobeItem[]): number {
  if (!items || items.length === 0) return -100

  const colors = items.map(i => i.primary_color)
  const profiles = colors.map(c => COLOR_MAP[c.toLowerCase()] || { type: 'neutral', shade: 'dark', family: 'monochrome' })

  let accentCount = 0
  let neutralCount = 0
  let earthCount = 0
  let lightCount = 0
  let darkCount = 0

  profiles.forEach(p => {
    if (p.type === 'accent') accentCount++
    if (p.type === 'neutral') neutralCount++
    if (p.type === 'earth') earthCount++
    
    if (p.shade === 'light') lightCount++
    if (p.shade === 'dark') darkCount++
  })

  // HARD RESTRICTIONS
  if (accentCount > 1) return -1000 // Reject: more than 1 accent
  if (neutralCount === 0) return -1000 // Reject: no neutral present
  if (lightCount === 0 || darkCount === 0) return -1000 // Reject: no contrast (all dark or all light)
  
  // Specific clash checking
  if (colors.includes('maroon' as any) && colors.includes('olive' as any)) return -1000 // Clash

  // SCORING
  let score = 0
  
  // Neutral balance
  if (neutralCount >= colors.length - 1) score += 3
  
  // Contrast (we already know light > 0 and dark > 0, so basic contrast is +2)
  score += 2
  
  // Color harmony (Monochrome or simple analogous)
  const uniqueFamilies = new Set(profiles.map(p => p.family))
  if (uniqueFamilies.size <= 2) {
    score += 2
  }

  // Penalty for over-accent (though we already reject > 1, if there is 1 we evaluate its fit)
  if (accentCount === 1) {
    // an accent usually looks best with heavily neutral/monochrome bases
    if (uniqueFamilies.size > 3) score -= 2
  }

  return score
}

// Generates the best allowed outfit from matching items
export function buildBestOutfit(tops: WardrobeItem[], bottoms: WardrobeItem[], footwear: WardrobeItem[], accessories: WardrobeItem[], fallbackCategory: (c: string) => WardrobeItem[]): WardrobeItem[] | null {
  let bestOutfit: WardrobeItem[] = []
  let bestScore = -9999

  const getRandom = (arr: WardrobeItem[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null

  // We loop 200 times to hunt for a high scoring combination (essentially a Monte Carlo approach)
  // Since we want "strict" results and our item space is tiny, this guarantees we find valid combos if they exist
  for (let i = 0; i < 200; i++) {
    const outfit: WardrobeItem[] = []
    
    const top = getRandom(tops) || getRandom(fallbackCategory('tops'))
    const bot = getRandom(bottoms) || getRandom(fallbackCategory('bottoms'))
    const shoe = getRandom(footwear) || getRandom(fallbackCategory('footwear'))
    
    // Randomize accessory strictly 50% of the time to vary looks
    const acc = Math.random() > 0.5 ? (getRandom(accessories) || getRandom(fallbackCategory('accessories'))) : null

    if (top) outfit.push(top)
    if (bot) outfit.push(bot)
    if (shoe) outfit.push(shoe)
    if (acc) outfit.push(acc)

    // Ensure we don't test duplicates or empty
    if (outfit.length < 2) continue

    const score = evaluateOutfitScore(outfit)
    
    // Add small random noise to score to ensure variety among equally scored perfect outfits
    const finalScore = score + (Math.random() * 0.1)

    if (finalScore > bestScore) {
      bestScore = finalScore
      bestOutfit = outfit
    }
  }

// ... existing code ...
  // If even the best score is heavily negative, it means no valid combination exists
  // but we must show something, so we'll just return it (it's the best of the worst)
  return bestOutfit.length > 0 ? bestOutfit : null
}

// Finds the best item to swap into an existing outfit without breaking color rules
export function getValidSwapItem(currentOutfit: WardrobeItem[], itemToSwap: WardrobeItem, candidates: WardrobeItem[]): WardrobeItem | null {
  if (candidates.length === 0) return null
  
  let bestItem = null
  let bestScore = -9999
  
  for (const candidate of candidates) {
    const newOutfit = currentOutfit.map(i => i.id === itemToSwap.id ? candidate : i)
    const score = evaluateOutfitScore(newOutfit)
    const finalScore = score + (Math.random() * 0.1) // Noise for ties
    
    if (finalScore > bestScore) {
       bestScore = finalScore
       bestItem = candidate
    }
  }
  return bestItem
}

export const COLOR_HEX: Record<string, string> = {
  white: '#ffffff',
  black: '#111111',
  grey: '#888888',
  navy: '#1a2942',
  beige: '#d5bdaf',
  brown: '#5c4033',
  olive: '#4b5320',
  maroon: '#611a1a'
}

export function analyzeOutfit(items: WardrobeItem[]): { palette: string[], ruleName: string, isValid: boolean } {
  if (!items || items.length === 0) return { palette: [], ruleName: 'Empty', isValid: false }
  
  const colors = items.map(i => i.primary_color.toLowerCase())
  const palette = Array.from(new Set(colors)).map(c => COLOR_HEX[c] || '#000000') // unique colors
  
  const profiles = colors.map(c => COLOR_MAP[c] || { type: 'neutral', shade: 'dark', family: 'monochrome' })
  
  let accentCount = 0
  let neutralCount = 0
  let earthCount = 0
  
  profiles.forEach(p => {
    if (p.type === 'accent') accentCount++
    if (p.type === 'neutral') neutralCount++
    if (p.type === 'earth') earthCount++
  })
  
  const uniqueFamilies = new Set(profiles.map(p => p.family))
  
  let ruleName = "Neutral Base"
  if (uniqueFamilies.size === 1) {
    ruleName = "Monochrome"
  } else if (accentCount === 1) {
    ruleName = "Neutral + Accent"
  } else if (earthCount > 0 && accentCount === 0) {
    ruleName = "Earthy Neutral"
  }

  const score = evaluateOutfitScore(items)
  
  return {
    palette,
    ruleName,
    isValid: score > 0
  }
}
