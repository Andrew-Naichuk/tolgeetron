import { useState, type CSSProperties } from "react";
import { postToMain } from "../../lib/messaging";
import type { DocumentSettings } from "../../lib/types";

export function Settings({
  documentSettings,
  apiKey,
}: {
  documentSettings: DocumentSettings;
  apiKey: string;
}) {
  const [apiUrl, setApiUrl] = useState(documentSettings.apiUrl);
  const [projectId, setProjectId] = useState(documentSettings.projectId);
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  function save() {
    postToMain({
      type: "save-document-settings",
      settings: { ...documentSettings, apiUrl: apiUrl.trim(), projectId: projectId.trim() },
    });
    postToMain({ type: "save-api-key", apiKey: key.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
      <div>
        <label style={fieldLabel}>Tolgee API URL</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://app.tolgee.io"
          style={fieldInput}
        />
        <div style={hint}>
          Self-hosted instances must be added to <code>manifest.json</code>'s{" "}
          <code>networkAccess.allowedDomains</code> and the plugin rebuilt.
        </div>
      </div>
      <div>
        <label style={fieldLabel}>Project ID</label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="123"
          style={fieldInput}
        />
        <div style={hint}>Shared with your team — stored on this Figma document.</div>
      </div>
      <div>
        <label style={fieldLabel}>Project API key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="tgpak_…"
          style={fieldInput}
        />
        <div style={hint}>
          Stored only on this device (never written into the Figma file). Each
          collaborator pastes their own key.
        </div>
      </div>
      <button type="button" onClick={save} style={primaryButton}>
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

const fieldLabel: CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 11,
  marginBottom: 4,
};
const fieldInput: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
};
const hint: CSSProperties = { fontSize: 10, color: "#888", marginTop: 3 };
const primaryButton: CSSProperties = {
  padding: "8px 12px",
  background: "#18a0fb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};
