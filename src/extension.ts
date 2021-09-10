import * as vscode from 'vscode';
import { createTestCommand } from './commands/createTest';

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.executeCommand('setContext', 'testely.supportedLangIds', [
		'typescript',
		'typescriptreact',
	]);

	let disposable = vscode.commands.registerCommand("testely.createTest", (args, thisArg) => {
		if (args) {
			vscode.workspace.openTextDocument(args).then(document => {
				return createTestCommand(document);
			});
		} else {
			const { document } = vscode.window.activeTextEditor || {};

			if (!document) {
				return vscode.window.showErrorMessage("Could not manage to find file for test creation.");
			}

			return createTestCommand(document);
		}
	});

	let disposable2 = vscode.commands.registerCommand("testely.openSourceFile", (args, thisArg) => {
		if (args) {
			vscode.workspace.openTextDocument(args).then(document => {
				return createTestCommand(document);
			});
		} else {
			const { document } = vscode.window.activeTextEditor || {};

			if (!document) {
				return vscode.window.showErrorMessage("Could not manage to find file for test creation.");
			}

			return createTestCommand(document);
		}
	});

	context.subscriptions.push(disposable, disposable2);
}

export function deactivate() { }
