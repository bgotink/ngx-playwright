export * from "@playwright/test";

export {
	PlaywrightHarnessEnvironment,
	createEnvironment,
} from "@ngx-playwright/harness";

export {mixinFixtures, test} from "./fixtures.js";
export {createTest, mixinScreenFixtures} from "./factory.js";

/** @typedef {import('./args.js').NgxPlaywrightTestArgs} NgxPlaywrightTestArgs */
/** @typedef {import('./args.js').NgxPlaywrightTestOptions} NgxPlaywrightTestOptions */
/** @typedef {import('./args.js').PlaywrightTestConfig} PlaywrightTestConfig */
/**
 * @template {import('@angular/cdk/testing').ComponentHarness} C
 * @typedef {import('./args.js').NgxPlaywrightScreenTestArgs<C>} NgxPlaywrightScreenTestArgs
 */

/**
 * @template {import('@angular/cdk/testing').ComponentHarness} C
 * @typedef {import('./types.js').PlaywrightScreen<C>} PlaywrightScreen
 */
