import type { CSSProperties, ReactNode } from "react";
import { colors, font, radius, space } from "../theme";

export function SelectedLayerCard({
  children,
  dashed,
}: {
  children: ReactNode;
  dashed?: boolean;
}) {
  return (
    <div
      style={{
        ...card,
        borderStyle: dashed ? "dashed" : "solid",
        background: dashed ? colors.white : colors.pinkSurface,
      }}
    >
      {children}
    </div>
  );
}

export function LayerTitle({ children }: { children: ReactNode }) {
  return <div style={title}>{children}</div>;
}

export function LayerKey({ children }: { children: ReactNode }) {
  return <div style={key}>{children}</div>;
}

const card: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${colors.pink}`,
  borderRadius: radius.md,
  padding: space.lg,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  textAlign: "center",
};

const title: CSSProperties = {
  fontSize: font.title,
  fontWeight: 500,
  color: colors.pink,
  lineHeight: 1.3,
  wordBreak: "break-word",
  width: "100%",
};

const key: CSSProperties = {
  fontSize: 18,
  fontWeight: 400,
  color: colors.textSecondary,
  lineHeight: 1.3,
  wordBreak: "break-word",
  width: "100%",
};
