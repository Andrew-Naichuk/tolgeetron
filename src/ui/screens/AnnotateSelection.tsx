import { useState } from "react";
import { postToMain } from "../../lib/messaging";
import { buildKeyUrl, createOrUpdateKey, type TolgeeClientConfig } from "../../lib/tolgeeClient";
import type { SelectionInfo, TolgeeKeySearchResult, TolgeeLink } from "../../lib/types";
import { KeySearchCombobox } from "../components/KeySearchCombobox";
import { LinkedKeyBadge } from "../components/LinkedKeyBadge";

const BASE_LANGUAGE = "en";

export function AnnotateSelection({
  selection,
  config,
  configReady,
}: {
  selection: SelectionInfo | null;
  config: TolgeeClientConfig;
  configReady: boolean;
}) {
  const [keyName, setKeyName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [baseText, setBaseText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selection) {
    return <Empty text="Select a text layer or other node to annotate." />;
  }
  if (!selection.supportsAnnotations) {
    return (
      <Empty
        text={`"${selection.type}" nodes don't support Figma annotations. Try a frame, component, text, or shape layer.`}
      />
    );
  }
  if (!configReady) {
    return <Empty text="Add your Tolgee API URL, project ID, and API key in Settings first." />;
  }

  if (selection.link) {
    return (
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, color: "#666" }}>{selection.name}</div>
        <LinkedKeyBadge link={selection.link} />
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={buildKeyUrl(config, selection.link.keyId)}
            target="_blank"
            rel="noreferrer"
            style={linkButton}
          >
            Open in Tolgee
          </a>
          <button
            type="button"
            style={secondaryButton}
            onClick={() => postToMain({ type: "unlink-key", nodeId: selection.nodeId })}
          >
            Unlink
          </button>
        </div>
      </div>
    );
  }

  async function linkExisting(key: TolgeeKeySearchResult) {
    const link: TolgeeLink = {
      keyId: key.keyId,
      keyName: key.keyName,
      namespace: key.namespace,
      projectId: config.projectId,
      baseTranslationPreview: key.baseTranslation,
    };
    postToMain({ type: "link-key", nodeId: selection!.nodeId, link });
  }

  async function createAndLink() {
    if (!keyName.trim()) {
      setError("Key name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { keyId } = await createOrUpdateKey(config, {
        keyName: keyName.trim(),
        namespace: namespace.trim() || undefined,
        baseLanguage: BASE_LANGUAGE,
        text: baseText,
      });
      const link: TolgeeLink = {
        keyId,
        keyName: keyName.trim(),
        namespace: namespace.trim() || undefined,
        projectId: config.projectId,
        baseTranslationPreview: baseText,
      };
      postToMain({ type: "link-key", nodeId: selection!.nodeId, link });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#666" }}>{selection.name}</div>

      <section>
        <h4 style={sectionTitle}>Link an existing key</h4>
        <KeySearchCombobox config={config} onSelect={linkExisting} />
      </section>

      <section>
        <h4 style={sectionTitle}>Create a new key</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="text"
            placeholder="key.name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            style={fieldInput}
          />
          <input
            type="text"
            placeholder="namespace (optional)"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            style={fieldInput}
          />
          <textarea
            placeholder={`Base (${BASE_LANGUAGE}) translation`}
            value={baseText}
            onChange={(e) => setBaseText(e.target.value)}
            rows={3}
            style={fieldInput}
          />
          {selection.textContent && !baseText && (
            <button
              type="button"
              style={secondaryButton}
              onClick={() => setBaseText(selection.textContent ?? "")}
            >
              Use layer text as translation
            </button>
          )}
          {error && <div style={{ color: "#e5484d", fontSize: 11 }}>{error}</div>}
          <button type="button" style={primaryButton} onClick={createAndLink} disabled={busy}>
            {busy ? "Creating…" : "Create & annotate"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: 16, color: "#888", fontSize: 12, textAlign: "center" }}>{text}</div>
  );
}

const sectionTitle = { fontSize: 11, margin: "0 0 6px", color: "#333" };
const fieldInput = { width: "100%", boxSizing: "border-box" as const, padding: "6px 8px" };
const primaryButton = {
  padding: "8px 12px",
  background: "#18a0fb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
const secondaryButton = {
  padding: "6px 10px",
  background: "#eee",
  color: "#333",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
  textDecoration: "none",
  textAlign: "center" as const,
};
const linkButton = { ...secondaryButton, background: "#e93d9a", color: "#fff" };
