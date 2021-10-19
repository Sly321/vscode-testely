import { readFile } from "fs";
import { getNearest, findPackageJson } from "../../helpers/fs-ultra";
import { ProjectMeta } from "../ProjectMeta";

export class TypescriptProjectMeta extends ProjectMeta {
	/**
	 * @param targetFilePath the `path` of a file in a project.
	 */
	constructor(targetFilePath: string) {
		super()

		const pkgPath = findPackageJson(targetFilePath)

		if (pkgPath === null) {
			return {
				"@testing-library/react": false,
				react: false,
				jest: false,
				mocha: false,
				i18next: false,
			}
		}

		try {
			const pkg = JSON.parse(await readFile(pkgPath, "utf8"))

			const dependencies = {
				...pkg["devDependencies"],
				...pkg["dependencies"],
			}

			return {
				"@testing-library/react": !!dependencies["@testing-library/react"],
				react: !!dependencies["react"] || !!dependencies["react-scripts"],
				jest: !!dependencies["jest"] || !!dependencies["react-scripts"],
				mocha: !!dependencies["mocha"],
				i18next: !!dependencies["i18next"],
			}
		} catch (e) {
			console.error(e)
			throw new GeneratorError(`Error while reading ${pkgPath}.\n\n${e}.`)
		}
	}
}