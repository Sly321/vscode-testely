import { TextDocument } from "vscode"
import { FrontendProjectMeta } from "../../helpers/ProjectMeta"
import { TypeScriptFileWriter, TypeScriptGenerator } from "./TypeScriptGenerator"

export class TypeScriptReactGenerator extends TypeScriptGenerator {
    override getFileWriter(filePath: string) {
        return new TypeScriptReactFileWriter(filePath, this.document)
    }
}
export class TypeScriptReactFileWriter extends TypeScriptFileWriter {
    constructor(filePath: string, doc: TextDocument) {
        super(filePath, doc)
    }

    override async prepare(projectMeta: FrontendProjectMeta): Promise<void> {
        const exports = await this.getExports()
        this.addImport({ named: exports.map((exp) => exp.name), from: `${this.importPath}` })

        if (projectMeta["@testing-library/react"]) {
            this.addImport({ from: "@testing-library/react", named: ["screen, render"] })
        }

        exports.forEach((exp) => {
            if (projectMeta.jest) {
                if (projectMeta["@testing-library/react"]) {
                    if (exp.name.startsWith("use")) {
                        this.addContent(
                            `describe("${exp.name}", () => {`,
                            ``,
                            `    function UseHook() {`,
                            `        const { data } = ${exp.name}()`,
                            `        return <div data-testid="result">{JSON.stringify(data)}</div>`,
                            `    }`,
                            ``,
                            `    it("should ...", () => {`,
                            `        render(<UseHook />)`,
                            `        expect(screen.getByTestId("result").innerHTML).toEqual("{}")`,
                            `    })`,
                            `})`,
                            ``
                        )
                    } else {
                        this.addContent(
                            `describe("<${exp.name} />", () => {`,
                            `    it("should ...", () => {`,
                            `        render(<${exp.name} />)`,
                            `        expect(screen.getByTestId("")).toBeInTheDocument()`,
                            `    })`,
                            `})`,
                            ``
                        )
                    }
                } else {
                    this.addContent(`describe("<${exp.name} />", () => {`, `    it("should ...", () => {`, `        // todo`, `    })`, `})`, ``)
                }
            }
        })
    }
}
