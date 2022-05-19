import * as vscode from "vscode";

export class RadicalEditorProvider implements vscode.CustomTextEditorProvider {
  private static newFileCounter = 1;
  private static readonly viewType = "radical-tools-studio.editor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand("radical-tools-studio.new", () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showErrorMessage("Creating a new Radical file requires opening a workspace");
        return;
      }

      const uri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        `new-${RadicalEditorProvider.newFileCounter++}.radical`
      ).with({ scheme: "untitled" });

      vscode.commands.executeCommand("vscode.openWith", uri, RadicalEditorProvider.viewType);
    });

    const provider = new RadicalEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(RadicalEditorProvider.viewType, provider);
    return providerRegistration;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateStudioData() {
      webviewPanel.webview.postMessage({
        type: "update-data",
        json: document.getText(),
      });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateStudioData();
      }
    });

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "change":
          this.updateTextDocument(document, e.json);
          return;

        default:
          return;
      }
    });

    updateStudioData();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "studio-dist", "main.js"));
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "studio-dist", "main.css"));

    return `
			<!DOCTYPE html>
			<html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>(function(){ window.isExtension = true; })()</script>
          <script defer="defer" src="${scriptUri}"></script>
          <link href="${stylesUri}" rel="stylesheet" />
          <title>Radical Studio</title>
        </head>
        
        <body>
          <div id="root"></div>
        </body>
			</html>`;
  }

  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(json, null, 2));
    return vscode.workspace.applyEdit(edit);
  }
}
