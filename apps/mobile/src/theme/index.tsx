/**
 * Theme entry - provides ThemeProvider, useTheme, and theme exports.
 * Theme is derived from the Zustand store so all screens see accent updates
 * regardless of React/Expo Router context tree.
 */

import { useEffect, useMemo } from "react";
import { Theme } from "./types";
import { jadeEnigmaColors } from "./jadeEnigma.theme";
import { typography } from "./typography";
import { animations } from "./animations";
import { spacing } from "./spacing";
import { buildThemeColorsFromHue } from "./themeColorsFromHue";
import { useThemeStore } from "../state/themeStore";

export const jadeEnigmaTheme: Theme = {
  colors: jadeEnigmaColors,
  typography,
  animations,
  spacing,
};

/** Runs store hydration on app load; wrap app root so it runs once */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    useThemeStore.getState().hydrate();
  }, []);
  return <>{children}</>;
};

/**
 * Returns current theme (colors from store accent hue). Subscribes to the store
 * so every screen updates when hue changes, even if not under ThemeProvider in the tree.
 */
export const useTheme = (): Theme => {
  const accentHue = useThemeStore((s) => s.accentHue);
  return useMemo<Theme>(
    () => ({
      colors: buildThemeColorsFromHue(accentHue),
      typography,
      animations,
      spacing,
    }),
    [accentHue],
  );
};

/** Accent hue and setter from store (used by Settings slider; not tied to context tree) */
export const useAccentHue = () => {
  const accentHue = useThemeStore((s) => s.accentHue);
  const setAccentHue = useThemeStore((s) => s.setAccentHue);
  return { accentHue, setAccentHue };
};

export { jadeEnigmaColors as colors } from "./jadeEnigma.theme";
export { typography } from "./typography";
export { animations } from "./animations";
export { spacing } from "./spacing";
export * from "./types";
