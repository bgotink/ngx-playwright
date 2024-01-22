import {
	AnyComponentHarness,
	AsyncFactoryFn,
	ComponentHarnessConstructor,
} from "@ngx-playwright/harness";
import {Page} from "@playwright/test";

export interface PlaywrightScreenWithPath<T extends AnyComponentHarness>
	extends ComponentHarnessConstructor<T> {
	readonly path: string;
}

export interface PlaywrightScreenWithOpenFunction<T extends AnyComponentHarness>
	extends ComponentHarnessConstructor<T> {
	open(
		page: Page,
		baseUrl: string,
		opener: PlaywrightScreenOpener,
	): Promise<void>;
}

export type PlaywrightScreen<T extends AnyComponentHarness> =
	| PlaywrightScreenWithOpenFunction<T>
	| PlaywrightScreenWithPath<T>;

export interface PlaywrightScreenOpener {
	<T extends AnyComponentHarness>(screen: PlaywrightScreen<T>): Promise<T>;
}

export interface InScreenFn {
	/**
	 * [experimental] Open the given screen and execute the given function
	 *
	 * @param page Page to open the screen in
	 * @param screen The screen to open
	 * @param fn Function to execute once the given screen is opened
	 */
	<T extends AnyComponentHarness>(
		page: Page,
		screen: PlaywrightScreen<T>,
		fn: (
			props: ExtractablePropertiesOfScreen<T>,
			screen: T,
		) => void | Promise<void>,
	): Promise<void>;

	/**
	 * [experimental] Open the given screen and execute the given function
	 *
	 * @param screen The screen to open
	 * @param fn Function to execute once the given screen is opened
	 */
	<T extends AnyComponentHarness>(
		screen: PlaywrightScreen<T>,
		fn: (
			props: ExtractablePropertiesOfScreen<T>,
			screen: T,
		) => void | Promise<void>,
	): Promise<void>;
}

export type ExtractablePropertyNamesOfScreen<T extends AnyComponentHarness> = {
	[K in keyof T]: T[K] extends AsyncFactoryFn<unknown> ? K : never;
}[keyof T];

export type ExtractablePropertiesOfScreen<T extends AnyComponentHarness> = {
	// Once updated to angular 12 (typescript 4.2) replace the intermediary type with
	// [K in ExtractablePropertyNamesOfScreen<T> as T[K] extends AsyncFactoryFn<unknown> ? K : never]
	[K in ExtractablePropertyNamesOfScreen<T>]: T[K] extends (
		AsyncFactoryFn<infer P>
	) ?
		P
	:	never;
};
