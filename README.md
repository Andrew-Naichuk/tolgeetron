# Tolgeetron

[![Figma Community](https://img.shields.io/badge/Figma-Community_Plugin-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/community/plugin/1677630397288495696)

Figma plugin that links [Tolgee](https://tolgee.io) keys to canvas nodes as native **Figma annotations** — a separate “Localization” pin category with the key name so developers can inspect the mapping in Figma instead of chasing it through layer names or Slack. Additionally, the plugin connects all the values to variables with the proper Tolgee key, so copying keys is easy in dev mode.

## How it works

- **Annotation** — pink `"Localization"` category on supported nodes: components, component sets, frames, instances, text, and shapes (`ELLIPSE`, `LINE`, `POLYGON`, `RECTANGLE`, `STAR`, `VECTOR`). Not groups or sections.
- **Variables (text only)** — also creates a string variable in a `"Localization"` collection, named `namespace/keyName` (or just `keyName`), bound to `characters`.
- **Plugin data** — stores `{ keyId, keyName, namespace, projectId, variableId? }` on the node so links survive key renames and remain the source of truth (the visible annotation label is just the key name).
- **Language preview** — on the **Keys** tab, pick a project language to push translations into those Localization variables so text layers update in the file.
- **Settings** — API URL + project ID live on the document (shared with anyone who opens the file). The project API key (`tgpak_…`) stays in `figma.clientStorage` per user and is never written into the file.

UI labels use `namespace:keyName`; Figma variables use `namespace/keyName`.

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
3. Self-hosted? Add the domain to `manifest.json` → `networkAccess.allowedDomains`, rebuild, and re-import the plugin.

Annotations are visible in design and dev mode. The plugin scans all pages when listing linked keys (`documentAccess: "dynamic-page"`).


## Usage

### Annotate

1. Select a supported node.
2. Link an existing Tolgee key (search), or create one (name + optional namespace + base translation).
3. For text layers, the base translation and a slugified key name are prefilled from the layer text.
4. Pink pin appears in Dev Mode; text layers also get a bound Localization variable.

New keys are created with base language **`en`** (hardcoded today).

### Keys in file

1. Browse every linked node across pages.
2. Jump to the node, open the key in Tolgee, or unlink (clears annotation, plugin data, and variable).
3. Choose an **applied language** to preview translations on linked text layers via Localization variables. The choice is stored on the document.

### Settings

Save connection details, or **Unlink Tolgee** to clear the local API key. Project wiring (URL / project ID) remains on the document until you change it.

## Architecture

| Layer | Role |
|-------|------|
| `src/main.ts` | Figma sandbox — annotations, variables, `pluginData`, selection, document settings |
| `src/ui.tsx` + `src/ui/` | React UI — Tolgee HTTP (`fetch`), Annotate / Keys / Settings tabs |
| `src/lib/tolgeeClient.ts` | Tolgee v2 API (search, create keys, languages, translations) |
| `src/lib/messaging.ts` | Typed `postMessage` bridge between UI and main |

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
