import {
	ComponentHarnessConstructor as _AngularComponentHarnessConstructor,
	ComponentHarness as _AngularComponentHarness,
} from "@angular/cdk/testing";
import {
	AnyComponentHarness,
	AsyncFactoryFn,
	ComponentHarnessConstructor,
} from "@ngx-playwright/harness";
import {Page} from "@playwright/test";

export interface PlaywrightScreenWithPath<T extends AnyComponentHarness>
	extends ComponentHarnessConstructor<T> {
	readonly path: string;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface PlaywrightScreenWithOpenFunction<T extends AnyComponentHarness>
	extends ComponentHarnessConstructor<T> {
	open(
		page: Page,
		baseUrl: string,
		opener: PlaywrightScreenOpener,
	): Promise<void>;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface PlaywrightScreenWithIsOpenFunction<
	T extends AnyComponentHarness,
> extends ComponentHarnessConstructor<T> {
	isOpen(page: Page, baseUrl: string): Promise<boolean>;
}

type AngularComponentHarness =
	true extends _AngularComponentHarness ? never : _AngularComponentHarness;
type AngularComponentHarnessConstructor<T extends AngularComponentHarness> =
	true extends _AngularComponentHarnessConstructor<T> ? never
	:	_AngularComponentHarnessConstructor<T>;

export interface CdkPlaywrightScreenWithPath<T extends AngularComponentHarness>
	extends AngularComponentHarnessConstructor<T> {
	readonly path: string;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface CdkPlaywrightScreenWithOpenFunction<
	T extends AngularComponentHarness,
> extends AngularComponentHarnessConstructor<T> {
	open(
		page: Page,
		baseUrl: string,
		opener: PlaywrightScreenOpener,
	): Promise<void>;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface CdkPlaywrightScreenWithIsOpenFunction<
	T extends AngularComponentHarness,
> extends AngularComponentHarnessConstructor<T> {
	isOpen(page: Page, baseUrl: string): Promise<boolean>;
}

export type PlaywrightScreen<T extends AnyComponentHarness> =
	| PlaywrightScreenWithOpenFunction<T>
	| PlaywrightScreenWithPath<T>
	| PlaywrightScreenWithIsOpenFunction<T>
	| CdkPlaywrightScreenWithOpenFunction<T & AngularComponentHarness>
	| CdkPlaywrightScreenWithPath<T & AngularComponentHarness>
	| CdkPlaywrightScreenWithIsOpenFunction<T & AngularComponentHarness>;

export interface PlaywrightScreenOpener {
	<T extends AnyComponentHarness>(
		screen:
			| PlaywrightScreen<T>
			| CdkPlaywrightScreen<T & AngularComponentHarness>,
	): Promise<T>;
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
