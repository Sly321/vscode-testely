import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { basename, join, parse, relative, sep } from "path";
import { TextDocument } from "vscode";
import { cutExtension, getNearest } from "../../helpers/fs-ultra";
import { FrontendProjectMeta } from "../../helpers/ProjectMeta";
import { FileWriter, Generator, GeneratorError } from "../Generator";

export class TypeScriptGenerator extends Generator<FrontendProjectMeta> {
	async getProjectMeta(): Promise<FrontendProjectMeta> {
		const { uri: { fsPath } } = this.document;
		const pkgPath = await getNearest("package.json", fsPath);

		if (pkgPath === null) {
			return {
				"@testing-library/react": false,
				react: false,
				jest: false,
				mocha: false
			};
		}

		try {
			const pkg = JSON.parse(await readFile(pkgPath, "utf8"));

			const dependencies = {
				...pkg["devDependencies"],
				...pkg["dependencies"]
			};

			return {
				"@testing-library/react": !!dependencies["@testing-library/react"],
				react: !!dependencies["react"],
				jest: !!dependencies["jest"],
				mocha: !!dependencies["mocha"]
			};
		} catch (e) {
			console.error(e);
			throw new GeneratorError(`Error while reading ${pkgPath}.\n\n${e}.`);
		}
	}

	getFileWriter(filePath: string) {
		return new TypeScriptFileWriter(filePath, this.document);
	}
}

export type TypeScriptImport = {
	from: string;
	default?: string;
	named?: string | Array<string>;
};

export class TypeScriptFileWriter extends FileWriter<FrontendProjectMeta> {
	protected exampleTestContent: Array<string> = [];
	private imports: Array<TypeScriptImport> = [];
	private importPath: string
	protected testWrapper = (testContent: string) => `${testContent}`;
	protected componentName = "";

	constructor(testFilePath: string, source: TextDocument) {
		super(testFilePath);


		const { dir: sourceFileDir, name: sourceFileName } = parse(source.uri.fsPath)
		const { dir: testFileDir } = parse(testFilePath)

		this.componentName = sourceFileName
		this.importPath = join(relative(testFileDir, sourceFileDir), this.componentName).split(sep).join("/")

		this.addImport({ named: this.componentName, from: `${this.importPath}` });
	}

	useProjectMeta(projectMeta: FrontendProjectMeta): void {
		if (projectMeta.jest) {
			this.exampleTestContent.push(`\t\texpect(${this.componentName}()).toEqual(null)`);
		}

		if (projectMeta.jest) {
			this.testWrapper = (testContent: string) => {
				return `describe("${this.componentName}", () => {\n` +
					`\tit(\`should ...\`, () => {\n` +
					`${testContent}\n` +
					`\t})\n` +
					`})`;
			};
		}
	}

	addImport(...imp: Array<TypeScriptImport>): void {
		this.imports.push(...imp);
	}

	static printImport(imp: TypeScriptImport): string {
		let result = "";

		if (imp.default) {
			result += `${imp.default}`;
		}

		if (imp.named) {
			let namedImports = "";

			if (Array.isArray(imp.named)) {
				if (imp.named.length > 0) {
					namedImports = `{ ${imp.named.join(", ")} }`;
				}
			} else if (imp.named !== "") {
				namedImports += `{ ${imp.named} }`;
			}

			if (namedImports !== "") {
				result += `${result !== "" ? ", " : ""}${namedImports}`;
			}
		}

		result += `${result !== "" ? " from " : ""}"${imp.from}"`;

		return `import ${result}`;
	}

	generateContent() {
		const imports = this.imports.map(TypeScriptFileWriter.printImport).join("\n");
		return `${imports !== "" ? `${imports}\n\n` : ""}` +
			`${this.testWrapper(this.exampleTestContent.join("\n"))}`;
	}
}