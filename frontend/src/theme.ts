// Design tokens - Agenda de Serviços da Oficina (Dark-First Utility)
// Based on /app/design_guidelines.json. Dark theme by default.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#111113",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1E1E22",
  onSurfaceSecondary: "#E0E0E0",
  surfaceTertiary: "#2C2C32",
  onSurfaceTertiary: "#B0B0B0",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#111113",
  muted: "#8A8A93",

  // Brand (industrial orange/red)
  brand: "#E65100",
  onBrand: "#FFFFFF",
  brandPrimary: "#E65100",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF3D00",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#3E1E08",
  onBrandTertiary: "#FFB992",

  // Status
  success: "#00E676",
  onSuccess: "#003314",
  warning: "#FFB300",
  onWarning: "#332200",
  error: "#FF1744",
  onError: "#FFFFFF",
  info: "#1D4ED8",
  onInfo: "#FFFFFF",

  // Lines
  border: "#2C2C32",
  borderStrong: "#4A4A52",
  divider: "#1E1E22",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.light ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme =
    system && themes[system as ColorScheme] ? (system as ColorScheme) : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export const colors = themes.dark;

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

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
