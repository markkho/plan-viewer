const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class PlanEditorProvider {
  constructor(context) {
    this.context = context;
  }

  resolveCustomTextEditor(document, webviewPanel, _token) {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // Load webview HTML
    const htmlPath = path.join(this.context.extensionPath, 'media', 'webview.html');
    webviewPanel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

    // Send document content to webview
    function sendData() {
      const text = document.getText();
      if (!text.trim()) return;
      try {
        const data = JSON.parse(text);
        webviewPanel.webview.postMessage({ type: 'load', data });
      } catch (e) {
        // Ignore parse errors (e.g. during mid-edit)
      }
    }

    // Initial load — wait for webview to be ready
    // Small delay to ensure webview scripts are initialized
    setTimeout(() => sendData(), 100);

    // Watch for in-buffer changes (e.g. other extensions, undo)
    const changeDocSub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString() && e.contentChanges.length > 0) {
        sendData();
      }
    });

    // Watch for on-disk changes (e.g. git, external editors, scripts)
    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(document.uri, '*')
    );
    const onDiskChange = () => sendData();
    fileWatcher.onDidChange(onDiskChange);
    fileWatcher.onDidCreate(onDiskChange);

    // Handle messages from webview
    const msgSub = webviewPanel.webview.onDidReceiveMessage(async msg => {
      if (msg.type === 'revert') {
        sendData();
        return;
      }
      if (msg.type === 'save') {
        try {
          const json = JSON.stringify(msg.data, null, 2) + '\n';
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, fullRange, json);
          await vscode.workspace.applyEdit(edit);
          await document.save();
          webviewPanel.webview.postMessage({ type: 'saved' });
        } catch (e) {
          vscode.window.showErrorMessage('Failed to save: ' + e.message);
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocSub.dispose();
      fileWatcher.dispose();
      msgSub.dispose();
    });
  }
}

function activate(context) {
  const provider = new PlanEditorProvider(context);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('planViewer.editor', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // Create a new plan file
  context.subscriptions.push(
    vscode.commands.registerCommand('planViewer.create', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Plan file name',
        value: 'PLAN.json',
        validateInput: v => {
          if (!v) return 'Name is required';
          if (!v.endsWith('.plan.json') && v !== 'PLAN.json')
            return 'Must be PLAN.json or *.plan.json';
          return null;
        },
      });
      if (!name) return;

      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('Open a folder first.');
        return;
      }

      const folder = folders.length === 1
        ? folders[0]
        : await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Select workspace folder' });
      if (!folder) return;

      const uri = vscode.Uri.joinPath(folder.uri, name);
      try {
        await vscode.workspace.fs.stat(uri);
        // File exists — just open it
        await vscode.commands.executeCommand('vscode.openWith', uri, 'planViewer.editor');
        return;
      } catch {
        // File doesn't exist — create it
      }

      const template = {
        $schema: 'https://raw.githubusercontent.com/markkho/plan-viewer/main/schema.json',
        title: name.replace(/\.plan\.json$|\.json$/, ''),
        children: [],
      };
      const content = Buffer.from(JSON.stringify(template, null, 2) + '\n', 'utf-8');
      await vscode.workspace.fs.writeFile(uri, content);
      await vscode.commands.executeCommand('vscode.openWith', uri, 'planViewer.editor');
    })
  );

  // Convenience command: find a plan file and open it with the custom editor
  context.subscriptions.push(
    vscode.commands.registerCommand('planViewer.open', async () => {
      let files = await vscode.workspace.findFiles(
        '**/{PLAN.json,*.plan.json}',
        '**/node_modules/**',
        10
      );

      if (files.length === 0) {
        const picked = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { 'Plan JSON': ['json'] },
          title: 'Select a plan file',
          openLabel: 'Open Plan',
        });
        if (!picked || picked.length === 0) return;
        files = picked;
      }

      let uri;
      if (files.length === 1) {
        uri = files[0];
      } else {
        const pick = await vscode.window.showQuickPick(
          files.map(f => ({
            label: vscode.workspace.asRelativePath(f),
            uri: f,
          })),
          { placeHolder: 'Select plan file' }
        );
        if (!pick) return;
        uri = pick.uri;
      }

      await vscode.commands.executeCommand('vscode.openWith', uri, 'planViewer.editor');
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
