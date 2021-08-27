import * as assert from 'assert';
import { addTestToFileName } from '../../helpers/fs-ultra';

suite('addTestToFileName(fileName: string)', () => {
	test(`fileName: 'jonsnow.ts'`, () => {
		assert.strictEqual(addTestToFileName('jonsnow.ts'), 'jonsnow.test.ts');
	});

	test(`fileName: 'a.ts'`, () => {
		assert.strictEqual(addTestToFileName('a.ts'), 'a.test.ts');
	});

	test(`fileName: 'a.ts.asdf.ts'`, () => {
		assert.strictEqual(addTestToFileName('a.ts.asdf.ts'), 'a.ts.asdf.test.ts');
	});
});

