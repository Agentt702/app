import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

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

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  display: "Amiri_400Regular",
  displayBold: "Amiri_700Bold",
  body: "Cairo_400Regular",
  bodyBold: "Cairo_700Bold",
  bodySemi: "Cairo_600SemiBold",
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export const colors = themes.light;

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
