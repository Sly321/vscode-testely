import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { basename, join } from "path";
import { addTestToFileName, isFolder } from "../../helpers/fs-ultra";
import { Generator } from "../Generator";

export class TypeScriptReactGenerator extends Generator {

	async generate(): Promise<string> {
		const { uri: { fsPath } } = this.document;
		const fileName = basename(fsPath);
		const folder = fsPath.replace(fileName, "");
		const testFolder = join(folder, "__test__");
		const testFile = join(testFolder, addTestToFileName(fileName));

		if (existsSync(testFolder)) { 
			if (isFolder(testFolder)) {
			} else {
				return ""; // todo err: __test__ is not a folder
			}
		} else {
			await mkdir(testFolder);
		}

		if (existsSync(testFile)) {
			return ""; // todo err: testFile already exists
		}

		await writeFile(testFile, "", { encoding: "utf8" });

		return testFile;
	}
}