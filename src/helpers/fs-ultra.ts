import { stat } from "fs/promises";

export async function isFolder(path: string) {
	const res = await stat(path);
	return res.isDirectory();
}

export function addTestToFileName(fileName: string) {
    var dotIndex = fileName.lastIndexOf(".");
    return fileName.substring(0, dotIndex) + ".test" + fileName.substring(dotIndex);
}