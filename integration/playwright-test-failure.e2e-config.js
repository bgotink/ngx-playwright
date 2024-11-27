// @ts-check
// cspell:ignore lcovonly lcov

import {join, dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('../packages/test/src/index.js').PlaywrightTestConfig}
 */
const config = {
	use: {
		channel: "chrome",
		headless: true,
	},

	testDir: join(__dirname, "e2e/failing-specs"),
	testMatch: "**/*.e2e-spec.js",

	// Don't use the github reporter here, because we expect this test to fail!
	reporter: "list",
};

export default config;
