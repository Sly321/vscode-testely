import * as assert from 'assert';
import { TextDocument } from 'vscode';
import { TypeScriptFileWriter, TypeScriptGenerator, TypeScriptImport } from '../../generators/implementations/TypeScriptGenerator';

import * as vscode from 'vscode';

suite('TypeScriptGenerator.generate', () => {
	suiteSetup(() => {
		console.log("asoidjkas")
		vscode.workspace.workspaceFolders?.forEach(() => {
			console.log("hello world")
		})
		console.log("p;jlopgklj")
	})

	test("heeeeeeeeeeeeeee", function () {
		assert.ok(true)
	})
	// vscode.
	// const sourceDocument: TextDocument = {

	// }
	// const generator = new TypeScriptGenerator()
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
 