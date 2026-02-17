/**
 * Theme store - accent hue (0-360) for app-wide color.
 * Persisted to AsyncStorage so the choice survives restarts.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_ACCENT_HUE } from "../theme/themeColorsFromHue";
import { logger } from "../core/logger";

const STORAGE_KEY = "@tarot:theme:accentHue";

interface ThemeStore {
  /** Accent hue 0-360; default 166 (jade green) */
  accentHue: number;
  /** True until we've loaded from storage once */
  hydrated: boolean;
  /** Accepts number or Slider payload (e.g. array on Android) */
  setAccentHue: (hue: number | number[] | string) => void;
  hydrate: () => Promise<void>;
}

function normalizeHue(hue: number | number[] | string): number | null {
  const raw = Array.isArray(hue) ? hue[0] : hue;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(360, n));
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  accentHue: DEFAULT_ACCENT_HUE,
  hydrated: false,

  setAccentHue: (hue: number | number[] | string) => {
    const clamped = normalizeHue(hue);
    if (clamped == null) return;
    set({ accentHue: clamped });
    AsyncStorage.setItem(STORAGE_KEY, String(Math.round(clamped))).catch(
      (err) => {
        logger.error("theme.store.persist.failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    );
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 0 && n <= 360) {
          set({ accentHue: n, hydrated: true });
          return;
        }
      }
    } catch (err) {
      logger.error("theme.store.hydrate.failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    set({ hydrated: true });
  },
}));
