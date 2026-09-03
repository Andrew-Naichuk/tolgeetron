import { useEffect, useRef, useState } from "react";
import { searchKeys, type TolgeeClientConfig } from "../../lib/tolgeeClient";
import type { TolgeeKeySearchResult } from "../../lib/types";

export function KeySearchCombobox({
  config,
  onSelect,
}: {
  config: TolgeeClientConfig;
  onSelect: (key: TolgeeKeySearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TolgeeKeySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
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
  }, [query]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search existing keys…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box" }}
      />
      {loading && <div style={{ fontSize: 11, color: "#999" }}>Searching…</div>}
      {results.length > 0 && (
        <ul style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>
          {results.map((key) => (
            <li key={key.keyId}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: 4,
                  marginBottom: 4,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {key.namespace ? `${key.namespace}:` : ""}
                  {key.keyName}
                </div>
                {key.baseTranslation && (
                  <div style={{ fontSize: 11, color: "#666" }}>{key.baseTranslation}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
