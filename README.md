# Tolgeetron

A Figma plugin that links [Tolgee](https://tolgee.io) translation keys to
specific nodes on the canvas, and shows that link as a native Figma **Dev
Mode annotation** — a pink "Localization" pin with the Tolgee key name,
pointed at the node.

Instead of a designer telling a developer a key name out of band (or stuffing
it into a layer name), the key lives as an inspectable annotation that shows
up in Figma's own Dev Mode panel when a developer picks up the file.

## How it works

- **Annotations** use Figma's native `figma.annotations` API with a custom
  `"Localization"` category (pink), created once per file and reused after
  that. Only node types Figma supports for annotations can be annotated:
  components, component sets, frames, instances, text, and basic shapes
  (ellipse, line, polygon, rectangle, star, vector) — not groups or sections.
- Each annotated node also carries a structured link
  (`{ keyId, keyName, namespace, projectId }`) in its plugin data, so the
  plugin can find its way back to the exact Tolgee key even if the key is
  later renamed (the annotation label alone wouldn't survive a rename).
- **Settings are split on purpose**:
  - The Tolgee **API URL** and **project ID** are stored on the Figma
    *document* (shared plugin data), so everyone who opens the file gets the
    same project wired up automatically.
  - The Tolgee **project API key** (the secret) is stored per-user in
    `figma.clientStorage` and is never written into the Figma file. Each
    collaborator pastes their own key once, in the Settings tab.
- Authentication is a Tolgee **project API key** (`X-API-Key` header), scoped
  to exactly the project the file is linked to — not a personal access token.

## Project structure

```
manifest.json          Figma plugin manifest
src/
  main.ts               Plugin sandbox: selection tracking, annotations, plugin data
  ui.tsx                 React entry point for the plugin UI (iframe)
  ui/
    App.tsx               Tab shell (Annotate / Keys in file / Settings)
    screens/               One component per tab
    components/            KeySearchCombobox, LinkedKeyBadge
  lib/
    tolgeeClient.ts        Thin fetch wrapper around the Tolgee REST API
    messaging.ts           Typed postMessage helpers shared by main.ts and ui.tsx
    types.ts               Shared types + the UI<->main message protocol
```

## Setup

```
npm install
npm run build     # bundles src/main.ts and src/ui.tsx into dist/
npm run watch      # same, but rebuilds on change
npm run typecheck
```

In Figma Desktop: **Plugins → Development → Import plugin from manifest…**
and select `manifest.json` in this repo. Re-run after each build (or use
`npm run watch` and just re-open the plugin).

### Connecting to Tolgee

1. Open the plugin, go to **Settings**.
2. Set the **API URL** (defaults to `https://app.tolgee.io`), your Tolgee
   **project ID**, and your **project API key** (`tgpak_…`, generated in
   Tolgee under project settings → API keys).
3. Self-hosted Tolgee: add your instance's domain to
   `manifest.json`'s `networkAccess.allowedDomains` and rebuild — Figma plugin
   manifests only allow a static, pre-declared list of domains for network
   requests, so a self-hosted URL typed into Settings won't be reachable until
   its domain is added there too.

## Using it

1. Select a supported node (e.g. a text layer).
2. In the **Annotate** tab, either search for and link an existing Tolgee
   key, or type a new key name (+ optional namespace) and a base translation,
   then **Create & annotate**.
3. A pink "Localization" annotation pin appears on the node, visible on
   canvas and in Figma's Dev Mode inspector.
4. The **Keys in file** tab lists every node in the file linked to a Tolgee
   key, with jump-to-node, "Open in Tolgee", and unlink actions.

## Manual verification checklist

- [ ] `npm run build` completes with no errors.
- [ ] Plugin loads in Figma Desktop via Import plugin from manifest.
- [ ] Settings save the API URL/project ID (document-level) and API key
      (client-level) and both come back after reopening the plugin.
- [ ] Selecting a text node and creating a new key shows the pink
      "Localization" pin on canvas and in Dev Mode; the key exists in the
      Tolgee project afterwards (check the Tolgee web app).
- [ ] "Keys in file" lists the new link; "Jump to node" selects/zooms to it;
      "Unlink" removes both the annotation and the plugin data.
- [ ] Closing and reopening the file preserves the annotation and the link
      (both are document-stored); a second collaborator's Settings tab shows
      the same API URL/project ID but an empty API key field (client-stored,
      by design).

## Known limitations

- Groups and Sections can't carry annotations (a Figma API restriction) —
  annotate the frame/text/shape inside them instead.
- The Tolgee API URL allowlist in `manifest.json` is static; self-hosted
  instances require a manifest edit + rebuild (see Setup above).
- Exact Tolgee REST endpoint paths/response shapes used in
  `src/lib/tolgeeClient.ts` should be re-checked against your Tolgee
  instance's OpenAPI spec (`{apiUrl}/v2/api-docs`) if requests fail — they
  were implemented from Tolgee's public API docs without a live instance to
  test against.
