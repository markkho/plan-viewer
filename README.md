# Plan Viewer

A VS Code extension that renders `PLAN.json` and `*.plan.json` files as interactive plan trackers instead of raw JSON.

## Features

- **Native editor tab** — plan files open directly in the viewer (right-click → "Open With" → "Text Editor" for raw JSON)
- **Hierarchical tree** with collapsible sections and sticky scroll headers
- **Status tracking** — click badges to cycle leaf nodes through pending → in progress → complete
- **Inline editing** — double-click any text to edit; multiline fields use CodeMirror with vim keybindings
- **Markdown rendering** with LaTeX math (KaTeX) and syntax-highlighted code blocks
- **Vim navigation** — `j`/`k` to move, `h`/`l` to collapse/expand, `space` to cycle status, `i` to edit
- **Progress overview** — summary cards with progress bars for top-level phases
- **Next step indicator** — highlights the current in-progress or next pending task
- **Dark/light theme** — follows VS Code's theme automatically

## File Format

A plan file is a JSON object with this structure:

```json
{
  "title": "Plan Title",
  "motivation": ["Optional array of", "markdown paragraphs"],
  "children": [
    {
      "name": "Phase 1",
      "short": "Short label for overview card",
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
| `status` | string | leaf only | `"pending"`, `"in_progress"`, `"complete"`, or `"deferred"` |
| `short` | string | no | Short label for overview cards (falls back to `name`) |
| `description` | string or string[] | no | Markdown content shown when node is expanded |
| `details` | string or string[] | no | Expandable details (toggle with `o` or click) |
| `note` | string | no | Short italic note shown in the header row |
| `children` | array | no | Sub-nodes (presence makes this a branch node) |

**Status rules:**
- Leaf nodes (no children) have an explicit `status`
- Branch nodes derive status from children: all complete → complete, any in progress/complete → in progress, otherwise pending
- `"deferred"` nodes are excluded from progress counts

## Installation

This extension lives at `~/.vscode/extensions/plan-viewer/` and loads automatically in every VS Code window.

## Usage

- Open any `PLAN.json` or `*.plan.json` file — it opens in the plan viewer
- Use `Cmd+Shift+P` → "Plan: Open Tracker" to search for plan files in the workspace
- Press `?` to toggle the vim keybinding cheat sheet
- Use the gear icon (top-right) to adjust font size and toggle vim hints
