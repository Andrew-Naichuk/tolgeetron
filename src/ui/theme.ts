import type { CSSProperties } from "react";

export const colors = {
  pink: "#e93d9a",
  pinkMuted: "#f0b3d4",
  pinkBg: "#ffeaf6",
  pinkSurface: "#fff6fb",
  green: "#74c35d",
  greenBg: "#eef8ea",
  red: "#e44b4d",
  redBg: "#fde8e8",
  redSoft: "#fce8e8",
  text: "#2e2e2e",
  textSecondary: "#515151",
  textMuted: "#888888",
  border: "#e6e6e6",
  inputBorder: "#b2b2b2",
  white: "#ffffff",
  grayDot: "#b0b0b0",
} as const;

export const radius = {
  sm: 4,
  md: 8,
  pill: 999,
} as const;

export const space = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
} as const;

export const font = {
  label: 16,
  body: 16,
  status: 14,
  input: 16,
  button: 18,
  title: 20,
  subtitle: 16,
  cardTitle: 18,
  cardKey: 14,
} as const;

export const fontFamily =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const fontFamilyMono =
  'ui-monospace, "Roboto Mono", Menlo, Monaco, Consolas, monospace';

export const clamp2Lines: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export function formatKeyLabel(keyName: string, namespace?: string): string {
  return namespace ? `${namespace}:${keyName}` : keyName;
}

export function formatVariableName(keyName: string, namespace?: string): string {
  return namespace ? `${namespace}/${keyName}` : keyName;
}

export function slugifyKeyName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}
