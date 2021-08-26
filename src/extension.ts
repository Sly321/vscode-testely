// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


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

	let disposable = vscode.commands.registerTextEditorCommand("testely.createTest", (textEditor, edit) => {
		vscode.window.showInformationMessage('Hello World from testely!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
