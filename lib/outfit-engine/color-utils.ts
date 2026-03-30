import type { ColorFamily, Hsl, Rgb } from "./types";

/** Parses #RGB, #RRGGBB; returns null if invalid. */
export function normalizeHex(hex: string): string | null {
  const h = hex.trim();
  if (!h.startsWith("#")) return null;
  const body = h.slice(1);
  if (body.length === 3) {
    const r = body[0] + body[0];
    const g = body[1] + body[1];
    const b = body[2] + body[2];
    return `#${r}${g}${b}`.toLowerCase();
  }
  if (body.length === 6 && /^[0-9a-fA-F]{6}$/.test(body)) {
    return `#${body.toLowerCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const n = normalizeHex(hex);
  if (!n) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function itemHsl(colorHex: string): Hsl {
  const { r, g, b } = hexToRgb(colorHex);
  return rgbToHsl(r, g, b);
}

/**
 * Classify paint color from HSL only (not color names).
 */
export function classifyColorFamily(hsl: Hsl): ColorFamily {
  const { h, s, l } = hsl;

  if (l > 88) return "light_anchor";
  if (l < 12) return "dark_anchor";
  if (s < 12) return "neutral";

  // Earth: browns, tans, olives, muted golds
  if (h >= 15 && h <= 55 && s < 55 && l > 12 && l < 75) return "earth";
  if (h >= 55 && h <= 105 && s < 45 && l > 15 && l < 70) return "earth";

  if (s > 58 && l > 22 && l < 82) return "bright_accent";
  return "muted_color";
}

export function isWarmHue(h: number, s: number): boolean {
  if (s < 18) return false;
  return h < 75 || h > 320;
}

export function isCoolHue(h: number, s: number): boolean {
  if (s < 18) return false;
  return h >= 105 && h <= 270;
}
