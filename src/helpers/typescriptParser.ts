import { createSourceFile, isFunctionDeclaration, isIdentifier, isVariableStatement, ScriptTarget, Statement, SyntaxKind } from "typescript"

export type ParsedStatement = {
	name: string
	type: SyntaxKind.FunctionDeclaration | SyntaxKind.VariableStatement
}

function hasExportedModifier(statement: Statement) {
	return !!statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
}

export const TypeScriptParser = {
	getExportedStatements: function (sourceText: string) {
		const file = createSourceFile("e", sourceText, ScriptTarget.ESNext)

		const exportedFunctionNames: Array<ParsedStatement> = []

		file.statements.forEach((statement) => {
			if (isFunctionDeclaration(statement)) {
				if (hasExportedModifier(statement) && statement.name?.text) {
					exportedFunctionNames.push({ name: statement.name.text, type: SyntaxKind.FunctionDeclaration })
				}
			} else if (isVariableStatement(statement)) {
				if (hasExportedModifier(statement)) {
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