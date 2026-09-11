import { useCallback, useEffect, useState } from "react";
import { onMessageFromMain, postToMain } from "../lib/messaging";
import type { DocumentSettings, LinkedNodeInfo, SelectionInfo } from "../lib/types";
import { LoadingOverlay } from "./components/LoadingOverlay";
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
  const [linkedNodesLoading, setLinkedNodesLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [gotDocumentSettings, setGotDocumentSettings] = useState(false);
  const [gotClientSettings, setGotClientSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLinkedNodes = useCallback(() => {
    setLinkedNodesLoading(true);
    postToMain({ type: "list-linked-nodes" });
  }, []);

  useEffect(() => {
    const unsubscribe = onMessageFromMain((message) => {
      switch (message.type) {
        case "document-settings":
          setDocumentSettings(message.settings);
          setGotDocumentSettings(true);
          break;
        case "client-settings":
          setApiKey(message.settings.apiKey);
          setGotClientSettings(true);
          break;
        case "selection-changed":
          setSelection(message.selection);
          break;
        case "key-linked":
          setSelection((prev) =>
            prev && prev.nodeId === message.nodeId ? { ...prev, link: message.link } : prev
          );
          setLinkedNodes((prev) => {
            const row: LinkedNodeInfo = {
              nodeId: message.nodeId,
              nodeName: message.nodeName,
              pageName: message.pageName,
              link: message.link,
            };
            const idx = prev.findIndex((n) => n.nodeId === message.nodeId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = row;
              return next;
            }
            return [...prev, row];
          });
          break;
        case "key-unlinked":
          setSelection((prev) =>
            prev && prev.nodeId === message.nodeId ? { ...prev, link: null } : prev
          );
          setLinkedNodes((prev) => prev.filter((n) => n.nodeId !== message.nodeId));
          break;
        case "linked-nodes":
          setLinkedNodes(message.nodes);
          setLinkedNodesLoading(false);
          break;
        case "error":
          setError(message.message);
          setLinkedNodesLoading(false);
          setTimeout(() => setError(null), 4000);
          break;
      }
    });
    postToMain({ type: "ui-ready" });
    return unsubscribe;
  }, [refreshLinkedNodes]);

  useEffect(() => {
    if (gotDocumentSettings && gotClientSettings) setBootstrapped(true);
  }, [gotDocumentSettings, gotClientSettings]);

  const configReady = Boolean(documentSettings.projectId && apiKey);
  const config = { apiUrl: documentSettings.apiUrl, projectId: documentSettings.projectId, apiKey };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: colors.white,
      }}
    >
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

      <div style={{ position: "relative", flex: 1, overflowY: "auto", minHeight: 0 }}>
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
            nodesLoading={linkedNodesLoading}
            onRequestNodes={refreshLinkedNodes}
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
        <LoadingOverlay visible={!bootstrapped} label="Loading plugin…" />
      </div>
    </div>
  );
}
