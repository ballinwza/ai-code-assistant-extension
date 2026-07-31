// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import axios from 'axios';
import { SidebarProvider } from './SidebarProvider.js';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			SidebarProvider.viewType,
			sidebarProvider
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('code-assistant.openSidebar', () => {
			vscode.commands.executeCommand('workbench.view.extension.code-assistant-view-container');
		})
	);

	vscode.commands.registerCommand('code-assistant.sendToChat', () => {
		const editor = vscode.window.activeTextEditor;
			if (editor) {
				const selectedText = editor.document.getText(editor.selection);
				// สั่งเปิด Sidebar และโฟกัสไปที่แชตพร้อมแนบโค้ด
				vscode.commands.executeCommand('code-assistant-sidebar.focus');
				sidebarProvider.sendCodeToChat(selectedText, editor.document.fileName);
			}
	});
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-assistant" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
