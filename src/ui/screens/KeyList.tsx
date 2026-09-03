import { useEffect } from "react";
import { postToMain } from "../../lib/messaging";
import { buildKeyUrl, type TolgeeClientConfig } from "../../lib/tolgeeClient";
import type { LinkedNodeInfo } from "../../lib/types";

export function KeyList({
  nodes,
  config,
}: {
  nodes: LinkedNodeInfo[];
  config: TolgeeClientConfig;
}) {
  useEffect(() => {
    postToMain({ type: "list-linked-nodes" });
  }, []);

  if (nodes.length === 0) {
    return (
      <div style={{ padding: 16, color: "#888", fontSize: 12, textAlign: "center" }}>
        No nodes in this file are linked to a Tolgee key yet.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {nodes.map((row) => (
        <div
          key={row.nodeId}
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: "#666" }}>
            {row.pageName} / {row.nodeName}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12 }}>
            {row.link.namespace ? `${row.link.namespace}:` : ""}
            {row.link.keyName}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              style={smallButton}
              onClick={() => postToMain({ type: "jump-to-node", nodeId: row.nodeId })}
            >
              Jump to node
            </button>
            <a
              href={buildKeyUrl(config, row.link.keyId)}
              target="_blank"
              rel="noreferrer"
              style={smallButton}
            >
              Open in Tolgee
            </a>
            <button
              type="button"
              style={{ ...smallButton, marginLeft: "auto", color: "#e5484d" }}
              onClick={() => postToMain({ type: "unlink-key", nodeId: row.nodeId })}
            >
              Unlink
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const smallButton = {
  padding: "4px 8px",
  background: "#f5f5f5",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  textDecoration: "none",
  color: "#333",
};
