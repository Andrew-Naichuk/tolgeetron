import { onMessageFromUi, postToUi } from "./lib/messaging";
import type {
  DocumentSettings,
  LinkedNodeInfo,
  SelectionInfo,
  TolgeeLink,
  UiToMainMessage,
} from "./lib/types";

const PLUGIN_DATA_NAMESPACE = "tolgeetron";
const SETTINGS_KEY = "settings";
const LINK_KEY = "tolgeeLink";
const CLIENT_STORAGE_API_KEY = "tolgeeApiKey";
const ANNOTATION_CATEGORY_LABEL = "Localization";
const ANNOTATION_CATEGORY_COLOR: AnnotationCategoryColor = "pink";
const VARIABLE_COLLECTION_NAME = "Localization";

/** Node types that support Figma's annotations API. */
const ANNOTATABLE_TYPES = new Set<SceneNode["type"]>([
  "COMPONENT",
  "COMPONENT_SET",
  "ELLIPSE",
  "FRAME",
  "INSTANCE",
  "LINE",
  "POLYGON",
  "RECTANGLE",
  "STAR",
  "TEXT",
  "VECTOR",
]);

figma.showUI(__html__, { width: 340, height: 520 });

// ---- settings (document-level, shared by the whole team) ----

function loadDocumentSettings(): DocumentSettings {
  const raw = figma.root.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SETTINGS_KEY);
  if (!raw) return { apiUrl: "https://app.tolgee.io", projectId: "" };
  try {
    return JSON.parse(raw) as DocumentSettings;
  } catch {
    return { apiUrl: "https://app.tolgee.io", projectId: "" };
  }
}

function saveDocumentSettings(settings: DocumentSettings): void {
  figma.root.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

// ---- API key (per-user, local only, never written to the document) ----

async function loadApiKey(): Promise<string> {
  return (await figma.clientStorage.getAsync(CLIENT_STORAGE_API_KEY)) ?? "";
}

async function saveApiKey(apiKey: string): Promise<void> {
  await figma.clientStorage.setAsync(CLIENT_STORAGE_API_KEY, apiKey);
}

// ---- annotation category ----

async function ensureLocalizationCategory(): Promise<string> {
  const settings = loadDocumentSettings();
  const categories = await figma.annotations.getAnnotationCategoriesAsync();

  if (settings.annotationCategoryId) {
    const existing = categories.find((c) => c.id === settings.annotationCategoryId);
    if (existing) return existing.id;
  }

  const byLabel = categories.find((c) => c.label === ANNOTATION_CATEGORY_LABEL);
  if (byLabel) {
    saveDocumentSettings({ ...settings, annotationCategoryId: byLabel.id });
    return byLabel.id;
  }

  const created = await figma.annotations.addAnnotationCategoryAsync({
    label: ANNOTATION_CATEGORY_LABEL,
    color: ANNOTATION_CATEGORY_COLOR,
  });
  saveDocumentSettings({ ...settings, annotationCategoryId: created.id });
  return created.id;
}

// ---- string variables (TEXT nodes) ----

async function ensureLocalizationCollection(): Promise<VariableCollection> {
  const settings = loadDocumentSettings();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  if (settings.variableCollectionId) {
    const existing = collections.find((c) => c.id === settings.variableCollectionId);
    if (existing) return existing;
  }

  const byName = collections.find((c) => c.name === VARIABLE_COLLECTION_NAME);
  if (byName) {
    saveDocumentSettings({ ...settings, variableCollectionId: byName.id });
    return byName;
  }

  const created = figma.variables.createVariableCollection(VARIABLE_COLLECTION_NAME);
  saveDocumentSettings({ ...settings, variableCollectionId: created.id });
  return created;
}

function variableNameForLink(link: TolgeeLink): string {
  return link.namespace ? `${link.namespace}/${link.keyName}` : link.keyName;
}

async function loadTextNodeFonts(node: TextNode): Promise<void> {
  const fonts =
    node.fontName === figma.mixed
      ? node.getRangeAllFontNames(0, node.characters.length)
      : [node.fontName];
  const unique = new Map<string, FontName>();
  for (const font of fonts) {
    unique.set(`${font.family}__${font.style}`, font);
  }
  await Promise.all([...unique.values()].map((font) => figma.loadFontAsync(font)));
}

async function bindLocalizationVariable(
  textNode: TextNode,
  link: TolgeeLink
): Promise<string> {
  const collection = await ensureLocalizationCollection();
  const name = variableNameForLink(link);
  const modeId = collection.modes[0].modeId;
  const value = textNode.characters;

  const locals = await figma.variables.getLocalVariablesAsync("STRING");
  let variable =
    locals.find((v) => v.variableCollectionId === collection.id && v.name === name) ??
    null;

  if (!variable) {
    variable = figma.variables.createVariable(name, collection, "STRING");
  }

  variable.setValueForMode(modeId, value);
  await loadTextNodeFonts(textNode);
  textNode.setBoundVariable("characters", variable);
  return variable.id;
}

async function removeLocalizationVariable(
  node: SceneNode,
  variableId: string
): Promise<void> {
  if (node.type === "TEXT") {
    try {
      await loadTextNodeFonts(node);
      node.setBoundVariable("characters", null);
    } catch {
      // Node may already be unbound or fonts unavailable; still try to delete.
    }
  }
  const variable = await figma.variables.getVariableByIdAsync(variableId);
  if (variable) {
    variable.remove();
  }
}

// ---- node <-> Tolgee link helpers ----

function readLink(node: SceneNode): TolgeeLink | null {
  const raw = node.getPluginData(LINK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TolgeeLink;
  } catch {
    return null;
  }
}

function writeLink(node: SceneNode, link: TolgeeLink): void {
  node.setPluginData(LINK_KEY, JSON.stringify(link));
}

function clearLink(node: SceneNode): void {
  node.setPluginData(LINK_KEY, "");
}

function getSelectionInfo(node: SceneNode): SelectionInfo {
  return {
    nodeId: node.id,
    name: node.name,
    type: node.type,
    supportsAnnotations: ANNOTATABLE_TYPES.has(node.type),
    textContent: node.type === "TEXT" ? node.characters : undefined,
    link: readLink(node),
  };
}

async function findNodeById(nodeId: string): Promise<SceneNode | null> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.removed) return null;
  return "type" in node ? (node as SceneNode) : null;
}

function broadcastSelection(): void {
  const [node] = figma.currentPage.selection;
  postToUi({
    type: "selection-changed",
    selection: node ? getSelectionInfo(node) : null,
  });
}

figma.on("selectionchange", broadcastSelection);
figma.on("currentpagechange", broadcastSelection);

// ---- message handling ----

async function linkKey(nodeId: string, link: TolgeeLink): Promise<void> {
  const node = await findNodeById(nodeId);
  if (!node) {
    postToUi({ type: "error", message: "The selected node no longer exists." });
    return;
  }
  if (!ANNOTATABLE_TYPES.has(node.type)) {
    postToUi({
      type: "error",
      message: `Annotations aren't supported on ${node.type.toLowerCase()} nodes.`,
    });
    return;
  }

  try {
    let linked: TolgeeLink = link;
    if (node.type === "TEXT") {
      const variableId = await bindLocalizationVariable(node, link);
      linked = { ...link, variableId };
    }

    const categoryId = await ensureLocalizationCategory();
    const annotatable = node as SceneNode & {
      annotations: readonly Annotation[];
    };
    const withoutTolgeeAnnotations = annotatable.annotations.filter(
      (a) => a.categoryId !== categoryId
    );
    annotatable.annotations = [
      ...withoutTolgeeAnnotations,
      { label: linked.keyName, categoryId },
    ];
    writeLink(node, linked);
    postToUi({ type: "key-linked", nodeId, link: linked });
  } catch (err) {
    postToUi({
      type: "error",
      message: err instanceof Error ? err.message : "Failed to create annotation.",
    });
  }
}

async function unlinkKey(nodeId: string): Promise<void> {
  const node = await findNodeById(nodeId);
  if (!node) {
    postToUi({ type: "error", message: "The selected node no longer exists." });
    return;
  }
  const existingLink = readLink(node);
  if (existingLink?.variableId) {
    try {
      await removeLocalizationVariable(node, existingLink.variableId);
    } catch (err) {
      postToUi({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to remove localization variable.",
      });
      return;
    }
  }
  try {
    const categoryId = await ensureLocalizationCategory();
    const annotatable = node as SceneNode & {
      annotations: readonly Annotation[];
    };
    annotatable.annotations = annotatable.annotations.filter(
      (a) => a.categoryId !== categoryId
    );
  } catch {
    // Category may not exist yet; nothing to strip in that case.
  }
  clearLink(node);
  postToUi({ type: "key-unlinked", nodeId });
}

async function listLinkedNodes(): Promise<void> {
  await figma.loadAllPagesAsync();
  const nodes: LinkedNodeInfo[] = [];
  for (const page of figma.root.children) {
    page.findAll((n) => {
      const link = readLink(n as SceneNode);
      if (link) {
        nodes.push({ nodeId: n.id, nodeName: n.name, pageName: page.name, link });
      }
      return false;
    });
  }
  postToUi({ type: "linked-nodes", nodes });
}

async function jumpToNode(nodeId: string): Promise<void> {
  const node = await findNodeById(nodeId);
  if (!node) {
    postToUi({ type: "error", message: "The selected node no longer exists." });
    return;
  }
  const page = node.parent
    ? findParentPage(node)
    : (node as unknown as PageNode);
  if (page && page.type === "PAGE" && figma.currentPage !== page) {
    await figma.setCurrentPageAsync(page);
  }
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

function findParentPage(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current && current.type !== "PAGE") current = current.parent;
  return (current as PageNode) ?? null;
}

onMessageFromUi((message: UiToMainMessage) => {
  switch (message.type) {
    case "ui-ready":
      postToUi({ type: "document-settings", settings: loadDocumentSettings() });
      void loadApiKey().then((apiKey) =>
        postToUi({ type: "client-settings", settings: { apiKey } })
      );
      broadcastSelection();
      break;
    case "get-settings":
      postToUi({ type: "document-settings", settings: loadDocumentSettings() });
      break;
    case "save-document-settings":
      saveDocumentSettings(message.settings);
      break;
    case "save-api-key":
      void saveApiKey(message.apiKey);
      break;
    case "link-key":
      void linkKey(message.nodeId, message.link);
      break;
    case "unlink-key":
      void unlinkKey(message.nodeId);
      break;
    case "list-linked-nodes":
      void listLinkedNodes();
      break;
    case "jump-to-node":
      void jumpToNode(message.nodeId);
      break;
    case "resize":
      figma.ui.resize(message.width, message.height);
      break;
  }
});
