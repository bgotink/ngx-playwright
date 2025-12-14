// @ts-check
// cspell:ignore lcovonly lcov

import {defineConfig} from "@ngx-playwright/test";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	use: {
		channel: "chrome",
		headless: true,
	},

	testDir: join(__dirname, "e2e/failing-specs"),
	testMatch: "**/*.e2e-spec.js",

	// Don't use the github reporter here, because we expect this test to fail!
	reporter: "list",
});
