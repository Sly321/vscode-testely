import { existsSync, mkdirSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { basename, join, parse, relative, sep } from 'path';
import * as vscode from 'vscode';
import { configuration, TestLocation } from '../configuration';
import { addTestToFileName, isFolder, assureDir } from '../helpers/fs-ultra';
import { ProjectMeta } from '../helpers/ProjectMeta';

export class GeneratorError extends Error { }

export abstract class Generator<T extends ProjectMeta> {
	protected configuration = configuration

	constructor(protected document: vscode.TextDocument) {
	}

	abstract getFileWriter(filePath: string): FileWriter<T>;
	abstract getProjectMeta(): Promise<T>;

	protected async createPaths(): Promise<{ filePath: string }> {
		switch (this.configuration.getTestLocation()) {
			case TestLocation.SameDirectoryNested:
				return this.createSameDirectoryNestedPath();
			case TestLocation.SameDirectory:
				return this.createSameDirectoryPath();
			case TestLocation.RootTestFolder:
				return this.createRootTestFolderPath();
			default:
				throw new Error(`Unknown testely.testLocation config value: ${this.configuration.getTestLocation()}.`)
		}
	}

	private async createSameDirectoryNestedPath() {
		const { dir: folder, base: fileName } = parse(this.document.uri.fsPath);
		const testFolder = join(folder, "__test__");
		const testFile = join(testFolder, addTestToFileName(fileName));

		await assureDir(testFolder)

		return { filePath: testFile }
	}

	private async createSameDirectoryPath() {
		const { dir: folder, base: fileName } = parse(this.document.uri.fsPath);
		const testFile = join(folder, addTestToFileName(fileName));

		await assureDir(folder)

		return { filePath: testFile }
	}

	private async createRootTestFolderPath() {
		const { uri } = this.document;
		const root = vscode.workspace.getWorkspaceFolder(uri)

		if (!root) {
			throw new GeneratorError("Wasn't able to find a workspace to your file. What the actual F.")
		}

		const testFolder = join(root.uri.fsPath, "test")
		const fileName = addTestToFileName(uri.fsPath.replace(root.uri.fsPath, "").split(sep).slice(2).join(sep))
		const testFile = join(testFolder, fileName);

		mkdirSync(testFile.substring(0, testFile.lastIndexOf(sep)), { recursive: true })

		return { filePath: testFile }
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
	constructor(private filePath: string) { }

	abstract generateContent(): string;
	abstract useProjectMeta(meta: T): void;

	async write(): Promise<void> {
		return await writeFile(this.filePath, this.generateContent(), { encoding: "utf8" });
	}
}