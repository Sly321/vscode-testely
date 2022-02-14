import { existsSync, mkdirSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { join, parse, ParsedPath, sep } from "path"
import * as vscode from "vscode"
import { configuration, TestLocation } from "../configuration"
import { addTestToFileName, assureDir, getRootWorkspaceFolder } from "../helpers/fs-ultra"
import { ProjectMeta } from "../helpers/ProjectMeta"

export class GeneratorError extends Error {}

export abstract class Generator<T extends ProjectMeta> {
    protected configuration = configuration

    constructor(protected document: vscode.TextDocument) {}

    abstract getFileWriter(filePath: string): FileWriter<T>
    abstract getProjectMeta(): Promise<T>

    protected async createPaths(): Promise<{ filePath: string }> {
        switch (this.configuration.getTestLocation()) {
            case TestLocation.SameDirectoryNested:
                return this.createSameDirectoryNestedPath()
            case TestLocation.SameDirectory:
                return this.createSameDirectoryPath()
            case TestLocation.RootTestFolderNested:
                return this.createRootTestFolderNestedPath()
            case TestLocation.RootTestFolderFlat:
                return this.createRootTestFolderFlatPath()
            default:
                throw new Error(`Unknown testely.testLocation config value: ${this.configuration.getTestLocation()}.`)
        }
    }

    private async createSameDirectoryNestedPath() {
        const { dir: folder, base: fileName } = parse(this.document.uri.fsPath)
        const testFolder = join(folder, configuration.getTestDirectoryName())
        const testFile = join(testFolder, addTestToFileName(fileName))

        await assureDir(testFolder)

        return { filePath: testFile }
    }

    private async createSameDirectoryPath() {
        const { dir: folder, base: fileName } = parse(this.document.uri.fsPath)
        const testFile = join(folder, addTestToFileName(fileName))

        await assureDir(folder)

        return { filePath: testFile }
    }

    private async createRootTestFolderFlatPath() {
        const { uri } = this.document
        const { base: fileName } = parse(uri.fsPath)
        const root = getRootWorkspaceFolder(uri)

        const testFolder = join(root, "test")
        const testFile = join(testFolder, addTestToFileName(fileName))

        mkdirSync(testFile.substring(0, testFile.lastIndexOf(sep)), { recursive: true })

        return { filePath: testFile }
    }

    private async createRootTestFolderNestedPath() {
        const { uri } = this.document
        const root = getRootWorkspaceFolder(uri)

        const testFolder = join(root, "test")
        const fileName = addTestToFileName(uri.fsPath.replace(root, "").split(sep).slice(2).join(sep))
        const testFile = join(testFolder, fileName)

        mkdirSync(testFile.substring(0, testFile.lastIndexOf(sep)), { recursive: true })

        return { filePath: testFile }
    }

    async generate(): Promise<string> {
        const { filePath } = await this.createPaths()

        if (existsSync(filePath)) {
            return filePath
        }

        const writer = this.getFileWriter(filePath)
        await writer.prepare(await this.getProjectMeta())
        await writer.write()

        return filePath
    }
}

export abstract class FileWriter<T extends ProjectMeta> {
    protected parsedFilePath: ParsedPath

    constructor(protected filePath: string) {
        this.parsedFilePath = parse(filePath)
    }

    protected abstract generateContent(): string
    abstract prepare(meta: T): Promise<void>

    async write(): Promise<void> {
        return await writeFile(this.filePath, this.generateContent(), { encoding: "utf8" })
    }

    async append(): Promise<void> {
        const content = await readFile(this.filePath, { encoding: "utf-8" })
        return await writeFile(this.filePath, `${content}\n${this.generateContent()}`, { encoding: "utf8" })
    }
}
