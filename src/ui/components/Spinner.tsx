import type { CSSProperties } from "react";
import { colors } from "../theme";

type SpinnerProps = {
  size?: number;
  color?: string;
  style?: CSSProperties;
};

/** CSS keyframes are injected once so the spinner works without a stylesheet. */
let stylesInjected = false;
function ensureSpinnerStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes tolgee-spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}

export function Spinner({ size = 28, color = colors.pink, style }: SpinnerProps) {
  ensureSpinnerStyles();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        flexShrink: 0,
        animation: "tolgee-spin 0.7s linear infinite",
        ...style,
      }}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={2.25}
        strokeOpacity={0.2}
        fill="none"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
