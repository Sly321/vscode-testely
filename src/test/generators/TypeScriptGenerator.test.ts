import * as assert from 'assert';
import { TextDocument } from 'vscode';
import { TypeScriptFileWriter, TypeScriptGenerator, TypeScriptImport } from '../../generators/implementations/TypeScriptGenerator';

import * as vscode from 'vscode';
import { cleanTestWorkspace, TEMPORARY_TEST_DIRECTORY } from '../utils';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { assureDir } from '../../helpers/fs-ultra';

suite('TypeScriptGenerator.generate', () => {
	suiteSetup(() => {
		console.log("1")
		cleanTestWorkspace()
	})
	
	suite('Test with only one ts file, not package json', () => {
		suiteSetup(() => {
			console.log("2")
			cleanTestWorkspace()

			writeFileSync(join(TEMPORARY_TEST_DIRECTORY, "westeros.ts"), "export function jon() { return \"snow\" }")
		})

		test("should create a test file for that file", () => {
			vscode.workspace.openTextDocument("westeros.ts")
			assert.ok(true)
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
 