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

export interface PlaywrightOpenableHarnessWithPath<
	T extends AnyComponentHarness,
> extends ComponentHarnessConstructor<T> {
	readonly path: string;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface PlaywrightOpenableHarnessWithOpenFunction<
	T extends AnyComponentHarness,
> extends ComponentHarnessConstructor<T> {
	open(
		page: Page,
		baseUrl: string,
		opener: PlaywrightHarnessOpener,
	): Promise<void>;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface PlaywrightOpenableHarnessWithIsOpenFunction<
	T extends AnyComponentHarness,
> extends ComponentHarnessConstructor<T> {
	isOpen(page: Page, baseUrl: string): Promise<boolean>;
}

type AngularComponentHarness =
	true extends _AngularComponentHarness ? never : _AngularComponentHarness;
type AngularComponentHarnessConstructor<T extends AngularComponentHarness> =
	true extends _AngularComponentHarnessConstructor<T> ? never
	:	_AngularComponentHarnessConstructor<T>;

export interface CdkPlaywrightOpenableHarnessWithPath<
	T extends AngularComponentHarness,
> extends AngularComponentHarnessConstructor<T> {
	readonly path: string;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface CdkPlaywrightOpenableHarnessWithOpenFunction<
	T extends AngularComponentHarness,
> extends AngularComponentHarnessConstructor<T> {
	open(
		page: Page,
		baseUrl: string,
		opener: PlaywrightHarnessOpener,
	): Promise<void>;

	isOpen?(page: Page, baseUrl: string): Promise<boolean>;
}

export interface CdkPlaywrightOpenableHarnessWithIsOpenFunction<
	T extends AngularComponentHarness,
> extends AngularComponentHarnessConstructor<T> {
	isOpen(page: Page, baseUrl: string): Promise<boolean>;
}

export type PlaywrightOpenableHarness<T extends AnyComponentHarness> =
	| PlaywrightOpenableHarnessWithOpenFunction<T>
	| PlaywrightOpenableHarnessWithPath<T>
	| PlaywrightOpenableHarnessWithIsOpenFunction<T>
	| CdkPlaywrightOpenableHarnessWithOpenFunction<T & AngularComponentHarness>
	| CdkPlaywrightOpenableHarnessWithPath<T & AngularComponentHarness>
	| CdkPlaywrightOpenableHarnessWithIsOpenFunction<T & AngularComponentHarness>;

export interface PlaywrightHarnessOpener {
	<T extends AnyComponentHarness>(
		harness: PlaywrightOpenableHarness<T>,
	): Promise<T>;
}

export interface InHarnessFn {
	/**
	 * [experimental] Open the given harness and execute the given function
	 *
	 * @param page Page to open the harness in
	 * @param harness The harness to open
	 * @param fn Function to execute once the given harness is opened
	 */
	<T extends AnyComponentHarness>(
		page: Page,
		harness: PlaywrightOpenableHarness<T>,
		fn: (
			props: ExtractablePropertiesOfHarness<T>,
			harness: T,
		) => void | Promise<void>,
	): Promise<void>;

	/**
	 * [experimental] Open the given harness and execute the given function
	 *
	 * @param harness The harness to open
	 * @param fn Function to execute once the given harness is opened
	 */
	<T extends AnyComponentHarness>(
		harness: PlaywrightOpenableHarness<T>,
		fn: (
			props: ExtractablePropertiesOfHarness<T>,
			harness: T,
		) => void | Promise<void>,
	): Promise<void>;
}

export type ExtractablePropertyNamesOfHarness<T extends AnyComponentHarness> = {
	[K in keyof T]: T[K] extends AsyncFactoryFn<unknown> ? K : never;
}[keyof T];

export type ExtractablePropertiesOfHarness<T extends AnyComponentHarness> = {
	[K in ExtractablePropertyNamesOfHarness<T>]: T[K] extends (
		AsyncFactoryFn<infer P>
	) ?
		P
	:	never;
};
