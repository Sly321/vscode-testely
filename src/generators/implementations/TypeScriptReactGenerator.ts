import { TextDocument } from "vscode"
import { FrontendProjectMeta } from "../../helpers/ProjectMeta"
import { ParsedStatement } from "../../helpers/typescriptParser"
import { File } from "../File"
import { TypeScriptFileWriter, TypeScriptGenerator } from "./TypeScriptGenerator"

export class TypeScriptReactGenerator extends TypeScriptGenerator {
    override getFileWriter(file: File) {
        return new TypeScriptReactFileWriter(file, this.document)
    }
}
export class TypeScriptReactFileWriter extends TypeScriptFileWriter {
    constructor(file: File, doc: TextDocument) {
        super(file, doc)
    }

    override async prepare(projectMeta: FrontendProjectMeta): Promise<void> {
        const exports = await this.getExports()
        this.addImport({ named: exports.map((exp) => exp.name), from: `${this.importPath}` })

        exports.forEach((exp) => {
            if (projectMeta.jest) {
                if (projectMeta["@testing-library/react"]) {
                    if (this.isReactHook(exp)) {
                        if (projectMeta["@testing-library/react-hooks"]) {
                            this.addImport({ from: "react", named: ["ReactNode"] })
                            this.addImport({ from: "@testing-library/react-hooks", named: ["renderHook"] })

                            this.addContent(
                                `describe("${exp.name}", () => {`,
                                ``,
                                `    function wrapper({}: { children: ReactNode }) {`,
                                `        return <SomeProvider>{children}</SomeProvider>`,
                                `    }`,
                                ``,
                                `    it("should ...", () => {`,
                                `        const { result } = renderHook(() => ${exp.name}, { wrapper })`,
                                `        expect(result.current).toEqual("{}")`,
                                `    })`,
                                `})`,
                                ``
                            )
                        } else if (projectMeta["@testing-library/react"]) {
                            this.addImport({ from: "@testing-library/react", named: ["screen, render"] })
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
                        }
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

    isReactHook(statement: ParsedStatement) {
        return statement.name.startsWith("use")
    }
}
