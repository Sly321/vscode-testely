import { TextDocument } from "vscode";
import { FrontendProjectMeta } from "../../helpers/ProjectMeta";
import { TypeScriptFileWriter, TypeScriptGenerator } from "./TypeScriptGenerator";

export class TypeScriptReactGenerator extends TypeScriptGenerator {
	override getFileWriter(filePath: string) {
		return new TypeScriptReactFileWriter(filePath, this.document);
	}
}
export class TypeScriptReactFileWriter extends TypeScriptFileWriter {
	private isHook = false;

	constructor(filePath: string, doc: TextDocument) {
		super(filePath, doc);
		this.isHook = this.componentName.startsWith("use");
	}

	override useProjectMeta(projectMeta: FrontendProjectMeta): void {
		if (projectMeta["@testing-library/react"]) {
			this.addImport({ "from": "@testing-library/react", named: ["screen, render"] });

			if (this.isHook) {
				this.exampleTestContent.push(`\t\trender(<UseHook />)`);
			} else {
				this.exampleTestContent.push(`\t\trender(<${this.componentName} />)`);
			}

			if (projectMeta.jest) {
				if (this.isHook) {
					this.exampleTestContent.push(`\t\texpect(screen.getByTestId("result").innerHTML).toEqual("{}")`);
				} else {
					this.exampleTestContent.push(`\t\texpect(screen.getByTestId("")).toBeInTheDocument()`);
				}
			}
		}

		if (projectMeta.jest) {

			if (this.isHook) {
				this.testWrapper = (testContent: string) => {
					return `describe("${this.componentName}", () => {\n` +
						`\n` +
						`\tfunction UseHook() {\n` +
						`\t\tconst { data } = ${this.componentName}()\n` +
						`\t\treturn <div data-testid="result">{JSON.stringify(data)}</div>\n` +
						`\t}\n` +
						`\n` +
						`\tit(\`should ...\`, () => {\n` +
						`${testContent}\n` +
						`\t})\n` +
						`})`;
				};
			} else {
				this.testWrapper = (testContent: string) => {
					return `describe("${this.componentName}", () => {\n` +
						`\tit(\`should ...\`, () => {\n` +
						`${testContent}\n` +
						`\t})\n` +
						`})`;
				};
			}
		}
	}
}