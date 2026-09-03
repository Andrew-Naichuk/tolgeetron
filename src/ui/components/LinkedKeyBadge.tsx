import type { TolgeeLink } from "../../lib/types";

export function LinkedKeyBadge({ link }: { link: TolgeeLink }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 10px",
        borderRadius: 8,
        background: "#2c2c2c",
        color: "#fff",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          background: "#e93d9a",
          color: "#fff",
          fontWeight: 700,
          fontSize: 10,
          borderRadius: 12,
          padding: "2px 8px",
        }}
      >
        Localization
      </span>
      <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
        {link.namespace ? `${link.namespace}:` : ""}
        {link.keyName}
      </span>
    </div>
  );
}
