import {PlaywrightTestConfig} from "./args.js";

export * from "@playwright/test";
export * from "@ngx-playwright/harness";

export {
	PlaywrightHarnessEnvironment,
	createEnvironment,
} from "./harness/index.js";

export {mixinFixtures, test} from "./fixtures.js";
export {createTest, mixinScreenFixtures} from "./factory.js";

export type {
	NgxPlaywrightTestArgs,
	NgxPlaywrightTestOptions,
	NgxPlaywrightTestWorkerArgs,
	PlaywrightTestConfig,
} from "./args.js";
export type {NgxPlaywrightScreenTestArgs} from "./args.js";
export type {PlaywrightScreen} from "./types.js";

export function defineConfig(
	config: PlaywrightTestConfig,
): PlaywrightTestConfig;
export function defineConfig<T>(
	config: PlaywrightTestConfig<T>,
): PlaywrightTestConfig<T>;
export function defineConfig<T, W>(
	config: PlaywrightTestConfig<T, W>,
): PlaywrightTestConfig<T, W>;
export function defineConfig(
	config: PlaywrightTestConfig,
	...configs: PlaywrightTestConfig[]
): PlaywrightTestConfig;
export function defineConfig<T>(
	config: PlaywrightTestConfig<T>,
	...configs: PlaywrightTestConfig<T>[]
): PlaywrightTestConfig<T>;
export function defineConfig<T, W>(
	config: PlaywrightTestConfig<T, W>,
	...configs: PlaywrightTestConfig<T, W>[]
): PlaywrightTestConfig<T, W>;
