import { join, parse, relative, resolve, sep } from "path"
import { TextDocument } from "vscode"
import { TypeScriptSourceImport } from "../../../helpers/typescriptParser"
import { File } from "../../File"
import { FileWriter } from "../../Generator"

export type TypeScriptImport = {
    from: string
    default?: string
    named?: string | Array<string>
}

export abstract class TypeScriptFileWriter<T> extends FileWriter<T> {
    protected importPath: string

    private imports: Array<TypeScriptImport> = []
    private content: Array<string> = []

    constructor(file: File, private source: TextDocument) {
        super(file)
        const { dir: sourceFileDir, name: sourceFileName } = parse(source.uri.fsPath)
        this.importPath = join(relative(file.getDirectory(), sourceFileDir), sourceFileName).split(sep).join("/")
    }

    private getRelativeImportPath(path: string) {
        const { dir: sourceFileDir } = parse(this.source.uri.fsPath)
        const importFile = resolve(sourceFileDir, path)
        const { name: importFileName, dir: importFileDir } = parse(importFile)
        return join(relative(this.file.getDirectory(), importFileDir), importFileName).split(sep).join("/")
    }

	protected parseImport(imp: TypeScriptSourceImport): TypeScriptImport {
		if (imp.default) {
			return {
				from: this.getRelativeImportPath(imp.from),
				default: imp.name,
			}
		}

		if (imp.named) {
			return {
				from: this.getRelativeImportPath(imp.from),
				named: imp.name,
			}
		}

		throw new Error("import must either be named or default.")
	}

    protected addImport(...imp: Array<TypeScriptImport>): void {
        this.imports.push(...imp)
    }

    protected addContent(...content: Array<string>): void {
        this.content.push(...content)
    }

    protected generateContent() {
        const imports = this.imports.map(TypeScriptFileWriter.printImport).join("\n")
        return `${imports !== "" ? `${imports}\n\n` : ""}` + `${this.content.join("\n")}`
    }

    static printImport(imp: TypeScriptImport): string {
        let result = ""

        if (imp.default) {
            result += `${imp.default}`
        }

        if (imp.named) {
            let namedImports = ""

            if (Array.isArray(imp.named)) {
                if (imp.named.length > 0) {
                    namedImports = `{ ${imp.named.join(", ")} }`
                }
            } else if (imp.named !== "") {
                namedImports += `{ ${imp.named} }`
            }

            if (namedImports !== "") {
                result += `${result !== "" ? ", " : ""}${namedImports}`
            }
        }

        result += `${result !== "" ? " from " : ""}"${imp.from}"`

        return `import ${result}`
    }
}