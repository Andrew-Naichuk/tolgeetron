import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { colors, radius } from "../theme";

export function IconButton({
  children,
  style,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...base,
        ...(disabled ? { opacity: 0.4, cursor: "default" } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

const base: CSSProperties = {
  width: 32,
  height: 32,
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: radius.sm,
  background: "transparent",
  cursor: "pointer",
  color: colors.pink,
};
