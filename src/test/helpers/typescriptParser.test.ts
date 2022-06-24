import * as assert from 'assert';
import { writeFileSync } from 'fs';
import { beforeEach } from 'mocha';
import { join } from 'path';
import { SyntaxKind } from 'typescript';
import { File } from '../../generators/File';
import { assureDir } from '../../helpers/fs-ultra';
import { TypeScriptParser } from '../../helpers/typescriptParser';
import { cleanTestWorkspace, TEMPORARY_TEST_DIRECTORY } from '../utils';

suite('TypeScriptParser', () => {
	beforeEach(() => {
		cleanTestWorkspace()
	})

	suite('single  exported type in a single file', () => {
		const TEST_FILE_LOCATION = join(TEMPORARY_TEST_DIRECTORY, "src", "westeros.ts");
		const CONTENT = [
			"export type Jon = {", 
			"    name: string", 
			"}"
		].join("");

		beforeEach(async () => {
			await assureDir(join(TEMPORARY_TEST_DIRECTORY, "src"))
			await assureDir(join(TEMPORARY_TEST_DIRECTORY, ".vscode"))
			writeFileSync(TEST_FILE_LOCATION, CONTENT);
		});
		
		test(`should get the type with the property`, async () => {
			const file = new File(TEMPORARY_TEST_DIRECTORY)
			file.setExist(true)
			file.setContent(CONTENT)
			const result = await TypeScriptParser.getResolvedType(file, "Jon");
			assert.strictEqual(result, {
				properties: {
					name: {
						type: SyntaxKind.StringKeyword
					},
				},
				name: "Jon",
				exported: true
			})
		});
	});
});