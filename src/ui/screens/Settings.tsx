import { useEffect, useState } from "react";
import { postToMain } from "../../lib/messaging";
import type { DocumentSettings } from "../../lib/types";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { IconEye, IconEyeOff } from "../components/icons";
import { PayPalDonateButton } from "../components/PayPalDonateButton";
import { FieldLabel, TextField } from "../components/TextField";
import { colors, font, space } from "../theme";

const DEFAULT_API_URL = "https://app.tolgee.io";

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
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiUrl(documentSettings.apiUrl);
    setProjectId(documentSettings.projectId);
  }, [documentSettings]);

  useEffect(() => {
    setKey(apiKey);
  }, [apiKey]);

  const linked = Boolean(documentSettings.projectId && apiKey);
  const canSave = Boolean(apiUrl.trim() && projectId.trim() && key.trim());

  function save() {
    if (!canSave) return;
    postToMain({
      type: "save-document-settings",
      settings: { ...documentSettings, apiUrl: apiUrl.trim(), projectId: projectId.trim() },
    });
    postToMain({ type: "save-api-key", apiKey: key.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function unlinkTolgee() {
    setProjectId("");
    setKey("");
    setApiUrl(documentSettings.apiUrl || DEFAULT_API_URL);
    postToMain({
      type: "save-document-settings",
      settings: {
        ...documentSettings,
        apiUrl: documentSettings.apiUrl || DEFAULT_API_URL,
        projectId: "",
      },
    });
    postToMain({ type: "save-api-key", apiKey: "" });
  }

  return (
    <div style={screenColumn}>
      {linked ? (
        <div style={{ ...banner, background: colors.greenBg, color: colors.green }}>
          <span style={bannerDot(colors.green)} />
          Tolgee project linked
        </div>
      ) : (
        <div style={{ ...banner, background: colors.pinkBg, color: colors.red }}>
          <span style={{ ...bannerDot(colors.red), width: 14, height: 14 }} />
          Tolgee not linked yet.
        </div>
      )}

      <div style={fieldBlock}>
        <FieldLabel>Tolgee API URL</FieldLabel>
        <TextField
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://app.tolgee.io"
        />
      </div>

      <div style={fieldBlock}>
        <FieldLabel>Project ID</FieldLabel>
        <TextField
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Available on Tolgee project home."
        />
      </div>

      <div style={fieldBlock}>
        <FieldLabel>Project API key</FieldLabel>
        <TextField
          type={showKey ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Can be generated in Tolgee integrations tab."
          endAdornment={
            <IconButton
              aria-label={showKey ? "Hide API key" : "Show API key"}
              onClick={() => setShowKey((v) => !v)}
              style={{ width: 24, height: 24, padding: 0, color: colors.textSecondary }}
            >
              {showKey ? <IconEye size={18} /> : <IconEyeOff size={18} />}
            </IconButton>
          }
        />
      </div>

      <div style={supportSection}>
        <p style={supportText}>Enjoy using Tolgeetron? Buy developer a coffee!</p>
        <PayPalDonateButton />
      </div>

      <div style={ctaBlock}>
        {linked ? (
          <div style={{ display: "flex", gap: space.lg, width: "100%" }}>
            <Button fullWidth variant="danger" onClick={unlinkTolgee}>
              Unlink Tolgee
            </Button>
            <Button
              fullWidth
              variant={canSave ? "primary" : "muted"}
              disabled={!canSave}
              onClick={save}
            >
              {saved ? "Saved ✓" : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            fullWidth
            variant={canSave ? "primary" : "muted"}
            disabled={!canSave}
            onClick={save}
          >
            {saved ? "Saved ✓" : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

function bannerDot(color: string) {
  return {
    width: 14,
    height: 14,
    borderRadius: "50%" as const,
    background: color,
    flexShrink: 0,
  };
}

const screenColumn = {
  padding: space.lg,
  height: "100%",
  boxSizing: "border-box" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: space.lg,
};

const banner = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "20px 24px",
  borderRadius: 8,
  fontSize: font.button,
  fontWeight: 400,
  width: "100%",
  boxSizing: "border-box" as const,
};

const fieldBlock = {
  display: "flex",
  flexDirection: "column" as const,
  width: "100%",
};

const supportSection = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: space.md,
  padding: `${space.md}px 0`,
  width: "100%",
  background: colors.white,
  borderRadius: 12,
  boxShadow: "0px 2px 6px rgba(61, 13, 77, 0.08)",
  boxSizing: "border-box" as const,
};

const supportText = {
  margin: 0,
  width: "100%",
  textAlign: "center" as const,
  fontSize: font.body,
  fontWeight: 500,
  color: colors.text,
  lineHeight: "normal",
};

const ctaBlock = {
  marginTop: "auto",
  width: "100%",
  flexShrink: 0,
};
