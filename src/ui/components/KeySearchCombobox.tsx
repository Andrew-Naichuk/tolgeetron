import { useEffect, useRef, useState } from "react";
import { searchKeys, type TolgeeClientConfig } from "../../lib/tolgeeClient";
import type { TolgeeKeySearchResult } from "../../lib/types";
import { colors, font, formatKeyLabel, space } from "../theme";
import { IconButton } from "./IconButton";
import { IconClose } from "./icons";
import { KeyResultCard } from "./KeyResultCard";
import { LoadingOverlay } from "./LoadingOverlay";
import { TextField } from "./TextField";

export function KeySearchCombobox({
  config,
  onSelect,
  onQueryChange,
  disabled,
}: {
  config: TolgeeClientConfig;
  onSelect: (key: TolgeeKeySearchResult) => void;
  onQueryChange?: (query: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TolgeeKeySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  function updateQuery(next: string) {
    setQuery(next);
    onQueryChange?.(next);
  }

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!query.trim() || disabled) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchKeys(config, query));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, disabled]);

  const showResults = results.length > 0 || loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
      <TextField
        type="text"
        placeholder="Search existing key..."
        value={query}
        disabled={disabled}
        onChange={(e) => updateQuery(e.target.value)}
        endAdornment={
          query ? (
            <IconButton
              aria-label="Clear search"
              onClick={() => updateQuery("")}
              disabled={disabled}
              style={{ width: 24, height: 24, padding: 0 }}
            >
              <IconClose size={18} />
            </IconButton>
          ) : undefined
        }
      />
      {showResults && (
        <div style={resultsWrap}>
          {results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((key) => (
                <KeyResultCard
                  key={key.keyId}
                  title={key.baseTranslation || key.keyName}
                  subtitle={formatKeyLabel(key.keyName, key.namespace)}
                  onClick={() => onSelect(key)}
                />
              ))}
            </div>
          ) : (
            <div style={{ minHeight: 72 }} />
          )}
          <LoadingOverlay visible={loading} label="Searching keys…" />
        </div>
      )}
      {!loading && query.trim() && results.length === 0 && (
        <div style={{ fontSize: font.status, color: colors.textMuted }}>No keys found</div>
      )}
    </div>
  );
}

const resultsWrap = {
  position: "relative" as const,
  minHeight: 72,
};
