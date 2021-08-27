import * as vscode from 'vscode';
import { TypeScriptReactGenerator } from "./implementations/TypeScriptReactGenerator";
import { Generator } from "./Generator";

export function getGeneratorByLanguageId(document: vscode.TextDocument): Generator {
	switch (document.languageId) {
		case "typescriptreact":
			return new TypeScriptReactGenerator(document);
		default:
			break;
	}
	return new TypeScriptReactGenerator(document);
}
