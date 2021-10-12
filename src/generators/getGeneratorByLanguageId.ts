import * as vscode from "vscode"
import { TypeScriptReactGenerator } from "./implementations/TypeScriptReactGenerator"
import { Generator } from "./Generator"
import { ProjectMeta } from "../helpers/ProjectMeta"
import { TypeScriptGenerator } from "./implementations/TypeScriptGenerator"

export function getGeneratorByLanguageId(document: vscode.TextDocument): Generator<ProjectMeta> {
    switch (document.languageId) {
        case "typescriptreact":
            return new TypeScriptReactGenerator(document)
        case "typescript":
            return new TypeScriptGenerator(document)
        default:
            break
    }
    return new TypeScriptReactGenerator(document)
}
