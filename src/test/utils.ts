import { existsSync, readdirSync, rmSync, stat, statSync } from "fs";
import { join, resolve } from "path";
import { Uri, window, workspace } from "vscode";

export const TEMPORARY_TEST_DIRECTORY = resolve(__dirname, "..", "..", "test-resources", "workspace");

export function cleanTestWorkspace() {
	if (existsSync(TEMPORARY_TEST_DIRECTORY)) {
		const filesOrDirectories = readdirSync(TEMPORARY_TEST_DIRECTORY)
		filesOrDirectories.forEach(fileOrDirectory => {
			if(fileOrDirectory !== ".gitkeep") {
				rmSync(join(TEMPORARY_TEST_DIRECTORY, fileOrDirectory), { recursive: true });
			}
		})
	}
}

export async function openFile(name: string) {
  const doc = await workspace.openTextDocument(Uri.file(join(workspace.workspaceFolders![0]!.uri.fsPath, name)))
  await window.showTextDocument(doc)
}

type RecursiveStringArray = string | Array<string>;
export function createTree(root: string) {
	const result: Array<RecursiveStringArray> = []
	const filesOrDirectories = readdirSync(root)
	filesOrDirectories.forEach(fileOrDirectory => {
		if(fileOrDirectory !== ".gitkeep") {
			const fileOrDirectoryPath = join(root, fileOrDirectory);
			const stat = statSync(fileOrDirectoryPath)
			result.push(fileOrDirectory)
			if (stat.isDirectory()) {
				result.push(createTree(fileOrDirectoryPath) as any)
			}
		}
	})
	return result
}

export function consoleLogTree(tree: Array<string | Array<string>>, prefix: string = "") {
	const log: Array<string> = []
	tree.forEach((el) => {
		if (Array.isArray(el)) {
			log.push(consoleLogTree(el, `${prefix}  `))
		} else {
			log.push(`${prefix} ${el}`)
		}
	})
	return log.join("\n")
}