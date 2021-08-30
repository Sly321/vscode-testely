import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { Generator } from "../Generator";

export class TypeScriptReactGenerator extends Generator {

	async generate(): Promise<string> {
		const { filePath } = await this.createPaths();

		if (existsSync(filePath)) {
			return filePath;
		}

		await writeFile(filePath, "", { encoding: "utf8" });

		return filePath;
	}
}