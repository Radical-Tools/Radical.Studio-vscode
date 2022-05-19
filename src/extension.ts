import * as vscode from "vscode";
import { RadicalEditorProvider } from "./RadicalEditorProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(RadicalEditorProvider.register(context));
}
