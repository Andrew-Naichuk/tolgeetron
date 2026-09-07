import type { CSSProperties, ReactNode } from "react";
import { colors } from "../theme";

type IconProps = { size?: number; color?: string; style?: CSSProperties };

function Svg({
  size = 20,
  color = "currentColor",
  style,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden
    >
      <g stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {children}
      </g>
    </svg>
  );
}

export function IconClose({ size = 20, color = colors.textSecondary, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconEye({ size = 20, color = colors.textSecondary, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </Svg>
  );
}

export function IconEyeOff({ size = 20, color = colors.textSecondary, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.5 2.5 0 003.5 3.5" />
      <path d="M9.9 5.2A11.4 11.4 0 0112 5c6.5 0 10 7 10 7a17.3 17.3 0 01-4.1 4.8" />
      <path d="M6.1 6.1C4 7.6 2.5 9.6 2 12c0 0 3.5 7 10 7a10.6 10.6 0 004.1-.8" />
    </Svg>
  );
}

export function IconTarget({ size = 20, color = colors.pink, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.25" fill={color} stroke="none" />
    </Svg>
  );
}

export function IconExternalLink({ size = 20, color = colors.pink, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M14 5h5v5" />
      <path d="M10 14L19 5" />
      <path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h5" />
    </Svg>
  );
}

export function IconUnlink({ size = 20, color = colors.red, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M9.5 14.5l-1.2 1.2a3.5 3.5 0 11-5-5L5 9" />
      <path d="M14.5 9.5l1.2-1.2a3.5 3.5 0 115 5L19 15" />
      <path d="M8 8l8 8" />
    </Svg>
  );
}

export function IconChevronDown({ size = 20, color = colors.textSecondary, style }: IconProps) {
  return (
    <Svg size={size} color={color} style={style}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}
