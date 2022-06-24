import { readFile } from "fs/promises"
import { join, parse, relative, resolve, sep } from "path"
import * as vscode from "vscode"
import { getNearest } from "../../helpers/fs-ultra"
import { FrontendProjectMeta } from "../../helpers/ProjectMeta"
import { ParsedStatement, TypeScriptParser, TypeScriptSource } from "../../helpers/typescriptParser"
import { FileWriter, Generator, GeneratorError } from "../Generator"
import { File } from "../File"

export class TypeScriptGenerator extends Generator<FrontendProjectMeta> {
    async getProjectMeta(): Promise<FrontendProjectMeta> {
        const {
            uri: { fsPath },
        } = this.document
        const pkgPath = await getNearest("package.json", fsPath)

        if (pkgPath === null) {
            return {
                "@testing-library/react": false,
                "@testing-library/react-hooks": false,
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
                "@testing-library/react-hooks": !!dependencies["@testing-library/react-hooks"],
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

    override getFileWriter(file: File) {
        return new TypeScriptFileWriter(file, this.document)
    }
}

export type TypeScriptImport = {
    from: string
    default?: string
    named?: string | Array<string>
}

export class TypeScriptFileWriter extends FileWriter<FrontendProjectMeta> {
    protected importPath: string

    private parsedSource: TypeScriptSource
    private imports: Array<TypeScriptImport> = []
    private content: Array<string> = []

    constructor(file: File, private source: vscode.TextDocument) {
        super(file)

        this.parsedSource = TypeScriptParser.getExportedStatements(this.source.getText())
        const { dir: sourceFileDir, name: sourceFileName } = parse(source.uri.fsPath)

        this.importPath = join(relative(file.getDirectory(), sourceFileDir), sourceFileName).split(sep).join("/")
    }

    private getRelativeImportPath(path: string) {
        const { dir: sourceFileDir } = parse(this.source.uri.fsPath)

        const importFile = resolve(sourceFileDir, path)
        const { name: importFileName, dir: importFileDir } = parse(importFile)
        return join(relative(this.file.getDirectory(), importFileDir), importFileName).split(sep).join("/")
    }

    async prepare(projectMeta: FrontendProjectMeta): Promise<void> {
        const exports = await this.getExports()

        this.addImport({ named: exports.map((exp) => exp.name), from: `${this.importPath}` })

        if (exports.length === 0) {
            if (projectMeta.jest) {
                this.addContent(...this.addDefaultTest("defaultFn"))
            }
        } else if (projectMeta.jest) {
            exports.forEach((exp) => {
                // TODO make it more flexible in the future
                if (exp.name.startsWith("translate") && projectMeta.i18next) {
                    const imports = this.parsedSource.getImports()

                    let enumIdentifier: string | null = null

                    imports.forEach((imp) => {
                        if (imp.name !== "i18n") {
                            enumIdentifier = imp.name
                        }

                        if (imp.default) {
                            this.addImport({
                                from: this.getRelativeImportPath(imp.from),
                                default: imp.name,
                            })
                        }

                        if (imp.named) {
                            this.addImport({
                                from: this.getRelativeImportPath(imp.from),
                                named: imp.name,
                            })
                        }
                    })

                    imports.push({ from: "i18next", name: "i18next", default: true })
                    
                    this.addContent(
                        `describe("${exp.name}", () => {`,
                        `    mockInitLocalePartially(mockLocale)`,
                        ``,
                        `    Object.values(${enumIdentifier}).forEach((value) => {`,
                        `        it(\`should translate \${value}\`, () => {`,
                        `            const translation = ${exp.name}(value)`,
                        `            expect(translation).toEqual(i18next.t(\`.\${value}\`))`,
                        `        })`,
                        `    })`,
                        `})`
                    )
                } else {
                    this.addContent(...this.addDefaultTest(exp.name))
                }
            })
        }
    }

    protected addDefaultTest(fnName: string) {
        return [`describe("${fnName}", () => {`, `    it("should ...", () => {`, `        expect(${fnName}()).toEqual(null)`, `    })`, `})`, ``]
    }

    protected addImport(...imps: Array<TypeScriptImport>): void {
        for (const imp of imps) {
            // at some point i need to check the inner value if it contains the from
            if (!this.imports.find(value => value.from === imp.from)) {
                this.imports.push(imp)
            }
        }
    }

    protected addContent(...content: Array<string>): void {
        this.content.push(...content)
    }

    protected generateContent() {
        const imports = this.imports.map(TypeScriptFileWriter.printImport).join("\n")
        return `${imports !== "" ? `${imports}\n\n` : ""}` + `${this.content.join("\n")}`
    }

    /**
     *
     */
    protected async getExports(): Promise<Array<ParsedStatement>> {
        const exportedDeclarations: Array<ParsedStatement> = this.parsedSource.getExportedDeclarations()

        let exportsChosenByTheUser: Array<ParsedStatement> = exportedDeclarations

        if (exportedDeclarations.length > 1) {
            const results = await vscode.window.showQuickPick(
                exportedDeclarations.map((exp) => exp.name),
                { canPickMany: true, title: "Choose the exports that the test should cover." }
            )
            exportsChosenByTheUser = exportedDeclarations.filter((exp) => results?.includes(exp.name))
        }

        return exportsChosenByTheUser
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
