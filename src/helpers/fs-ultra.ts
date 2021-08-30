import { readdir, stat } from "fs/promises";
import { join, sep } from "path";

export async function isFolder(path: string) {
	const res = await stat(path);
	return res.isDirectory();
}

export function addTestToFileName(fileName: string) {
    const dotIndex = fileName.lastIndexOf(".");
    return fileName.substring(0, dotIndex) + ".test" + fileName.substring(dotIndex);
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