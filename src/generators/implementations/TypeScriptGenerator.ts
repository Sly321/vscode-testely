import { readFile } from "fs/promises"
import { join, parse, relative, sep } from "path"
import * as vscode from "vscode"
import { getNearest } from "../../helpers/fs-ultra"
import { FrontendProjectMeta } from "../../helpers/ProjectMeta"
import { FileWriter, Generator, GeneratorError } from "../Generator"
import { createSourceFile, isFunctionDeclaration, isIdentifier, isVariableStatement, ScriptTarget, Statement, SyntaxKind } from "typescript"

export class TypeScriptGenerator extends Generator<FrontendProjectMeta> {
    async getProjectMeta(): Promise<FrontendProjectMeta> {
        const {
            uri: { fsPath },
        } = this.document
        const pkgPath = await getNearest("package.json", fsPath)

        if (pkgPath === null) {
            return {
                "@testing-library/react": false,
                react: false,
                jest: false,
                mocha: false,
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
            }
        } catch (e) {
            console.error(e)
            throw new GeneratorError(`Error while reading ${pkgPath}.\n\n${e}.`)
        }
    }

    override getFileWriter(filePath: string) {
        return new TypeScriptFileWriter(filePath, this.document)
    }
}

export type TypeScriptImport = {
    from: string
    default?: string
    named?: string | Array<string>
}

export class TypeScriptFileWriter extends FileWriter<FrontendProjectMeta> {
    private imports: Array<TypeScriptImport> = []
    private content: Array<string> = []

    protected importPath: string

    constructor(testFilePath: string, private source: vscode.TextDocument) {
        super(testFilePath)

        const { dir: sourceFileDir, name: sourceFileName } = parse(source.uri.fsPath)
        const { dir: testFileDir } = parse(testFilePath)

        this.importPath = join(relative(testFileDir, sourceFileDir), sourceFileName).split(sep).join("/")
    }

    async prepare(projectMeta: FrontendProjectMeta): Promise<void> {
        const exports = await this.getExports()

        this.addImport({ named: exports.map((exp) => exp.name), from: `${this.importPath}` })

        if (projectMeta.jest) {
            exports.forEach((exp) => {
                this.addContent(
                    `describe("${exp.name}", () => {`,
                    `    it("should ...", () => {`,
                    `        expect(${exp.name}()).toEqual(null)`,
                    `    })`,
                    `})`,
                    ``
                )
            })
        }
    }

    protected async getExports(): Promise<Array<ParsedStatement>> {
        const exportedStatements = this.getExportedStatements(this.source.getText())

        let exports: Array<ParsedStatement> = exportedStatements
        if (exportedStatements.length > 1) {
            const results = await vscode.window.showQuickPick(
                exportedStatements.map((exp) => exp.name),
                { canPickMany: true, title: "Choose the exports that the test should cover." }
            )
            exports = exportedStatements.filter((exp) => results?.includes(exp.name))
        }

        return exports
    }

    addImport(...imp: Array<TypeScriptImport>): void {
        this.imports.push(...imp)
    }

    addContent(...content: Array<string>): void {
        this.content.push(...content)
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

    generateContent() {
        const imports = this.imports.map(TypeScriptFileWriter.printImport).join("\n")
        return `${imports !== "" ? `${imports}\n\n` : ""}` + `${this.content.join("\n")}`
    }

    private hasExportedModifier(statement: Statement) {
        return !!statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
    }

    protected getExportedStatements(sourceText: string) {
        const file = createSourceFile("e", sourceText, ScriptTarget.ESNext)

        const exportedFunctionNames: Array<ParsedStatement> = []

        file.statements.forEach((statement) => {
            if (isFunctionDeclaration(statement)) {
                if (this.hasExportedModifier(statement) && statement.name?.text) {
                    exportedFunctionNames.push({ name: statement.name.text, type: SyntaxKind.FunctionDeclaration })
                }
            } else if (isVariableStatement(statement)) {
                if (this.hasExportedModifier(statement)) {
                    statement.declarationList.declarations.forEach((declaration) => {
                        if (isIdentifier(declaration.name)) {
                            exportedFunctionNames.push({ name: declaration.name.text, type: SyntaxKind.VariableStatement })
                        }
                    })
                }
            } else {
                //   console.log("Unkown type: " + statement.kind);
            }
        })

        return exportedFunctionNames
    }
}

type ParsedStatement = {
    name: string
    type: SyntaxKind.FunctionDeclaration | SyntaxKind.VariableStatement
}
