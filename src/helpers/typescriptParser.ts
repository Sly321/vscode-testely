import {
    createSourceFile,
    EnumDeclaration,
    isEnumDeclaration,
    isFunctionDeclaration,
    isIdentifier,
    isVariableStatement,
    ScriptTarget,
    Statement,
    SyntaxKind,
    VariableStatement,
} from "typescript"
import ts = require("typescript")

export type ParsedStatement = {
    name: string
    type: SyntaxKind.FunctionDeclaration | SyntaxKind.VariableStatement | SyntaxKind.EnumDeclaration
}

function hasExportedModifier(statement: Statement) {
    return !!statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
}

export class TypeScriptSource {
    private imports: Array<any> = []
    private exportedDeclarations: Array<ParsedStatement> = []

    public addEnum(statement: EnumDeclaration) {
        if (hasExportedModifier(statement) && statement.name?.text) {
            this.exportedDeclarations.push({ name: statement.name.text, type: SyntaxKind.EnumDeclaration })
        }
    }

    public addVariable(statement: VariableStatement) {
        if (hasExportedModifier(statement)) {
            statement.declarationList.declarations.forEach((declaration) => {
                if (isIdentifier(declaration.name)) {
                    this.exportedDeclarations.push({ name: declaration.name.text, type: SyntaxKind.VariableStatement })
                }
            })
        }
    }

    public addFunction(statement: ts.FunctionDeclaration) {
        if (hasExportedModifier(statement) && statement.name?.text) {
            this.exportedDeclarations.push({ name: statement.name.text, type: SyntaxKind.FunctionDeclaration })
        }
    }

    public addImport(statement: ts.ImportDeclaration) {
        console.log(statement)
        if (statement.importClause) {
            if (ts.isImportClause(statement.importClause)) {
                const from = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : ""

                if (statement.importClause.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
                    statement.importClause.namedBindings.elements.forEach((imp) => {
                        this.imports.push({
                            name: imp.name.text,
                            from,
                            named: true,
                        })
                    })
                }

                if (statement.importClause.name) {
                    this.imports.push({
                        name: statement.importClause.name.text,
                        from,
                        default: true,
                    })
                }
            }
        }
    }

    public getExportedDeclarations() {
        return this.exportedDeclarations
    }

    public getImports() {
        return this.imports
    }
}

export class TypeScriptParser {
    static getExportedStatements(sourceText: string) {
        const file = createSourceFile("e", sourceText, ScriptTarget.ESNext)

        const source = new TypeScriptSource()

        file.statements.forEach((statement) => {
            if (isFunctionDeclaration(statement)) {
                source.addFunction(statement)
            } else if (isVariableStatement(statement)) {
                source.addVariable(statement)
            } else if (isEnumDeclaration(statement)) {
                source.addEnum(statement)
            } else if (ts.isImportDeclaration(statement)) {
                source.addImport(statement)
            } else {
                // console.log("Unkown type: " + statement.kind)
            }
        })

        return source
    }
}
