import type { CSSProperties, ReactNode, SelectHTMLAttributes } from "react";
import { colors, font, radius, space } from "../theme";
import { IconChevronDown } from "./icons";

export function SelectField({
  label,
  children,
  style,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={blockStyle}>
      {label != null ? <label style={labelStyle}>{label}</label> : null}
      <div style={wrapStyle}>
        <select {...rest} style={{ ...selectStyle, ...style }}>
          {children}
        </select>
        <div style={adornmentStyle} aria-hidden>
          <IconChevronDown />
        </div>
      </div>
    </div>
  );
}

const blockStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: space.sm,
};

const labelStyle: CSSProperties = {
  fontSize: font.label,
  fontWeight: 400,
  color: colors.text,
};

const wrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
};

const selectStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 40px 10px 16px",
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radius.md,
  fontSize: font.button,
  color: colors.textSecondary,
  background: colors.white,
  outline: "none",
  fontFamily: "inherit",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
};

const adornmentStyle: CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
  pointerEvents: "none",
};
