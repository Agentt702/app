import { useEffect, useMemo, useState } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorScheme = "light" | "dark";
export type ThemePref = "system" | "light" | "dark";

const light = {
  surface: "#FDFBF7",
  onSurface: "#1C1917",
  surfaceSecondary: "#F4EFE6",
  onSurfaceSecondary: "#292524",
  surfaceTertiary: "#EAE4D9",
  onSurfaceTertiary: "#352F2D",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FDFBF7",
  muted: "#78716C",

  brand: "#1E3A2F",
  onBrand: "#FDFBF7",
  brandPrimary: "#1E3A2F",
  onBrandPrimary: "#FDFBF7",
  brandSecondary: "#B38A58",
  onBrandSecondary: "#1C1917",
  brandTertiary: "#E3DCCC",
  onBrandTertiary: "#1E3A2F",

  success: "#2D5A40",
  onSuccess: "#FDFBF7",
  warning: "#9C6A25",
  onWarning: "#FDFBF7",
  error: "#8B3E3E",
  onError: "#FDFBF7",
  info: "#3A5C69",
  onInfo: "#FDFBF7",

  border: "#EAE4D9",
  borderStrong: "#C5BCAB",
  divider: "#EAE4D9",
};

const dark: typeof light = {
  surface: "#141210",
  onSurface: "#F5F0E6",
  surfaceSecondary: "#1F1B17",
  onSurfaceSecondary: "#E7E0D2",
  surfaceTertiary: "#2A241F",
  onSurfaceTertiary: "#D4CAB6",
  surfaceInverse: "#FDFBF7",
  onSurfaceInverse: "#1C1917",
  muted: "#A39685",

  brand: "#5C8A6F",
  onBrand: "#0B0A08",
  brandPrimary: "#6FA184",
  onBrandPrimary: "#0B0A08",
  brandSecondary: "#D4AA76",
  onBrandSecondary: "#0B0A08",
  brandTertiary: "#2E2A24",
  onBrandTertiary: "#D4AA76",

  success: "#6FA184",
  onSuccess: "#0B0A08",
  warning: "#D4AA76",
  onWarning: "#0B0A08",
  error: "#D97878",
  onError: "#0B0A08",
  info: "#7AA5B4",
  onInfo: "#0B0A08",

  border: "#2A241F",
  borderStrong: "#3A332C",
  divider: "#2A241F",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const fonts = {
  display: "Amiri_400Regular",
  displayBold: "Amiri_700Bold",
  body: "Cairo_400Regular",
  bodyBold: "Cairo_700Bold",
  bodySemi: "Cairo_600SemiBold",
};

// ---- Theme preference store (system / light / dark) ----
const PREF_KEY = "qisas_theme_pref";
let currentPref: ThemePref = "system";
const listeners = new Set<() => void>();

export async function loadThemePref(): Promise<ThemePref> {
  try {
    const v = (await AsyncStorage.getItem(PREF_KEY)) as ThemePref | null;
    if (v === "light" || v === "dark" || v === "system") currentPref = v;
  } catch {}
  applyPref(currentPref);
  return currentPref;
}

function applyPref(pref: ThemePref) {
  try {
    Appearance.setColorScheme?.(pref === "system" ? "unspecified" as any : pref);
  } catch {}
}

export async function setThemePref(pref: ThemePref) {
  currentPref = pref;
  try {
    await AsyncStorage.setItem(PREF_KEY, pref);
  } catch {}
  applyPref(pref);
  listeners.forEach((l) => l());
}

export function getThemePref(): ThemePref {
  return currentPref;
}

export function useThemePref(): ThemePref {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return currentPref;
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const pref = useThemePref();
  const scheme: ColorScheme =
    pref === "light" || pref === "dark"
      ? pref
      : (system === "dark" ? "dark" : "light");
  return { scheme, colors: themes[scheme] };
}

// Static export kept for legacy imports. Prefer useTheme() in components.
export const colors = themes.light;

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
