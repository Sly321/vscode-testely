import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import * as vscode from "vscode"
import { assureDir } from "../helpers/fs-ultra"
import { ProjectMeta } from "../helpers/ProjectMeta"
import { TestfileFactory } from "./core/TestfileFactory"
import { File } from "./File"

export class GeneratorError extends Error {}

export abstract class Generator<T extends ProjectMeta> {
    private sourceFile: File

    constructor(protected document: vscode.TextDocument) {
        this.sourceFile = new File(document.uri.fsPath)
    }

    abstract getFileWriter(file: File): FileWriter<T>
    abstract getProjectMeta(): Promise<T>

    async generate(): Promise<File> {
        const file = await TestfileFactory.createFromSource(this.sourceFile)
        assureDir(file.getDirectory())

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

    async append(): Promise<void> {
        const content = await readFile(this.file.getPath(), { encoding: "utf-8" })
        return await writeFile(this.file.getPath(), `${content}\n${this.generateContent()}`, { encoding: "utf8" })
    }
}
