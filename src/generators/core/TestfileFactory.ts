import { join, sep } from "path";
import * as vscode from "vscode";
import { configuration, TestLocation } from "../../configuration";
import { addTestToFileName, getRootWorkspaceFolder } from "../../helpers/fs-ultra";
import { File } from "../File";

// Maybe create this as an abstract class, and make it an TypeScriptTestfileFactory
export class TestfileFactory {
	private static sourceFile: File

	public static async createFromSource(source: File): Promise<File> {
		this.sourceFile = source
		return this.getTestFile()
	}

	private static getTestFile() {
        switch (configuration.getTestLocation()) {
            case TestLocation.SameDirectoryNested:
                return this.createSameDirectoryNestedPath()
            case TestLocation.SameDirectory:
                return this.createSameDirectoryPath()
            case TestLocation.RootTestFolderNested:
                return this.createRootTestFolderNestedPath()
            case TestLocation.RootTestFolderFlat:
                return this.createRootTestFolderFlatPath()
            default:
                throw new Error(`Unknown testely.testLocation config value: ${configuration.getTestLocation()}.`)
        }
	}

	private static async createSameDirectoryNestedPath() {
        const testFolder = join(this.sourceFile.getDirectory(), configuration.getTestDirectoryName())
        const testFilePath = join(testFolder, this.createTestName())
        const file = new File(testFilePath)
        return file
    }

    private static async createSameDirectoryPath() {
        const testFilePath = join(this.sourceFile.getDirectory(), this.createTestName())
        const file = new File(testFilePath)
        return file
    }

    private static async createRootTestFolderFlatPath() {
        const root = getRootWorkspaceFolder(vscode.Uri.file(this.sourceFile.getPath()))

        const testFolder = join(root, "test")
        const testFile = join(testFolder, this.createTestName())

        return new File(testFile)
    }

    private static async createRootTestFolderNestedPath() {
        const root = getRootWorkspaceFolder(vscode.Uri.file(this.sourceFile.getPath()))

        const testFolder = join(root, "test")
        const fileName = addTestToFileName(this.sourceFile.getPath().replace(root, "").split(sep).slice(2).join(sep))
        const testFile = join(testFolder, fileName)

        return new File(testFile)
    }

	private static createTestName(): string {
		return addTestToFileName(this.sourceFile.getBaseName());
	}
}