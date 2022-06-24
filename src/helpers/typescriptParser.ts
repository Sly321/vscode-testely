import { parse, resolve } from "path"
import {
    createSourceFile,
    EnumDeclaration, FunctionDeclaration, ImportDeclaration, isArrayTypeNode,
    isEnumDeclaration, isExportAssignment, isFunctionDeclaration,
    isIdentifier, isImportClause, isImportDeclaration, isIntersectionTypeNode,
    isNamedImports,
    isPropertySignature,
    isStringLiteral,
    isTypeAliasDeclaration,
    isTypeLiteralNode,
    isTypeReferenceNode,
    isVariableStatement,
    ScriptTarget, Statement, SyntaxKind,
    TypeLiteralNode,
    VariableDeclaration,
    VariableStatement
} from "typescript"
import { TextDocument, workspace } from "vscode"
import { File } from "../generators/File"
import { fileFromTextDocument } from "./fileFromTextDocument"
import { getExtension } from "./fs-ultra"
import { hasDefaultModifier, hasExportedModifier } from "./typescript-parser/getExportType"
import { resolveImport } from "./typescript-parser/resolveImport"

export type ParsedStatement = {
    name: string
    type: SyntaxKind.FunctionDeclaration | SyntaxKind.VariableStatement | SyntaxKind.EnumDeclaration | SyntaxKind.TypeAliasDeclaration
    defaultExport?: boolean
}

export type TypeScriptSourceImport = {
    name: string
    from: string
    default?: boolean
    named?: boolean
}

export class TypeScriptSource {
    private imports: Array<TypeScriptSourceImport> = []
    private exportedDeclarations: Array<ParsedStatement> = []

    public addEnum(statement: EnumDeclaration) {
        if (hasExportedModifier(statement) && statement.name?.text) {
            this.exportedDeclarations.push({ name: statement.name.text, type: SyntaxKind.EnumDeclaration, defaultExport: hasDefaultModifier(statement) })
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

    public addFunction(statement: FunctionDeclaration) {
        if (hasExportedModifier(statement) && statement.name?.text) {
            this.exportedDeclarations.push({ name: statement.name.text, type: SyntaxKind.FunctionDeclaration, defaultExport: hasDefaultModifier(statement) })
        }
    }

    public addImport(statement: ImportDeclaration) {
        if (statement.importClause) {
            if (isImportClause(statement.importClause)) {
                const from = isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : ""

                if (statement.importClause.namedBindings && isNamedImports(statement.importClause.namedBindings)) {
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

export type TypeScriptProperty = {
    type: SyntaxKind
    name?: string
    of?: TypeScriptProperty
}
export type TypeScriptPropertiesDeclaration = Record<string, TypeScriptProperty>

export type ResolvedTypeScriptProperty = { 
    type: SyntaxKind
    name?: string
    of?: ResolvedTypeScriptProperty
}

export type ResolvedType = {
    properties: TypeScriptPropertiesDeclaration
    name: string
    exported: boolean
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
            } else if (isImportDeclaration(statement)) {
                source.addImport(statement)
            } else {
                // console.log("Unkown type: " + statement.kind)
            }
        })
        
        return source
    }
    
    static isTypeStatement(document: TextDocument, keyword: string) {
        const { name } = parse(document.fileName)
        const file = createSourceFile(name, document.getText(), ScriptTarget.ESNext, true)

        let result = false

        for (let statement of file.statements) {
            if (isTypeAliasDeclaration(statement) && statement.name.escapedText === keyword) {
                result = true
            }
            
            if (result === true) {
                break
            }
        }

        return result
    }

    static async getResolvedTypeField(sourceFile: File, keyword: string): Promise<[TypeScriptPropertiesDeclaration, Array<ParsedStatement>]> {
        const file = createSourceFile(sourceFile.getBaseName(), sourceFile.getContent(), ScriptTarget.ESNext, true)

        const source = new TypeScriptSource()

        for (const statement of file.statements) {
            if (isImportDeclaration(statement)) {
                source.addImport(statement)
            }
        }

        let properties: TypeScriptPropertiesDeclaration = {}
        const exports: Array<ParsedStatement> = []

        for (const statement of file.statements) {
            if (isTypeAliasDeclaration(statement) && statement.name.escapedText === keyword) {
                const { type } = statement

                if (hasExportedModifier(statement) && statement.name?.text) {
                    exports.push({ name: statement.name.text, type: SyntaxKind.TypeAliasDeclaration })
                }

                if (isIntersectionTypeNode(type)) {
                    for (const childType of type.types) {
                        if (isTypeReferenceNode(childType)) {
                            const childTypeName = childType.getFullText().trim()
                            const childTypeImport = source.getImports().find(sImport => sImport.name === childTypeName)
                            if (childTypeImport) {
                                const resolved = resolve(sourceFile.getDirectory(), childTypeImport?.from)
                                const ext = await getExtension(resolved)

                                if (ext !== null) {

                                    const nestedDocument = fileFromTextDocument(await workspace.openTextDocument(`${resolved}${ext}`))
                                    const nestedResolvedFields = await TypeScriptParser.getResolvedTypeField(nestedDocument, childTypeName)
                                    
                                    properties = {
                                        ...nestedResolvedFields[0],
                                        ...properties
                                    }
                                }
                            }
                        } else if (isTypeLiteralNode(childType)) {
                            properties = {
                                ...properties,
                                ...(await this.handleTypeLiteralNode(childType, source, sourceFile))
                            }
                        } else {
                            console.error(`unknown type in intersection type ${childType.kind}`)
                        }
                    }
                } else if (isTypeLiteralNode(type)) {
                    if (isTypeReferenceNode(type)) {
                            
                    } else {
                        properties = {
                            ...properties,
                            ...(await this.handleTypeLiteralNode(type, source, sourceFile))
                        }
                    }
                } else {
                    console.error(`unknown type ${type.kind}`)
                }
            }
        }

        return [properties, exports]
    }

    static async getResolvedType(sourceFile: File, keyword: string): Promise<ResolvedType> {
        const file = createSourceFile(sourceFile.getBaseName(), sourceFile.getContent(), ScriptTarget.ESNext, true)

        const source = new TypeScriptSource()

        for (const statement of file.statements) {
            if (isImportDeclaration(statement)) {
                source.addImport(statement)
            }
        }

        let properties: TypeScriptPropertiesDeclaration = {}
        let exported: ResolvedType["exported"] = false

        for (const statement of file.statements) {
            if (isTypeAliasDeclaration(statement) && statement.name.escapedText === keyword) {
                const { type } = statement

                if (hasExportedModifier(statement)) {
                    exported = true
                }

                if (isIntersectionTypeNode(type)) {
                    for (const childType of type.types) {
                        if (isTypeReferenceNode(childType)) {
                            const childTypeName = childType.getFullText().trim()
                            const childTypeImport = source.getImports().find(sImport => sImport.name === childTypeName)
                            if (childTypeImport) {
                                const resolved = resolve(sourceFile.getDirectory(), childTypeImport?.from)
                                const ext = await getExtension(resolved)

                                if (ext !== null) {

                                    const nestedDocument = fileFromTextDocument(await workspace.openTextDocument(`${resolved}${ext}`))
                                    const nestedResolvedFields = await TypeScriptParser.getResolvedTypeField(nestedDocument, childTypeName)
                                    
                                    properties = {
                                        ...nestedResolvedFields[0],
                                        ...properties
                                    }
                                }
                            }
                        } else if (isTypeLiteralNode(childType)) {
                            properties = {
                                ...properties,
                                ...(await this.handleTypeLiteralNode(childType, source, sourceFile))
                            }
                        } else {
                            console.error(`unknown type in intersection type ${childType.kind}`)
                        }
                    }
                } else if (isTypeLiteralNode(type)) {
                    if (isTypeReferenceNode(type)) {
                            
                    } else {
                        properties = {
                            ...properties,
                            ...(await this.handleTypeLiteralNode(type, source, sourceFile))
                        }
                    }
                } else {
                    console.error(`unknown type ${type.kind}`)
                }
            } else if (isExportAssignment(statement)) {
            } else {
                // console.error(`unknown declaration type`, statement.kind, statement.getFullText(), statement.getText())
            }
        }

        return {
            properties,
            name: keyword,
            exported
        }
    }

    private static async handleTypeLiteralNode(type: TypeLiteralNode, source: TypeScriptSource, doc: File): Promise<TypeScriptPropertiesDeclaration> {

        let properties: TypeScriptPropertiesDeclaration = {}

        for (const member of type.members) {
            if (isPropertySignature(member)) {
                const memberName = member.name.getFullText().trim()

                if (member.type) {
                    if (isArrayTypeNode(member.type)) {
                        properties[memberName] = {
                            type: member.type?.kind,
                            // of: member.type.elementType
                            of: { type: SyntaxKind.Unknown }
                        }
                    } else if (isTypeReferenceNode(member.type)) {
                        const typeName = member.type.typeName.getFullText().trim()
                        const childTypeImport = source.getImports().find(sImport => sImport.name === typeName)
                        if (childTypeImport) {
                            const file = await resolveImport(childTypeImport, doc)

                            if (file) {
                                const res = await this.getResolvedTypeField(file, typeName)
                                console.log(res)
                            } else {
                                properties[memberName] = {
                                    type: SyntaxKind.Unknown,
                                    name: typeName
                                }
                            }
                        }
                    } else {
                        properties[memberName] = {
                            type: member.type?.kind || SyntaxKind.Unknown
                        }
                    }
                }
            } else {
                console.error(`unknown type literal member type ${member.kind}`)
            }
        }
        return properties
    }
}