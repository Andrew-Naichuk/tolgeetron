import type { CSSProperties } from "react";
import { colors, font, fontFamilyMono, radius, space } from "../theme";

export function TagFilter({
  tags,
  selected,
  onChange,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  if (tags.length === 0) return null;

  function toggle(tag: string) {
    if (disabled) return;
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div style={wrap}>
      <span style={label}>Filter by tag</span>
      <div style={chipRow} role="group" aria-label="Filter by tag">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => toggle(tag)}
              style={{
                ...chip,
                ...(isSelected ? chipSelected : chipIdle),
                ...(disabled ? chipDisabled : null),
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const wrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: space.sm,
  width: "100%",
};

const label: CSSProperties = {
  fontSize: font.label,
  color: colors.text,
};

const chipRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: space.sm,
  alignItems: "flex-start",
  width: "100%",
};

const chip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 16px",
  borderRadius: radius.pill,
  fontSize: font.status,
  fontFamily: fontFamilyMono,
  lineHeight: "normal",
  whiteSpace: "nowrap",
  cursor: "pointer",
  boxSizing: "border-box",
};

const chipIdle: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.inputBorder}`,
  color: colors.text,
};

const chipSelected: CSSProperties = {
  background: colors.pinkSurface,
  border: `3px solid ${colors.pink}`,
  color: colors.pink,
  padding: "8px 14px",
};

const chipDisabled: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};
