import { useEffect, useState } from "react";
import { onMessageFromMain, postToMain } from "../../lib/messaging";
import { buildKeyUrl, createOrUpdateKey, type TolgeeClientConfig } from "../../lib/tolgeeClient";
import type { SelectionInfo, TolgeeKeySearchResult, TolgeeLink } from "../../lib/types";
import { Button } from "../components/Button";
import { EmptyDashed } from "../components/EmptyDashed";
import { KeySearchCombobox } from "../components/KeySearchCombobox";
import { LoadingOverlay } from "../components/LoadingOverlay";
import {
  LayerKey,
  LayerTitle,
  SelectedLayerCard,
} from "../components/SelectedLayerCard";
import { StatusDot } from "../components/StatusDot";
import { FieldLabel, TextField } from "../components/TextField";
import {
  colors,
  font,
  formatKeyLabel,
  formatVariableName,
  radius,
  slugifyKeyName,
  space,
} from "../theme";

const BASE_LANGUAGE = "en";

export function AnnotateSelection({
  selection,
  config,
  configReady,
  onOpenSettings,
}: {
  selection: SelectionInfo | null;
  config: TolgeeClientConfig;
  configReady: boolean;
  onOpenSettings: () => void;
}) {
  const [keyName, setKeyName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [baseText, setBaseText] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Working…");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [seededForNode, setSeededForNode] = useState<string | null>(null);

  useEffect(() => {
    return onMessageFromMain((message) => {
      if (
        message.type === "key-linked" ||
        message.type === "key-unlinked" ||
        message.type === "error"
      ) {
        setBusy(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!selection || selection.link || !selection.supportsAnnotations) {
      setSeededForNode(null);
      return;
    }
    if (seededForNode === selection.nodeId) return;
    const text = selection.textContent?.trim() ?? "";
    setBaseText(text);
    setKeyName(text ? slugifyKeyName(text) : "");
    setNamespace("");
    setError(null);
    setSearchQuery("");
    setSeededForNode(selection.nodeId);
  }, [selection, seededForNode]);

  async function linkExisting(key: TolgeeKeySearchResult) {
    if (!selection || busy) return;
    const link: TolgeeLink = {
      keyId: key.keyId,
      keyName: key.keyName,
      namespace: key.namespace,
      projectId: config.projectId,
      baseTranslationPreview: key.baseTranslation,
    };
    setBusy(true);
    setBusyLabel("Linking key…");
    setError(null);
    postToMain({ type: "link-key", nodeId: selection.nodeId, link });
  }

  async function createAndLink() {
    if (!selection || busy) return;
    if (!keyName.trim()) {
      setError("Key name is required.");
      return;
    }
    setBusy(true);
    setBusyLabel("Creating key…");
    setError(null);
    try {
      const { keyId } = await createOrUpdateKey(config, {
        keyName: keyName.trim(),
        namespace: namespace.trim() || undefined,
        baseLanguage: BASE_LANGUAGE,
        text: baseText,
      });
      setBusyLabel("Annotating layer…");
      const link: TolgeeLink = {
        keyId,
        keyName: keyName.trim(),
        namespace: namespace.trim() || undefined,
        projectId: config.projectId,
        baseTranslationPreview: baseText,
      };
      postToMain({ type: "link-key", nodeId: selection.nodeId, link });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key.");
      setBusy(false);
    }
  }

  if (!configReady) {
    return (
      <div style={screenPad}>
        <EmptyDashed>
          <div>
            Tolgee project is not linked yet.
            <br />
            Open{" "}
            <button type="button" onClick={onOpenSettings} style={settingsLink}>
              Settings
            </button>{" "}
            to connect.
          </div>
        </EmptyDashed>
      </div>
    );
  }

  if (selection && !selection.supportsAnnotations) {
    return (
      <div style={screenPad}>
        <EmptyDashed>
          <div>
            &quot;{selection.type}&quot; nodes don&apos;t support Figma annotations.
            <br />
            Try a frame, component, text, or shape layer.
          </div>
        </EmptyDashed>
      </div>
    );
  }

  if (selection?.link) {
    return (
      <LinkedView
        selection={selection}
        config={config}
        busy={busy}
        busyLabel={busyLabel}
        onBusy={(label) => {
          setBusy(true);
          setBusyLabel(label);
        }}
      />
    );
  }

  const canCreate = Boolean(selection && keyName.trim() && !busy);
  const searchMode = searchQuery.trim().length > 0;

  return (
    <div style={screenColumn}>
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm, flexShrink: 0 }}>
        <div style={headerRow}>
          <span style={sectionLabel}>Selected layer</span>
          {selection ? (
            <StatusDot label="Not linked" tone="red" />
          ) : (
            <StatusDot label="Not selected" tone="gray" />
          )}
        </div>
        {selection ? (
          <SelectedLayerCard>
            <LayerTitle>{displayLayerLabel(selection)}</LayerTitle>
          </SelectedLayerCard>
        ) : (
          <SelectedLayerCard dashed>
            <span style={{ color: colors.pink, fontSize: font.body }}>
              Select text in design to localize
            </span>
          </SelectedLayerCard>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: space.sm, flexShrink: 0 }}>
        <span style={sectionLabel}>Link existing Tolgee key</span>
        <KeySearchCombobox
          key={selection?.nodeId ?? "none"}
          config={config}
          disabled={!selection || busy}
          onQueryChange={setSearchQuery}
          onSelect={linkExisting}
        />
      </div>

      {!searchMode && (
        <>
          <OrDivider />
          <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
            <span style={sectionLabel}>Create new key</span>
            <TextField
              type="text"
              placeholder="Key name"
              value={keyName}
              disabled={!selection || busy}
              onChange={(e) => setKeyName(e.target.value)}
            />
            <TextField
              type="text"
              placeholder="Namespace (optional)"
              value={namespace}
              disabled={!selection || busy}
              onChange={(e) => setNamespace(e.target.value)}
            />
            <TextField
              type="text"
              placeholder="Base translation"
              value={baseText}
              disabled={!selection || busy}
              onChange={(e) => setBaseText(e.target.value)}
            />
            {error && <div style={{ color: colors.red, fontSize: font.status }}>{error}</div>}
          </div>
        </>
      )}

      {!searchMode && (
        <div style={ctaBlock}>
          <Button
            fullWidth
            disabled={!canCreate}
            variant={canCreate ? "primary" : "muted"}
            onClick={createAndLink}
          >
            Create and annotate
          </Button>
        </div>
      )}
      <LoadingOverlay visible={busy} label={busyLabel} />
    </div>
  );
}

function LinkedView({
  selection,
  config,
  busy,
  busyLabel,
  onBusy,
}: {
  selection: SelectionInfo;
  config: TolgeeClientConfig;
  busy: boolean;
  busyLabel: string;
  onBusy: (label: string) => void;
}) {
  const link = selection.link!;
  const variableName = formatVariableName(link.keyName, link.namespace);

  return (
    <div style={screenColumn}>
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm, flexShrink: 0 }}>
        <div style={headerRow}>
          <span style={sectionLabel}>Selected layer</span>
          <StatusDot label="Linked" tone="green" />
        </div>
        <SelectedLayerCard>
          <LayerTitle>{displayLayerLabel(selection)}</LayerTitle>
          <LayerKey>{formatKeyLabel(link.keyName, link.namespace)}</LayerKey>
        </SelectedLayerCard>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
        <FieldLabel>Connected variable</FieldLabel>
        <div style={{ fontSize: font.title, color: colors.textSecondary, wordBreak: "break-word" }}>
          {variableName}
        </div>
      </div>

      <div style={ctaBlock}>
        <div style={{ display: "flex", gap: space.lg, width: "100%" }}>
          <Button
            fullWidth
            variant="danger"
            disabled={busy}
            onClick={() => {
              onBusy("Unlinking key…");
              postToMain({ type: "unlink-key", nodeId: selection.nodeId });
            }}
          >
            Unlink
          </Button>
          <a
            href={buildKeyUrl(config, link.keyName)}
            target="_blank"
            rel="noreferrer"
            style={primaryLink}
          >
            Open in Tolgee
          </a>
        </div>
      </div>
      <LoadingOverlay visible={busy} label={busyLabel} />
    </div>
  );
}

function OrDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, height: 1, background: colors.border }} />
      <span style={{ fontSize: font.status, color: colors.textMuted }}>OR</span>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
    </div>
  );
}

function displayLayerLabel(selection: SelectionInfo): string {
  return selection.textContent?.trim() || selection.name;
}

const screenPad = {
  position: "relative" as const,
  padding: space.lg,
  height: "100%",
  boxSizing: "border-box" as const,
  display: "flex",
  flexDirection: "column" as const,
};

const screenColumn = {
  ...screenPad,
  gap: space.lg,
  paddingBottom: space.lg,
};

const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  width: "100%",
};

const sectionLabel = {
  fontSize: font.label,
  color: colors.text,
  flex: 1,
};

const settingsLink = {
  background: "none",
  border: "none",
  padding: 0,
  color: colors.pink,
  textDecoration: "underline",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 600,
};

const ctaBlock = {
  marginTop: "auto",
  width: "100%",
  flexShrink: 0,
  paddingTop: space.sm,
};

const primaryLink = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 10px",
  borderRadius: radius.md,
  background: colors.pink,
  color: colors.white,
  fontSize: font.button,
  fontWeight: 500,
  textDecoration: "none",
  boxSizing: "border-box" as const,
};
