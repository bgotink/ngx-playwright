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

	reporter: process.env.CI ? "github" : "list",
};

export default config;
