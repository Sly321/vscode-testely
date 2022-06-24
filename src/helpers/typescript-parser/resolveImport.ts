import { resolve } from "path"
import { workspace } from "vscode"
import { File } from "../../generators/File"
import { fileFromTextDocument } from "../fileFromTextDocument"
import { findNodeModules, getExtension } from "../fs-ultra"
import { TypeScriptSourceImport } from "../typescriptParser"

export async function resolveImport(typeImport: TypeScriptSourceImport, doc: File): Promise<File | null> {
    const isRelativeImport = typeImport.from.startsWith(".")

    if (isRelativeImport) {
        const resolved = resolve(doc.getDirectory(), typeImport?.from)
        const ext = await getExtension(resolved)

        try {
            if (ext !== null) {
                return fileFromTextDocument(await workspace.openTextDocument(`${resolved}${ext}`))
            }
        } catch {}
    } else {
        const nodeFolder = findNodeModules(doc.getPath())
    }

    return null
}
