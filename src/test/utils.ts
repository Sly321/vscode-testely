import { existsSync, readdirSync, rmSync } from "fs";
import { join, resolve } from "path";

export const TEMPORARY_TEST_DIRECTORY = resolve(__dirname, "..", "..", "test-resources", "workspace");

export function cleanTestWorkspace() {
	if (existsSync(TEMPORARY_TEST_DIRECTORY)) {
		const filesOrDirectories = readdirSync(TEMPORARY_TEST_DIRECTORY)
		filesOrDirectories.forEach(fileOrDirectory => {
			rmSync(join(TEMPORARY_TEST_DIRECTORY, fileOrDirectory), { recursive: true });
		})
	}
}