import type { CSSProperties, ReactNode } from "react";
import { colors, font, radius, space } from "../theme";

export function EmptyDashed({ children }: { children: ReactNode }) {
  return <div style={box}>{children}</div>;
}

const box: CSSProperties = {
  flex: 1,
  minHeight: 200,
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px dashed ${colors.pink}`,
  borderRadius: radius.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: space.lg,
  textAlign: "center",
  color: colors.pink,
  fontSize: font.body,
  lineHeight: 1.4,
};
