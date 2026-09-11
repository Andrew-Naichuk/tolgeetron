/** Shared types used by both the plugin sandbox (main.ts) and the UI (ui.tsx). */

/** Non-secret Tolgee connection settings, stored on the document so the
 * whole team opening this file shares the same project wiring. */
export interface DocumentSettings {
  apiUrl: string;
  projectId: string;
  /** Id of the "Localization" AnnotationCategory once created, cached so we
   * don't recreate/duplicate it on every use. */
  annotationCategoryId?: string;
  /** Id of the "Localization" VariableCollection once created, cached so we
   * don't recreate/duplicate it on every use. */
  variableCollectionId?: string;
  /** BCP-47 tag of the language currently applied to Localization variables
   * for in-file preview (Keys tab). */
  appliedLanguage?: string;
}

/** The secret project API key, stored per-user in figma.clientStorage and
 * never written into the document. */
export interface ClientSettings {
  apiKey: string;
}

/** Structured, durable link between a Figma node and a Tolgee key, stored in
 * the node's pluginData. The visible Figma annotation label is just the key
 * name and can drift; this is the source of truth. */
export interface TolgeeLink {
  keyId: number;
  keyName: string;
  namespace?: string;
  projectId: string;
  /** Base-language translation text at the time of linking, shown as a
   * preview until the user refreshes it. */
  baseTranslationPreview?: string;
  /** Id of the Figma STRING variable created for TEXT nodes and bound to
   * characters. Cleared when the key is unlinked (variable is deleted). */
  variableId?: string;
}

/** Minimal shape of the currently selected node, as reported by main.ts. */
export interface SelectionInfo {
  nodeId: string;
  name: string;
  type: string;
  /** Whether this node type supports Figma's annotations API. */
  supportsAnnotations: boolean;
  /** Text content, if the node is a TextNode (used to pre-fill a suggested
   * base translation when creating a new key). */
  textContent?: string;
  link: TolgeeLink | null;
}

/** One row in the "keys in this file" panel. */
export interface LinkedNodeInfo {
  nodeId: string;
  nodeName: string;
  pageName: string;
  link: TolgeeLink;
}

export interface TolgeeKeySearchResult {
  keyId: number;
  keyName: string;
  namespace?: string;
  baseTranslation?: string;
}

// ---- postMessage protocol between ui.tsx and main.ts ----

export type UiToMainMessage =
  | { type: "ui-ready" }
  | { type: "get-settings" }
  | { type: "save-document-settings"; settings: DocumentSettings }
  | { type: "save-api-key"; apiKey: string }
  | {
      type: "link-key";
      nodeId: string;
      link: TolgeeLink;
    }
  | { type: "unlink-key"; nodeId: string }
  | { type: "list-linked-nodes" }
  | { type: "jump-to-node"; nodeId: string }
  | {
      type: "apply-language-translations";
      updates: Array<{ variableId: string; text: string }>;
    }
  | { type: "resize"; width: number; height: number };

export type MainToUiMessage =
  | { type: "document-settings"; settings: DocumentSettings }
  /** Sent once on load with the API key from figma.clientStorage (main-thread
   * only API), so the UI can hold it in memory to make Tolgee requests. It is
   * never written back into the document. */
  | { type: "client-settings"; settings: ClientSettings }
  | { type: "selection-changed"; selection: SelectionInfo | null }
  /** Sent after a successful link so the UI can upsert the Keys list without
   * a full-document rescan. */
  | {
      type: "key-linked";
      nodeId: string;
      nodeName: string;
      pageName: string;
      link: TolgeeLink;
    }
  | { type: "key-unlinked"; nodeId: string }
  | { type: "linked-nodes"; nodes: LinkedNodeInfo[] }
  /** Sent when main finishes applying language preview values to variables. */
  | { type: "language-translations-applied" }
  | { type: "error"; message: string };
