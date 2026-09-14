import type { TextStyle } from "react-native";

export interface Palette {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  foreground: string;
  foregroundMuted: string;
  foregroundSubtle: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  // Text and icons on surfaces need more contrast than the brand fill.
  primaryStrong: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  successSoft: string;
  warning: string;
  warningForeground: string;
  warningSoft: string;
  danger: string;
  dangerForeground: string;
  dangerSoft: string;
  overlay: string;
  shadow: string;
  qrForeground: string;
  qrBackground: string;
}

export const lightPalette: Palette = {
  background: "#f6f8ed",
  backgroundElevated: "#ffffff",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#eaf2eb",
  border: "#d0dfd6",
  borderStrong: "#a7c7bb",
  foreground: "#1f3130",
  foregroundMuted: "#49665b",
  foregroundSubtle: "#557265",
  primary: "#3bb58d",
  primaryForeground: "#102d26",
  primarySoft: "#e0f2e9",
  primaryStrong: "#226a53",
  accent: "#215754",
  accentForeground: "#f6f8ed",
  success: "#21734f",
  successForeground: "#ffffff",
  successSoft: "#e1f3e8",
  warning: "#875313",
  warningForeground: "#ffffff",
  warningSoft: "#fff0d5",
  danger: "#b83232",
  dangerForeground: "#ffffff",
  dangerSoft: "#fbe5e2",
  overlay: "rgba(15, 36, 31, 0.55)",
  shadow: "rgba(31, 49, 48, 0.12)",
  qrForeground: "#000000",
  qrBackground: "#ffffff",
};

export const darkPalette: Palette = {
  background: "#102521",
  backgroundElevated: "#152e29",
  surface: "#19332e",
  surfaceElevated: "#213e36",
  surfaceMuted: "#213e36",
  border: "#35554a",
  borderStrong: "#5f8072",
  foreground: "#f6f8ed",
  foregroundMuted: "#bbd2c7",
  foregroundSubtle: "#a2bfb0",
  primary: "#3bb58d",
  primaryForeground: "#102d26",
  primarySoft: "#214c3b",
  primaryStrong: "#7ddbb7",
  accent: "#a7c7bb",
  accentForeground: "#1f3130",
  success: "#77d6a3",
  successForeground: "#102d26",
  successSoft: "#204734",
  warning: "#edc177",
  warningForeground: "#302108",
  warningSoft: "#49371e",
  danger: "#ffaaa0",
  dangerForeground: "#260606",
  dangerSoft: "#4b2828",
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "rgba(0, 0, 0, 0.55)",
  qrForeground: "#000000",
  qrBackground: "#ffffff",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: "900" } as TextStyle,
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" } as TextStyle,
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "800" } as TextStyle,
  body: { fontSize: 16, lineHeight: 22, fontWeight: "500" } as TextStyle,
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "700" } as TextStyle,
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" } as TextStyle,
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  } as TextStyle,
} as const;

export interface Tokens {
  palette: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  mode: "light" | "dark";
}

export function makeTokens(mode: "light" | "dark"): Tokens {
  return {
    palette: mode === "dark" ? darkPalette : lightPalette,
    spacing,
    radius,
    shadows,
    typography,
    mode,
  };
}
