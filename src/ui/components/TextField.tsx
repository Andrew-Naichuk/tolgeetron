import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { colors, font, radius, space } from "../theme";

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label style={labelStyle}>{children}</label>;
}

export function TextField({
  endAdornment,
  style,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { endAdornment?: ReactNode }) {
  // Always wrap so toggling endAdornment does not remount the input (and steal focus).
  return (
    <div style={wrapStyle}>
      <input
        {...rest}
        style={{ ...inputStyle, ...(endAdornment ? { paddingRight: 40 } : null), ...style }}
      />
      {endAdornment ? <div style={adornmentStyle}>{endAdornment}</div> : null}
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", ...props.style }} />;
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: font.label,
  fontWeight: 400,
  color: colors.text,
  marginBottom: space.xs + 2,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 16px",
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radius.md,
  fontSize: font.input,
  color: colors.text,
  background: colors.white,
  outline: "none",
  fontFamily: "inherit",
};

const wrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
};

const adornmentStyle: CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
};
