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

	projects: [
		{
			name: "using ElementHandle",
			testDir: join(__dirname, "e2e/test-specs"),
			testMatch: "**/*.e2e-spec.js",
			use: {
				useLocators: false,
			},
		},
		{
			name: "using Locator",
			testDir: join(__dirname, "e2e/test-specs"),
			testMatch: "**/*.e2e-spec.js",
			use: {
				useLocators: true,
			},
		},
		{
			name: "selector engine",
			testDir: join(__dirname, "e2e/selector-specs"),
			testMatch: "**/*.spec.js",
		},
		{
			name: "innerHTML",
			testDir: join(__dirname, "e2e/inner-html-specs"),
			testMatch: "**/*.spec.js",
		},
	],

	reporter: [
		.../** @type {import("@ngx-playwright/test").ReporterDescription[]} */ (
			process.env.CI ? [["github"], ["dot"]] : [["list"]]
		),
		["junit", {outputFile: join(__dirname, "test-results/junit.xml")}],

		[
			"@bgotink/playwright-coverage",
			{
				resultDir: join(__dirname, "test-results/e2e-coverage"),
				sourceRoot: join(__dirname, ".."),
				exclude: ["**/$_lazy_route_resources*", "**/client"],
				reports:
					process.env.CI ?
						[["text-summary"], ["text-summary", {file: "summary.txt"}]]
					:	[
							// Create an HTML view at <resultDir>/index.html
							["html"],
							// Create <resultDir>/coverage.lcov for consumption by tooling
							["lcovonly", {file: "coverage.lcov"}],
							// Log a coverage summary at the end of the test run
							["text-summary"],
						],
			},
		],
	],
});
