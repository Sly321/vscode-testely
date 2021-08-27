// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createTestCommand } from './commands/createTest';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log("yes active");
	
	vscode.commands.executeCommand('setContext', 'testely.supportedLangIds', [
		'typescript',
		'typescriptreact',
	]);
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "testely" is now active!');

	let disposable = vscode.commands.registerCommand("testely.createTest", (args, thisArg) => {
		if (args) {
			vscode.workspace.openTextDocument(args).then(document => {
				return createTestCommand(document);
			});
		} else {
			const { document }= vscode.window.activeTextEditor || {};

			if (!document) {
				return vscode.window.showErrorMessage("Could not manage to find file for test creation.");
			}

			return createTestCommand(document);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
