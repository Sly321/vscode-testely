import { existsSync, mkdirSync } from "fs"
import { writeFile } from "fs/promises"
import { join, parse, sep } from "path"
import * as vscode from "vscode"
import { configuration, TestLocation } from "../configuration"
import { addTestToFileName, assureDir, getRootWorkspaceFolder } from "../helpers/fs-ultra"
import { ProjectMeta } from "../helpers/ProjectMeta"

export class GeneratorError extends Error {}

export class File {
    private path: string
    private dir: string
    private fileExists: boolean = false
    private baseName: string

    constructor(path: string) {
        const { dir, base } = parse(path)
        this.path = path
        this.dir = dir
        this.baseName = base
    }

    public setExist(value: boolean) {
        this.fileExists = value
        return this
    }

    public exists(): boolean {
        return this.fileExists
    }

    public getDirectory(): string {
        return this.dir
    }

    /** The file name including extension (if any) such as `index.html`.  */
    public getBaseName(): string {
        return this.baseName
    }

    public getPath(): string {
        return this.path
    }
}

export abstract class Generator<T extends ProjectMeta> {
    protected configuration = configuration

    private sourceFile: File

    constructor(protected document: vscode.TextDocument) {
        this.sourceFile = new File(document.uri.fsPath)
    }

    abstract getFileWriter(file: File): FileWriter<T>
    abstract getProjectMeta(): Promise<T>

    protected async createTestFile(): Promise<File> {
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
        const testFolder = join(this.sourceFile.getDirectory(), this.configuration.getTestDirectoryName())
        const testFilePath = join(testFolder, addTestToFileName(this.sourceFile.getBaseName()))

        const file = new File(testFilePath)

        await assureDir(file.getDirectory())

        return file
    }

    private async createSameDirectoryPath() {
        const testFilePath = join(this.sourceFile.getDirectory(), addTestToFileName(this.sourceFile.getBaseName()))
        const file = new File(testFilePath)

        await assureDir(file.getDirectory())

        return file
    }

    private async createRootTestFolderFlatPath() {
        const { uri } = this.document
        const root = getRootWorkspaceFolder(uri)

        const testFolder = join(root, "test")
        const testFile = join(testFolder, addTestToFileName(this.sourceFile.getBaseName()))

        mkdirSync(testFile.substring(0, testFile.lastIndexOf(sep)), { recursive: true })

        return new File(testFile)
    }

    private async createRootTestFolderNestedPath() {
        const { uri } = this.document
        const root = getRootWorkspaceFolder(uri)

        const testFolder = join(root, "test")
        const fileName = addTestToFileName(uri.fsPath.replace(root, "").split(sep).slice(2).join(sep))
        const testFile = join(testFolder, fileName)

        mkdirSync(testFile.substring(0, testFile.lastIndexOf(sep)), { recursive: true })

        return new File(testFile)
    }

    async generate(): Promise<File> {
        const file = await this.createTestFile()

        if (existsSync(file.getPath())) {
            file.setExist(true)
            return file
        }

        const writer = this.getFileWriter(file)
        await writer.prepare(await this.getProjectMeta())
        await writer.write()

        return file
    }
}

export abstract class FileWriter<T extends ProjectMeta> {
    constructor(protected file: File) {
    }

    protected abstract generateContent(): string
    abstract prepare(meta: T): Promise<void>

    async write(): Promise<void> {
        return await writeFile(this.file.getPath(), this.generateContent(), { encoding: "utf8" })
    }
}
