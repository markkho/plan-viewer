# Plan Viewer — VS Code Extension

## What This Is

VS Code extension that renders `PLAN.json` and `*.plan.json` files as interactive plan trackers. It registers as a `CustomTextEditorProvider`, so plan files open in the viewer by default instead of as raw JSON.

## Architecture

Three files, no build step, no dependencies beyond CDN links:

- **`extension.js`** — `PlanEditorProvider` implements `CustomTextEditorProvider`. Reads the document via VS Code's `TextDocument` API, sends JSON to the webview, and writes back via `WorkspaceEdit` + `document.save()`. Also registers a convenience `planViewer.open` command.
- **`package.json`** — declares `customEditors` contribution for `*.plan.json` and `PLAN.json` with `priority: "default"`.
- **`media/webview.html`** — single-file SPA (~800 lines). All HTML, CSS, and JS in one file. Loads CDN libraries: highlight.js, CodeMirror 5 (with vim keymap), KaTeX, marked.js.

## Key Design Decisions

- **Single HTML file**: Everything is in `webview.html` — no bundler, no framework. This is intentional for simplicity.
- **CDN-loaded libraries**: CodeMirror, KaTeX, marked, highlight.js are loaded from cdnjs.cloudflare.com. The CSP header in the HTML allows this explicitly.
- **Message protocol**: Extension ↔ webview communicate via `postMessage` with three message types: `load` (extension → webview, sends JSON data), `save` (webview → extension, sends modified JSON), `saved` (extension → webview, confirmation).
- **Status derivation**: Leaf nodes have explicit `status`. Branch nodes derive status from children (all complete → complete, any in progress → in progress, etc.). `deferred` nodes are excluded from progress counts.
- **Vim everywhere**: CodeMirror vim mode for multiline editing, custom vim-style `j/k/h/l/space/o/i/gg/G` navigation for the tree, `jk` mapped to Escape in both contexts.

## File Format (PLAN.json)

Full JSON Schema: https://raw.githubusercontent.com/markkho/plan-viewer/main/schema.json

Add `"$schema": "https://raw.githubusercontent.com/markkho/plan-viewer/main/schema.json"` to plan files for editor validation.

```json
{
  "title": "string",
  "subtitle": "string",
  "children": [
    {
      "name": "string (required)",
      "status": "pending | in_progress | complete | deferred (leaf only, omit for notes)",
      "description": "string | string[] (markdown)",
      "details": "string | string[] (markdown, expandable)",
      "note": "string (shown in header)",
      "icon": "string (emoji, defaults based on node type/status)",
      "deadline": "YYYY-MM-DD (optional, shown as 'due Mon DD')",
      "created": "ISO timestamp (auto-set)",
      "modified": "ISO timestamp (auto-updated)",
      "children": "array (makes it a branch node)"
    }
  ]
}
```

String arrays are joined with newlines for rendering. Markdown, LaTeX (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`), and fenced code blocks are all supported in `description` and `details`. Nodes without `status` are plain notes; nodes with `status` are todos. Deadlines show as colored labels (gray = normal, yellow = due within 3 days, red = overdue).

## Editing the Extension

- Edit files directly in `~/.vscode/extensions/plan-viewer/`
- Reload VS Code window (`Cmd+Shift+P` → "Developer: Reload Window") to pick up changes
- The webview HTML is read fresh each time a plan file is opened, so HTML changes take effect on next file open (no reload needed for already-open tabs — close and reopen the file)
- `extension.js` changes require a window reload

## CSS Theming

The webview detects VS Code's theme via `body.vscode-dark` / `body.vscode-light` classes and sets CSS variables (`--bg`, `--fg`, `--card`, `--border`, etc.). All colors reference these variables.

## Sticky Headers

Node headers use `position: sticky` with depth-based `top` offsets (0px, 37px, 74px, 111px, 148px) so parent context stays visible when scrolling deep into nested content. This requires that `.node` does NOT have `overflow: hidden`.

## Common Modifications

- **Add a new status**: Update `STATUS_ORDER`, `STATUS_LABELS`, `STATUS_COLORS` in the `<script>` section, and add a `.badge.newstatus` CSS rule.
- **Change sticky header depth limit**: Add/remove `.depth-N > .node-header` CSS rules. Each level adds 37px to `top`.
- **Add a new node field**: Render it in `renderNode()`, handle editing in `startEdit()` if editable.
- **Change file matching**: Edit the `selector` array in `package.json` `customEditors`.
