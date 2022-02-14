import { join, parse, resolve, sep } from "path"
import * as vscode from "vscode"
import { resourceLimits } from "worker_threads"
import { configuration, TestLocation } from "../configuration"
import { GeneratorError } from "../generators/Generator"
import { getGeneratorByLanguageId } from "../generators/getGeneratorByLanguageId"
import { getRootWorkspaceFolder, isTestFile, removeTestFromFileName } from "../helpers/fs-ultra"

export async function createTestCommand(document: vscode.TextDocument) {
    try {
        if (document.isUntitled) {
            vscode.window.showErrorMessage("Can't create a test from an untitled file.")
            return
        }

        if (document.uri.scheme !== "file") {
            vscode.window.showErrorMessage(`File scheme ${document.uri.scheme} is not supported.`)
            return
        }

        if (isTestFile(document.uri.fsPath)) {
            return await openSourceFile(document)
        }

        const generator = getGeneratorByLanguageId(document)

        const file = await generator.generate()

        await showDocument(file.getPath())
    } catch (e) {
        if (e.message) {
            vscode.window.showErrorMessage(e.message)
        }
    }
}

async function openSourceFile(testDocument: vscode.TextDocument) {
    switch (configuration.getTestLocation()) {
        case TestLocation.SameDirectoryNested:
            const { base, dir } = parse(removeTestFromFileName(testDocument.uri.fsPath))
            const sourceFileLocation = resolve(dir, "..", base)
            return await showDocument(sourceFileLocation)
        case TestLocation.SameDirectory:
            return await showDocument(removeTestFromFileName(testDocument.uri.fsPath))
        case TestLocation.RootTestFolderNested:
            const rootSourceFolder = getRootWorkspaceFolder(testDocument.uri)
            const fileName = removeTestFromFileName(testDocument.uri.fsPath.replace(rootSourceFolder, "").split(sep).slice(2).join(sep))
            const sourceFile = join(rootSourceFolder, "src", fileName)
            return await showDocument(sourceFile)
        case TestLocation.RootTestFolderFlat:
            const { base: baseFileName } = parse(testDocument.uri.fsPath)
            const results = await vscode.workspace.findFiles(`**/${removeTestFromFileName(baseFileName)}`)

            if (results.length === 0) {
                throw new Error(`Can't find corresponding source file to ${baseFileName}.`)
            }

            if (results.length === 1) {
                return await showDocument(results[0].fsPath)
            }

            const fileToOpen = await vscode.window.showQuickPick(
                results.map((result) => result.fsPath),
                { title: "Which file should be opened?", placeHolder: "Select file to open..." }
            )

            if (fileToOpen) {
                showDocument(fileToOpen)
            }

        // break
        default:
            throw new Error(`Unknown testely.testLocation config value: ${configuration.getTestLocation()}.`)
    }
}

export async function showDocument(filePath: string) {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath))
    await vscode.window.showTextDocument(doc, 1, false)
}
