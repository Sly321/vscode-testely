import * as assert from 'assert';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { before, beforeEach } from 'mocha';
import { join } from 'path';
import * as vscode from 'vscode';
import { ConfigurationKeys, EXTENSION_CONFIG_KEY, TestLocation } from '../../configuration';
import { TypeScriptFileWriter, TypeScriptImport } from '../../generators/implementations/TypeScriptGenerator';
import { assureDir } from '../../helpers/fs-ultra';
import { cleanTestWorkspace, consoleLogTree, createTree, openFile, TEMPORARY_TEST_DIRECTORY } from '../utils';


suite('TypeScriptGenerator.generate', () => {
	beforeEach(() => {
		cleanTestWorkspace()
	})

	function assertFileExists(path: string) {
		assert.ok(existsSync(path), `Looking for: ${path}, folder structure was:\n${consoleLogTree(createTree(TEMPORARY_TEST_DIRECTORY))}`)
	}
	
	suite('one file, one export, no package.json', () => {
		beforeEach(async () => {
			await assureDir(join(TEMPORARY_TEST_DIRECTORY, "src"))
			writeFileSync(join(TEMPORARY_TEST_DIRECTORY, "src", "westeros.ts"), "export function jon() { return \"snow\" }")
		})
		
		suite(`${ConfigurationKeys.testLocation}: ${TestLocation.SameDirectoryNested}`, () => {
			before(async () => {
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testLocation, TestLocation.SameDirectoryNested)
			})
			
			test("should create a test file", async () => {
				await openFile(join("src", "westeros.ts"))
				await vscode.commands.executeCommand("testely.createTest")
				const testFileLocation = join(TEMPORARY_TEST_DIRECTORY, "src", "__tests__", "westeros.test.ts");
				assertFileExists(testFileLocation)
				assert.strictEqual(readFileSync(testFileLocation, "utf-8").trim(), "import { jon } from \"../westeros\"")
			})
		})
		
		suite(`${ConfigurationKeys.testLocation}: ${TestLocation.SameDirectory}`, () => {
			before(async () => {
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testLocation, TestLocation.SameDirectory)
			})
			
			// TODO the 2nd test fail, because the import is not correctly resolved at the moment
			test.skip("should create a test file", async () => {
				await openFile(join("src", "westeros.ts"))
				await vscode.commands.executeCommand("testely.createTest")
				const testFileLocation = join(TEMPORARY_TEST_DIRECTORY, "src", "westeros.test.ts");
				assertFileExists(testFileLocation)
				assert.strictEqual(readFileSync(testFileLocation, "utf-8").trim(), "import { jon } from \"./westeros\"")
			})
		})
		
		suite(`${ConfigurationKeys.testLocation}: ${TestLocation.RootTestFolderFlat}`, () => {
			before(async () => {
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testLocation, TestLocation.RootTestFolderFlat)
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testDirectoryName, "test")
			})
			
			test("should create a test file", async () => {
				await openFile(join("src", "westeros.ts"))
				await vscode.commands.executeCommand("testely.createTest")
				const testFileLocation = join(TEMPORARY_TEST_DIRECTORY, "test", "westeros.test.ts");
				assertFileExists(testFileLocation)
				assert.strictEqual(readFileSync(testFileLocation, "utf-8").trim(), "import { jon } from \"../src/westeros\"")
			})
		})

		suite(`${ConfigurationKeys.testLocation}: ${TestLocation.RootTestFolderNested}`, () => {
			before(async () => {
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testLocation, TestLocation.RootTestFolderNested)
				await vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY).update(ConfigurationKeys.testDirectoryName, "test")
			})

			test("should create a test file", async () => {
				await openFile(join("src", "westeros.ts"))
				await vscode.commands.executeCommand("testely.createTest")
				const testFileLocation = join(TEMPORARY_TEST_DIRECTORY, "test", "westeros.test.ts");
				assertFileExists(testFileLocation)
				assert.strictEqual(readFileSync(testFileLocation, "utf-8").trim(), "import { jon } from \"../src/westeros\"")
			})
		})
	})
})

suite('TypeScritpFileWriter.printImport', () => {
	test(`default import`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			default: "jon"
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import jon from "westeros"');
	});

	test(`no import`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import "westeros"');
	});

	test(`named import with empty string`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			named: ""
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import "westeros"');
	});

	test(`named import with empty array`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			named: []
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import "westeros"');
	});

	test(`named import string`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			named: "jon"
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import { jon } from "westeros"');
	});

	test(`named import array with one entry`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			named: ["jon"]
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import { jon } from "westeros"');
	});

	test(`named import array with two entries`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			named: ["jon", "daenerys"]
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import { jon, daenerys } from "westeros"');
	});

	test(`named import array with two entries and default`, () => {
		const testImport: TypeScriptImport = {
			from: "westeros",
			default: "littlefinger",
			named: ["jon", "daenerys"]
		};

		assert.strictEqual(TypeScriptFileWriter.printImport(testImport), 'import littlefinger, { jon, daenerys } from "westeros"');
	});
});
 