import { useEffect, useState, type ReactNode } from "react";
import { onMessageFromMain, postToMain } from "../lib/messaging";
import type { DocumentSettings, LinkedNodeInfo, SelectionInfo } from "../lib/types";
import { AnnotateSelection } from "./screens/AnnotateSelection";
import { KeyList } from "./screens/KeyList";
import { Settings } from "./screens/Settings";

type Tab = "annotate" | "keys" | "settings";

const DEFAULT_SETTINGS: DocumentSettings = { apiUrl: "https://app.tolgee.io", projectId: "" };

export function App() {
  const [tab, setTab] = useState<Tab>("annotate");
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState("");
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [linkedNodes, setLinkedNodes] = useState<LinkedNodeInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onMessageFromMain((message) => {
      switch (message.type) {
        case "document-settings":
          setDocumentSettings(message.settings);
          break;
        case "client-settings":
          setApiKey(message.settings.apiKey);
          break;
        case "selection-changed":
          setSelection(message.selection);
          break;
        case "key-linked":
          setSelection((prev) =>
            prev && prev.nodeId === message.nodeId ? { ...prev, link: message.link } : prev
          );
          postToMain({ type: "list-linked-nodes" });
          break;
        case "key-unlinked":
          setSelection((prev) =>
            prev && prev.nodeId === message.nodeId ? { ...prev, link: null } : prev
          );
          postToMain({ type: "list-linked-nodes" });
          break;
        case "linked-nodes":
          setLinkedNodes(message.nodes);
          break;
        case "error":
          setError(message.message);
          setTimeout(() => setError(null), 4000);
          break;
      }
    });
    postToMain({ type: "ui-ready" });
    return unsubscribe;
  }, []);

  const configReady = Boolean(documentSettings.projectId && apiKey);
  const config = { apiUrl: documentSettings.apiUrl, projectId: documentSettings.projectId, apiKey };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <nav style={{ display: "flex", borderBottom: "1px solid #eee" }}>
        <TabButton active={tab === "annotate"} onClick={() => setTab("annotate")}>
          Annotate
        </TabButton>
        <TabButton active={tab === "keys"} onClick={() => setTab("keys")}>
          Keys in file
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
          Settings
        </TabButton>
      </nav>

      {error && (
        <div style={{ background: "#fde8e8", color: "#c81e1e", fontSize: 11, padding: 8 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "annotate" && (
          <AnnotateSelection selection={selection} config={config} configReady={configReady} />
        )}
        {tab === "keys" && <KeyList nodes={linkedNodes} config={config} />}
        {tab === "settings" && <Settings documentSettings={documentSettings} apiKey={apiKey} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 6px",
        border: "none",
        background: "transparent",
        borderBottom: active ? "2px solid #18a0fb" : "2px solid transparent",
        color: active ? "#18a0fb" : "#555",
        fontWeight: active ? 600 : 400,
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
