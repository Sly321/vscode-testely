import * as assert from 'assert';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { before } from 'mocha';
import { tmpdir } from 'os';
import { join } from 'path';
import { getNearest } from '../../helpers/fs-ultra';

suite('getNearest(fileName: string, from: string)', () => {
	const tmpDir = join(tmpdir(), "vscode-testely-test-files");

	function cleanDir() {
		if (existsSync(tmpDir)) {
			rmSync(tmpDir, { recursive: true });
		}
	}

	suite('in the same directory', () => {
		before(() => {			
			cleanDir();
			mkdirSync(tmpDir);
			writeFileSync(join(tmpDir, "package.json"), "");
		});
		
		test(`should get the directory plus the fileName`, async () => {
			assert.strictEqual(await getNearest('package.json', join(tmpDir)), join(tmpDir, "package.json"));
		});
	});
	
	suite('in a lower directory', () => {
		before(() => {
			cleanDir();
			mkdirSync(tmpDir);
			writeFileSync(join(tmpDir, "package.json"), "");
			mkdirSync(join(tmpDir, "helloworld"));
		});
		
		test(`should get the filepath`, async () => {
			assert.strictEqual(await getNearest('package.json', join(tmpDir, "helloworld")), join(tmpDir, "package.json"));
		});
	});
	
	suite('in a sub lower directory', () => {
		before(() => {
			cleanDir();
			mkdirSync(tmpDir);
			mkdirSync(join(tmpDir, "helloworld"));
			writeFileSync(join(tmpDir, "helloworld", "package.json"), "");
			mkdirSync(join(tmpDir, "helloworld", "gracias"));
			mkdirSync(join(tmpDir, "helloworld", "gracias", "ola"));
		});
		
		test(`should get the filepath`, async () => {
			assert.strictEqual(await getNearest('package.json', join(tmpDir, "helloworld", "gracias", "ola")), join(tmpDir, "helloworld", "package.json"));
		});
	});
	
	suite('in a sub lower directory, the origin is a file', () => {
		before(() => {
			cleanDir();
			mkdirSync(tmpDir);
			mkdirSync(join(tmpDir, "helloworld"));
			writeFileSync(join(tmpDir, "helloworld", "package.json"), "");
			mkdirSync(join(tmpDir, "helloworld", "gracias"));
			mkdirSync(join(tmpDir, "helloworld", "gracias", "ola"));
			writeFileSync(join(tmpDir, "helloworld", "gracias", "ola", "myfile.json"), "");
		});
		
		test(`should get the filepath`, async () => {
			assert.strictEqual(await getNearest('package.json', join(tmpDir, "helloworld", "gracias", "ola", "myfile.json")), join(tmpDir, "helloworld", "package.json"));
		});
	});
	
	suite('file is not there', () => {
		before(() => {
			cleanDir();
			mkdirSync(tmpDir);
			mkdirSync(join(tmpDir, "helloworld"));
			mkdirSync(join(tmpDir, "helloworld", "gracias"));
			mkdirSync(join(tmpDir, "helloworld", "gracias", "ola"));
		});
		
		test(`should get null`, async () => {
			assert.strictEqual(await getNearest('package.json', join(tmpDir, "helloworld", "gracias", "ola")), null);
		});
	});
});

