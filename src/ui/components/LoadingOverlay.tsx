import type { CSSProperties } from "react";
import { colors, font, space } from "../theme";
import { Spinner } from "./Spinner";

export function LoadingOverlay({
  visible,
  label,
  style,
}: {
  visible: boolean;
  label?: string;
  style?: CSSProperties;
}) {
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ ...overlayStyle, ...style }}
    >
      <Spinner />
      {label ? <div style={labelStyle}>{label}</div> : null}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: space.sm,
  background: "rgba(255, 255, 255, 0.78)",
  backdropFilter: "blur(1px)",
};

const labelStyle: CSSProperties = {
  fontSize: font.status,
  color: colors.textSecondary,
  textAlign: "center",
  maxWidth: "80%",
};
