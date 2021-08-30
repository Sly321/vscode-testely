import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import * as vscode from 'vscode';
import { addTestToFileName, isFolder } from '../helpers/fs-ultra';
import { ProjectMeta } from '../helpers/ProjectMeta';

export class GeneratorError extends Error {}

export abstract class Generator<T extends ProjectMeta> {
	constructor(protected document: vscode.TextDocument) {
	}

	abstract getFileWriter(filePath: string): FileWriter<T>;
	abstract getProjectMeta(): Promise<T>;

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

	async generate(): Promise<string> {
		const { filePath } = await this.createPaths();

		if (existsSync(filePath)) {
			return filePath;
		}

		const writer = this.getFileWriter(filePath);
		writer.useProjectMeta(await this.getProjectMeta());

		await writer.write();

		return filePath;
	}
}

export abstract class FileWriter<T extends ProjectMeta> {
	constructor(private filePath: string) {	}

	abstract generateContent(): string;
	abstract useProjectMeta(meta: T): void;

	async write(): Promise<void> {
		return await writeFile(this.filePath, this.generateContent(), { encoding: "utf8" });
	}
}