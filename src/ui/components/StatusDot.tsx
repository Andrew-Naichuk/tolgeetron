import type { CSSProperties } from "react";
import { colors, font } from "../theme";

type Tone = "gray" | "red" | "green";

const toneColor: Record<Tone, string> = {
  gray: colors.grayDot,
  red: colors.red,
  green: colors.green,
};

export function StatusDot({
  label,
  tone,
}: {
  label: string;
  tone: Tone;
}) {
  return (
    <div style={row}>
      <span style={{ ...dot, background: toneColor[tone] }} />
      <span style={{ ...text, color: toneColor[tone] }}>{label}</span>
    </div>
  );
}

const row: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const dot: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  flexShrink: 0,
};

const text: CSSProperties = {
  fontSize: font.status,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};
