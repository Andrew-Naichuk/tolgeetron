import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { colors, font, radius } from "../theme";

type Variant = "primary" | "danger" | "muted";

export function Button({
  variant = "primary",
  fullWidth,
  children,
  style,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  const isDisabled = Boolean(disabled);
  const background =
    isDisabled || variant === "muted"
      ? colors.pinkMuted
      : variant === "danger"
        ? colors.red
        : colors.pink;

  return (
    <button
      type="button"
      disabled={isDisabled}
      style={{
        ...base,
        flex: fullWidth ? 1 : undefined,
        width: fullWidth ? "100%" : undefined,
        background,
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled && variant !== "muted" ? 1 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

const base: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 10px",
  border: "none",
  borderRadius: radius.md,
  color: colors.white,
  fontSize: font.button,
  fontWeight: 500,
  lineHeight: 1.2,
  textDecoration: "none",
  boxSizing: "border-box",
};
