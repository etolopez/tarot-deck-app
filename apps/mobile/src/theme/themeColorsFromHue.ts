/**
 * Build theme colors from a single accent hue (0-360).
 * Keeps background and text structure; shifts jade/glass/success to the chosen hue.
 */

import type { ThemeColors } from "./types";

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

/** Default jade green hue used in the original theme */
export const DEFAULT_ACCENT_HUE = 166;

/**
 * Returns ThemeColors with jade, glass, success, and text tints derived from hue.
 */
function clampHue(h: number) {
  const n = Math.round(h) % 360;
  return n < 0 ? n + 360 : n;
}

function bgStops(h: number): string[] {
  // Dark, low‑saturation variants of the accent hue to keep readability high
  const h1 = clampHue(h - 6);
  const h2 = clampHue(h + 4);
  const h3 = clampHue(h - 12);
  const h4 = clampHue(h + 10);
  return [
    hsl(h1, 22, 9),   // deepest
    hsl(h2, 20, 14),  // mid deep
    hsl(h3, 18, 11),  // subtle shift
    hsl(h4, 20, 16),  // top layer
  ];
}

export function buildThemeColorsFromHue(hue: number): ThemeColors {
  const h = clampHue(hue);
  return {
    background: {
      primary: bgStops(h),
      overlay: hsla(h, 22, 10, 0.88),
    },
    jade: {
      primary: hsl(h, 61, 55),
      secondary: hsl(h, 50, 42),
      tertiary: hsl(h, 45, 32),
      mint: hsl(h, 75, 72),
      seafoam: hsl(h, 58, 62),
      teal: hsl(h, 52, 48),
    },
    text: {
      primary: "#f0fffe",
      secondary: hsl(h, 40, 88),
      tertiary: hsl(h, 35, 72),
    },
    success: hsl(h, 61, 55),
    error: "#ff6b6b",
    warning: "#ffd93d",
    glass: {
      background: hsla(h, 61, 55, 0.08),
      border: hsla(h, 61, 55, 0.3),
    },
  };
}
