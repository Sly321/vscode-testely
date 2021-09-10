
import { join, parse, resolve, sep } from 'path';
import * as vscode from 'vscode';
import { configuration, TestLocation } from '../configuration';
import { GeneratorError } from '../generators/Generator';
import { getGeneratorByLanguageId } from "../generators/getGeneratorByLanguageId";
import { getRootWorkspaceFolder, isTestFile, removeTestFromFileName } from '../helpers/fs-ultra';

export async function createTestCommand(document: vscode.TextDocument) {
	if (document.isUntitled) {
		vscode.window.showErrorMessage("Can't create a test from an untitled file.");
		return;
	}

	if (document.uri.scheme !== "file") {
		vscode.window.showErrorMessage(`File scheme ${document.uri.scheme} is not supported.`);
		return;
	}

	if (isTestFile(document.uri.fsPath)) {
		return await openSourceFile(document);
	}

	const generator = getGeneratorByLanguageId(document);

	try {
		const filePath = await generator.generate();
		
		await showDocument(filePath);
	} catch(e) {
		if (e instanceof GeneratorError) {
			vscode.window.showErrorMessage(e.message);
		}
	}

}

async function openSourceFile(testDocument: vscode.TextDocument) {
	switch (configuration.getTestLocation()) {
			case TestLocation.SameDirectoryNested:
				const { base, dir } = parse(removeTestFromFileName(testDocument.uri.fsPath));
				const sourceFileLocation = resolve(dir, "..", base);
				return await showDocument(sourceFileLocation);
			case TestLocation.SameDirectory:
				return await showDocument(removeTestFromFileName(testDocument.uri.fsPath));
			case TestLocation.RootTestFolder:
				const rootSourceFolder = getRootWorkspaceFolder(testDocument.uri);
				const fileName = removeTestFromFileName(testDocument.uri.fsPath.replace(rootSourceFolder, "").split(sep).slice(2).join(sep));
				const sourceFile = join(rootSourceFolder, "src", fileName);
				return await showDocument(sourceFile);
			default:
				throw new Error(`Unknown testely.testLocation config value: ${configuration.getTestLocation()}.`);
		}
}

async function showDocument(filePath: string) {
	const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
	await vscode.window.showTextDocument(doc, 1, false);
}