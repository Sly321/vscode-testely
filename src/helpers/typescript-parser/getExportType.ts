import { isExportAssignment, isExportDeclaration, isExportSpecifier, isNamedExportBindings, isNamedExports, Statement, SyntaxKind } from "typescript"

export function hasExportedModifier(statement: Statement) {
    return !!statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)
}

export function hasDefaultModifier(statement: Statement) {
    return !!statement.modifiers?.some((modifier) => modifier.kind === SyntaxKind.DefaultKeyword)
}

// export function getExportType(statement: Statement) {
// 	console.log("getExportType")

// 	if (hasExportedModifier(statement)) {
// 		console.log("hasExportedModifier")
// 	}

// 	if (isExportAssignment(statement)) {
// 		console.log("isExportAssignment")
// 		return "default"
// 	}
	
// 	if (isNamedExports(statement)) {
// 		console.log("isNamedExports")
// 		return true
// 	}
	
// 	if (isExportSpecifier(statement)) {
// 		console.log("isExportSpecifier")
// 		return true
// 	}
	
// 	if (isNamedExportBindings(statement)) {
// 		console.log("isNamedExportBindings")
// 		return true
// 	}
	
// 	if (isExportDeclaration(statement)) {
// 		console.log("isExportDeclaration")
// 		return true
// 	}

// 	return false
// }