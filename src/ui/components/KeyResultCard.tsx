import type { CSSProperties, ReactNode } from "react";
import { clamp2Lines, colors, font, fontFamilyMono, radius, space } from "../theme";

export function KeyResultCard({
  title,
  subtitle,
  onClick,
  actions,
  titleColor = colors.pink,
}: {
  title: string;
  subtitle: string;
  onClick?: () => void;
  actions?: ReactNode;
  titleColor?: string;
}) {
  const content = (
    <>
      <div style={textCol}>
        <div style={{ ...titleStyle, color: titleColor }}>{title}</div>
        <div style={subtitleStyle}>{subtitle}</div>
      </div>
      {actions ? <div style={actionsStyle}>{actions}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...card, ...clickable }}>
        {content}
      </button>
    );
  }

  return <div style={card}>{content}</div>;
}

const card: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: space.sm,
  width: "100%",
  boxSizing: "border-box",
  padding: `${space.xs + 2}px ${space.md}px`,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  background: colors.white,
  textAlign: "left",
  fontFamily: "inherit",
};

const clickable: CSSProperties = {
  cursor: "pointer",
  border: `1px solid ${colors.border}`,
};

const textCol: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const titleStyle: CSSProperties = {
  ...clamp2Lines,
  fontSize: font.cardTitle,
  fontWeight: 500,
  lineHeight: 1.3,
};

const subtitleStyle: CSSProperties = {
  fontSize: font.cardKey,
  fontFamily: fontFamilyMono,
  color: colors.textMuted,
  lineHeight: 1.3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};
