import { SyntaxKind } from "typescript";
import { ParsedStatement, TypeScriptPropertiesDeclaration, TypeScriptProperty } from "../../../helpers/typescriptParser";
import { TypeScriptFileWriter } from "./TypeScriptFileWriter";

export type MockFileWriterMeta = {
	properties: TypeScriptPropertiesDeclaration
	imports: Array<ParsedStatement>
	keyword: string
}

export class TypeScriptMockFileWriter extends TypeScriptFileWriter<MockFileWriterMeta> {
	async prepare(meta: MockFileWriterMeta): Promise<void> {
		this.addImport({ named: meta.imports.map((exp) => exp.name), from: `${this.importPath}` })

		const content: Array<string> = [`export const mock${meta.keyword}: ${meta.keyword} = {`]
		for (const key of Object.keys(meta.properties)) {
			const property = meta.properties[key]
			content.push(`    ${key}: ${this.getPropertyValue(property)},`)
		}
		content.push("}")
		this.addContent(content.join("\n"))
	}

	private getPropertyValue(property?: TypeScriptProperty) {
		if (!property) {
			return ""
		}

		switch(property.type) {
			case SyntaxKind.Unknown:
				return this.unknownProperty(property)
			case SyntaxKind.StringKeyword:
				return this.stringProperty()
			case SyntaxKind.BooleanKeyword:
				return this.booleanProperty()
			case SyntaxKind.NumberKeyword:
				return this.numberProperty()
			case SyntaxKind.ArrayType:
				return this.arrayProperty(property)
			default:
				console.error(`missing implementation for ${property.type}`)
				return `"??? ${property.type} ???"`
		}
	}

	private stringProperty() {
		return `"string value"`
	}

	private booleanProperty() {
		return `false`
	}

	private numberProperty() {
		return `1`
	}

	private unknownProperty(prop: TypeScriptProperty) {
		if (prop.name === "DateString") {
			return `"03-12-2020"`
		}
		
		return `"unknown ${prop.name}"`
	}

	private arrayProperty(prop: TypeScriptProperty): string {
		return `[${this.getPropertyValue(prop.of)}]`
	}
}