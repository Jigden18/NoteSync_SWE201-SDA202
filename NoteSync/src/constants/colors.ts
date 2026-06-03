export const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  border: "#EBEBEB",
  textPrimary: "#0D0D0D",
  textSecondary: "#6B6B6B",
  textMuted: "#B0B0B0",
  accent: "#0066FF",
  accentLight: "#E8F0FF",
  success: "#16A34A",
  successLight: "#DCFCE7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  warning: "#D97706",
  warningLight: "#FEF3C7",
} as const;

export type ColorTheme = typeof C;