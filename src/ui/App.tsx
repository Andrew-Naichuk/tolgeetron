import { useEffect, useState } from "react";
import { onMessageFromMain, postToMain } from "../lib/messaging";
import type { DocumentSettings, LinkedNodeInfo, SelectionInfo } from "../lib/types";
import { colors, font } from "./theme";
import { AnnotateSelection } from "./screens/AnnotateSelection";
import { KeyList } from "./screens/KeyList";
import { Settings } from "./screens/Settings";

type Tab = "annotate" | "keys" | "settings";

const DEFAULT_SETTINGS: DocumentSettings = { apiUrl: "https://app.tolgee.io", projectId: "" };

const TABS: { id: Tab; label: string }[] = [
  { id: "annotate", label: "Annotate" },
  { id: "keys", label: "Keys" },
  { id: "settings", label: "Settings" },
];

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: colors.white }}>
      <nav style={{ display: "flex", flexShrink: 0 }}>
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: "13px 10px 12px",
                border: "none",
                borderBottom: active ? `4px solid ${colors.pink}` : `4px solid ${colors.border}`,
                background: active ? colors.pinkBg : colors.white,
                color: active ? colors.pink : colors.textSecondary,
                fontWeight: 500,
                fontSize: font.body,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {error && (
        <div
          style={{
            background: colors.redBg,
            color: colors.red,
            fontSize: font.status,
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {tab === "annotate" && (
          <AnnotateSelection
            selection={selection}
            config={config}
            configReady={configReady}
            onOpenSettings={() => setTab("settings")}
          />
        )}
        {tab === "keys" && (
          <KeyList
            nodes={linkedNodes}
            config={config}
            configReady={configReady}
            documentSettings={documentSettings}
            onAppliedLanguageChange={(tag) => {
              const next = { ...documentSettings, appliedLanguage: tag };
              setDocumentSettings(next);
              postToMain({ type: "save-document-settings", settings: next });
            }}
          />
        )}
        {tab === "settings" && <Settings documentSettings={documentSettings} apiKey={apiKey} />}
      </div>
    </div>
  );
}
