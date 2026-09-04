# Tolgeetron

Figma plugin that links [Tolgee](https://tolgee.io) keys to canvas nodes as native **Dev Mode annotations** — a pink “Localization” pin with the key name — so developers can inspect the mapping in Figma instead of chasing it through layer names or Slack.

## How it works

- **Annotation** — pink `"Localization"` category on supported nodes (components, frames, instances, text, shapes). Not groups or sections.
- **Variables (text only)** — also creates a string variable in a `"Localization"` collection (`namespace/keyName`), bound to `characters`.
- **Plugin data** — stores `{ keyId, keyName, namespace, projectId, variableId? }` on the node so links survive key renames.
- **Settings** — API URL + project ID live on the document (shared). The project API key (`tgpak_…`) stays in `figma.clientStorage` per user and is never written into the file.

## Setup

```bash
npm install
npm run build      # → dist/
npm run watch      # rebuild on change
npm run typecheck
```

In Figma Desktop: **Plugins → Development → Import plugin from manifest…** → select `manifest.json`. Use `watch` and reopen the plugin after changes.

1. Open **Settings**.
2. Set API URL (default `https://app.tolgee.io`), **project ID**, and **project API key**.
3. Self-hosted? Add the domain to `manifest.json` → `networkAccess.allowedDomains` and rebuild.

## Usage

1. Select a supported node.
2. **Annotate** — link an existing key, or create one (name + optional namespace + base translation).
3. Pink pin appears in Dev Mode; text layers also get a bound Localization variable.
4. **Keys in file** — jump to node, open in Tolgee, or unlink (clears annotation, plugin data, and variable).
