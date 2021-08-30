import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, join } from 'path';
import * as vscode from 'vscode';
import { addTestToFileName, isFolder } from '../helpers/fs-ultra';

export class GeneratorError extends Error {}

export abstract class Generator {
	constructor(protected document: vscode.TextDocument) {
	}

	abstract generate(): Promise<string>;

	protected getPkg(): any {
		return {};
	}

	protected async createPaths(): Promise<{ filePath: string }> {
		const { uri: { fsPath } } = this.document;
		const fileName = basename(fsPath);
		const folder = fsPath.replace(fileName, "");
		const testFolder = join(folder, "__test__");
		const testFile = join(testFolder, addTestToFileName(fileName));

		if (existsSync(testFolder)) { 
			if (!isFolder(testFolder)) {
				throw new GeneratorError(`Test location is not a folder.\n\n${testFolder}`); // todo err: __test__ is not a folder
			}
		} else {
			await mkdir(testFolder);
		}

		return { filePath: testFile };
	}
}