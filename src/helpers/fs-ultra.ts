import { existsSync } from "fs";
import { mkdir, readdir, stat } from "fs/promises";
import { join, parse, sep } from "path";
import * as vscode from "vscode";

export async function isFolder(path: string) {
	const res = await stat(path);
	return res.isDirectory();
}

export function addTestToFileName(fileName: string) {
	const dotIndex = fileName.lastIndexOf(".");
	return fileName.substring(0, dotIndex) + ".test" + fileName.substring(dotIndex);
}

export function removeTestFromFileName(fileName: string) {
	return fileName.replace(".test", "");
}

export function isTestFile(fileName: string) {
	const { name } = parse(fileName);
	return name.endsWith(".test");
}

export function cutExtension(fileName: string) {
	const dotIndex = fileName.lastIndexOf(".");
	return fileName.substring(0, dotIndex);
}

export async function assureDir(path: string) {
	if (existsSync(path)) {
		if (!isFolder(path)) {
			throw new Error(`Path is not a folder. Stop messing around. (${path})`);
		}
	} else {
		await mkdir(path);
	}
}

export async function getNearest(fileName: string, from: string): Promise<string | null> {
	const res = await stat(from);

	if (res.isDirectory()) {
		const dir = await readdir(from);

		if (dir.includes(fileName)) {
			return join(from, fileName);
		}
	}

	if (from.split(sep).length === 2) {
		return null;
	}

	const index = from.lastIndexOf(sep);

	if (!index) {
		return null;
	}

	const lower = from.slice(0, index);
	return getNearest(fileName, lower);
}

export function getRootWorkspaceFolder(uri: vscode.Uri) {
	const root = vscode.workspace.getWorkspaceFolder(uri);
	
	if (!root) {
		throw new Error("Wasn't able to find a workspace to your file. What the actual F.");
	}

	return root.uri.fsPath;
}

export function getRootSourceFolder(uri: vscode.Uri) {
	const root = vscode.workspace.getWorkspaceFolder(uri);
	
	if (!root) {
		throw new Error("Wasn't able to find a workspace to your file. What the actual F.");
	}
	
	return join(root?.uri.fsPath, "src");
}