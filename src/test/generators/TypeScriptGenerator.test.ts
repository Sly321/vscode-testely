import * as assert from 'assert';
import { TypeScriptFileWriter, TypeScriptImport } from '../../generators/implementations/TypeScriptGenerator';

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
 