# Plan Viewer

A VS Code extension that renders `PLAN.json` and `*.plan.json` files as interactive plan trackers instead of raw JSON.

## Features

- **Native editor tab** — plan files open directly in the viewer (right-click → "Open With" → "Text Editor" for raw JSON)
- **Hierarchical tree** with collapsible sections, sticky scroll headers, and hierarchical numbering
- **Status tracking** — click badges to cycle leaf nodes through note → pending → in progress → complete
- **Inline editing** — double-click any text to edit; multiline fields use CodeMirror with vim keybindings
- **Markdown rendering** with LaTeX math (KaTeX) and syntax-highlighted code blocks
- **Vim navigation** — `j`/`k` to move, `h`/`l` to collapse/expand, `space` to cycle status, `i` to edit
- **Drag-and-drop** reordering of nodes
- **Auto-save** with Ctrl+Z / Cmd+Z undo support
- **Icons** — default emoji icons based on node type/status, customizable via double-click emoji picker
- **Deadlines** — due dates with color-coded labels (gray, yellow within 3 days, red overdue)
- **Dark/light theme** — follows VS Code's theme automatically

## File Format

Full JSON Schema: https://raw.githubusercontent.com/markkho/plan-viewer/main/schema.json

Add a `$schema` reference for editor validation and agent discoverability:

```json
{
  "$schema": "https://raw.githubusercontent.com/markkho/plan-viewer/main/schema.json",
  "title": "Plan Title",
  "subtitle": "Optional subtitle",
  "children": [
    {
      "name": "Phase 1",
      "description": "Markdown description shown when expanded",
      "children": [
        {
          "name": "Leaf task",
          "status": "pending",
          "note": "Optional short note shown in header",
          "details": ["Optional expandable details", "as markdown array"]
        }
      ]
    }
  ]
}
```

### Node fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Node title |
| `status` | string | leaf only | `"pending"`, `"in_progress"`, `"complete"`, or `"deferred"`. Omit for plain notes. |
| `description` | string or string[] | no | Markdown content shown when node is expanded |
| `details` | string or string[] | no | Expandable details (toggle with `o` or click) |
| `note` | string | no | Short note shown in the header row |
| `icon` | string | no | Emoji displayed before the name. Defaults based on node type/status. |
| `deadline` | string | no | Due date in `YYYY-MM-DD` format. Shown as a colored label. |
| `created` | string | no | ISO 8601 timestamp, auto-set when created via the UI |
| `modified` | string | no | ISO 8601 timestamp, auto-updated on edits |
| `children` | array | no | Sub-nodes (presence makes this a branch node) |

**Status rules:**
- Leaf nodes (no children) have an explicit `status`, or omit it to be a plain note
- Branch nodes derive status from children: all complete → complete, any in progress/complete → in progress, otherwise pending
- `"deferred"` nodes are excluded from progress counts

## Installation

This extension lives at `~/.vscode/extensions/plan-viewer/` and loads automatically in every VS Code window.

## Usage

- Open any `PLAN.json` or `*.plan.json` file — it opens in the plan viewer
- Use `Cmd+Shift+P` → "Plan: Open Tracker" to search for plan files in the workspace
- Press `?` to toggle the vim keybinding cheat sheet
- Use the gear icon (top-right) to adjust font size and toggle vim hints
