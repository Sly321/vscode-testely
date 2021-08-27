import * as vscode from 'vscode';

export abstract class Generator {
	constructor(protected document: vscode.TextDocument) {
	}

	abstract generate(): Promise<string>;

	protected getPkg(): any {
		return {};
	}
}