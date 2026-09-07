import { useEffect, useRef, useState } from "react";
import { postToMain } from "../../lib/messaging";
import {
  buildKeyUrl,
  getTranslationsForKeys,
  listLanguages,
  type TolgeeClientConfig,
  type TolgeeLanguage,
} from "../../lib/tolgeeClient";
import type { DocumentSettings, LinkedNodeInfo } from "../../lib/types";
import { EmptyDashed } from "../components/EmptyDashed";
import { IconButton } from "../components/IconButton";
import { IconExternalLink, IconTarget, IconUnlink } from "../components/icons";
import { KeyResultCard } from "../components/KeyResultCard";
import { SelectField } from "../components/SelectField";
import { colors, formatKeyLabel, space } from "../theme";

export function KeyList({
  nodes,
  config,
  configReady,
  documentSettings,
  onAppliedLanguageChange,
}: {
  nodes: LinkedNodeInfo[];
  config: TolgeeClientConfig;
  configReady: boolean;
  documentSettings: DocumentSettings;
  onAppliedLanguageChange: (tag: string) => void;
}) {
  const [languages, setLanguages] = useState<TolgeeLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(
    documentSettings.appliedLanguage ?? ""
  );
  const [translationsByKeyId, setTranslationsByKeyId] = useState<Map<number, string>>(
    () => new Map()
  );
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [applying, setApplying] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const applyGen = useRef(0);
  const persistLanguage = useRef(onAppliedLanguageChange);
  persistLanguage.current = onAppliedLanguageChange;
  const appliedLanguageRef = useRef(documentSettings.appliedLanguage);
  appliedLanguageRef.current = documentSettings.appliedLanguage;

  useEffect(() => {
    postToMain({ type: "list-linked-nodes" });
  }, []);

  useEffect(() => {
    if (!configReady) {
      setLanguages([]);
      setSelectedLanguage("");
      setLanguageError(null);
      return;
    }

    let cancelled = false;
    setLoadingLanguages(true);
    setLanguageError(null);
    void listLanguages(config)
      .then((langs) => {
        if (cancelled) return;
        setLanguages(langs);
        const saved = appliedLanguageRef.current;
        const preferred =
          (saved && langs.find((l) => l.tag === saved)?.tag) ||
          langs.find((l) => l.base)?.tag ||
          langs[0]?.tag ||
          "";
        setSelectedLanguage(preferred);
        if (preferred && preferred !== saved) {
          persistLanguage.current(preferred);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLanguages([]);
        setSelectedLanguage("");
        setLanguageError(err instanceof Error ? err.message : "Failed to load languages.");
      })
      .finally(() => {
        if (!cancelled) setLoadingLanguages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configReady, config.apiUrl, config.projectId, config.apiKey]);
  useEffect(() => {
    if (!configReady || !selectedLanguage) {
      setTranslationsByKeyId(new Map());
      return;
    }

    const keyIds = [...new Set(nodes.map((n) => n.link.keyId))];
    if (keyIds.length === 0) {
      setTranslationsByKeyId(new Map());
      return;
    }

    const gen = ++applyGen.current;
    setApplying(true);
    void getTranslationsForKeys(config, { language: selectedLanguage, keyIds })
      .then((map) => {
        if (gen !== applyGen.current) return;
        setTranslationsByKeyId(map);

        const updates = nodes
          .filter((n) => n.link.variableId)
          .map((n) => ({
            variableId: n.link.variableId!,
            text: map.get(n.link.keyId) ?? "",
          }));
        if (updates.length > 0) {
          postToMain({ type: "apply-language-translations", updates });
        }
      })
      .catch(() => {
        if (gen !== applyGen.current) return;
        setTranslationsByKeyId(new Map());
      })
      .finally(() => {
        if (gen === applyGen.current) setApplying(false);
      });
  }, [configReady, selectedLanguage, nodes, config.apiUrl, config.projectId, config.apiKey]);
  function handleLanguageChange(tag: string) {
    setSelectedLanguage(tag);
    if (tag) onAppliedLanguageChange(tag);
  }

  const selectorDisabled = !configReady || loadingLanguages || languages.length === 0;

  return (
    <div style={screenPad}>
      <SelectField
        label="Applied language"
        value={selectedLanguage}
        disabled={selectorDisabled}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {!configReady ? (
          <option value="">Configure Tolgee in Settings</option>
        ) : loadingLanguages ? (
          <option value="">Loading languages…</option>
        ) : languages.length === 0 ? (
          <option value="">
            {languageError ? "Failed to load languages" : "No languages found"}
          </option>
        ) : (
          languages.map((lang) => (
            <option key={lang.tag} value={lang.tag}>
              {lang.name}
            </option>
          ))
        )}
      </SelectField>

      {languageError ? <div style={errorStyle}>{languageError}</div> : null}

      {nodes.length === 0 ? (
        <EmptyDashed>No Tolgee keys linked here yet</EmptyDashed>
      ) : (
        <div style={listStyle}>
          {nodes.map((row) => {
            const translation = translationsByKeyId.get(row.link.keyId);
            const title =
              translation === undefined
                ? applying
                  ? "…"
                  : row.link.baseTranslationPreview || "—"
                : translation || "—";
            return (
              <KeyResultCard
                key={row.nodeId}
                title={title}
                subtitle={formatKeyLabel(row.link.keyName, row.link.namespace)}
                titleColor={colors.textSecondary}
                actions={
                  <>
                    <IconButton
                      aria-label="Jump to node"
                      title="Jump to node"
                      onClick={() =>
                        postToMain({ type: "jump-to-node", nodeId: row.nodeId })
                      }
                    >
                      <IconTarget />
                    </IconButton>
                    <a
                      href={buildKeyUrl(config, row.link.keyName)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open in Tolgee"
                      title="Open in Tolgee"
                      style={{ display: "flex", color: colors.pink }}
                    >
                      <IconExternalLink />
                    </a>
                    <IconButton
                      aria-label="Unlink"
                      title="Unlink"
                      onClick={() =>
                        postToMain({ type: "unlink-key", nodeId: row.nodeId })
                      }
                    >
                      <IconUnlink />
                    </IconButton>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const screenPad = {
  padding: space.lg,
  height: "100%",
  boxSizing: "border-box" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: space.lg,
};

const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  overflowY: "auto" as const,
  flex: 1,
  minHeight: 0,
};

const errorStyle = {
  color: colors.red,
  fontSize: 14,
};
