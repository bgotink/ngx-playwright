// Keep using any to ensure compatibility with Angular's interfaces
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import type {HarnessLoader} from "./harness-loader.js";
import type {HarnessQuery} from "./harness-predicate.js";
import type {
	AsyncFactoryFn,
	LocatorFactory,
	LocatorFnResult,
} from "./locator-factory.js";
import type {TestElement} from "./test-element.js";

/**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 */
export abstract class ComponentHarness implements AnyComponentHarness {
	protected readonly locatorFactory: LocatorFactory;

	constructor(locatorFactory: LocatorFactory);

	host(): Promise<TestElement>;

	/**
	 * Gets a `LocatorFactory` for the document root element. This factory can be used to create
	 * locators for elements that a component creates outside of its own root element. (e.g. by
	 * appending to document.body).
	 */
	protected documentRootLocatorFactory(): LocatorFactory;

	/**
	 * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
	 * or element under the host element of this `ComponentHarness`.
	 * @param queries A list of queries specifying which harnesses and elements to search for:
	 *   - A `string` searches for elements matching the CSS selector specified by the string.
	 *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
	 *     given class.
	 *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
	 *     predicate.
	 * @return An asynchronous locator function that searches for and returns a `Promise` for the
	 *   first element or harness matching the given search criteria. Matches are ordered first by
	 *   order in the DOM, and second by order in the queries list. If no matches are found, the
	 *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
	 *   each query.
	 *
	 * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
	 * `DivHarness.hostSelector === 'div'`:
	 * - `await ch.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
	 * - `await ch.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
	 * - `await ch.locatorFor('span')()` throws because the `Promise` rejects.
	 */
	protected locatorFor<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T>>;

	/**
	 * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
	 * or element under the host element of this `ComponentHarness`.
	 * @param queries A list of queries specifying which harnesses and elements to search for:
	 *   - A `string` searches for elements matching the CSS selector specified by the string.
	 *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
	 *     given class.
	 *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
	 *     predicate.
	 * @return An asynchronous locator function that searches for and returns a `Promise` for the
	 *   first element or harness matching the given search criteria. Matches are ordered first by
	 *   order in the DOM, and second by order in the queries list. If no matches are found, the
	 *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
	 *   result types for each query or null.
	 *
	 * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
	 * `DivHarness.hostSelector === 'div'`:
	 * - `await ch.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
	 * - `await ch.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
	 * - `await ch.locatorForOptional('span')()` gets `null`.
	 */
	protected locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T> | null>;

	/**
	 * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
	 * or elements under the host element of this `ComponentHarness`.
	 * @param queries A list of queries specifying which harnesses and elements to search for:
	 *   - A `string` searches for elements matching the CSS selector specified by the string.
	 *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
	 *     given class.
	 *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
	 *     predicate.
	 * @return An asynchronous locator function that searches for and returns a `Promise` for all
	 *   elements and harnesses matching the given search criteria. Matches are ordered first by
	 *   order in the DOM, and second by order in the queries list. If an element matches more than
	 *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
	 *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
	 *   for that element. The type that the `Promise` resolves to is an array where each element is
	 *   the union of all result types for each query.
	 *
	 * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
	 * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
	 * - `await ch.locatorForAll(DivHarness, 'div')()` gets `[
	 *     DivHarness, // for #d1
	 *     TestElement, // for #d1
	 *     DivHarness, // for #d2
	 *     TestElement // for #d2
	 *   ]`
	 * - `await ch.locatorForAll('div', '#d1')()` gets `[
	 *     TestElement, // for #d1
	 *     TestElement // for #d2
	 *   ]`
	 * - `await ch.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
	 *     DivHarness, // for #d1
	 *     IdIsD1Harness, // for #d1
	 *     DivHarness // for #d2
	 *   ]`
	 * - `await ch.locatorForAll('span')()` gets `[]`.
	 */
	protected locatorForAll<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T>[]>;
}

/**
 * Base class for component harnesses that authors should extend if they anticipate that consumers
 * of the harness may want to access other harnesses within the `<ng-content>` of the component.
 */
export abstract class ContentContainerComponentHarness<
		S extends string = string,
	>
	extends ComponentHarness
	implements HarnessLoader
{
	getChildLoader(selector: S): Promise<HarnessLoader>;

	getAllChildLoaders(selector: S): Promise<HarnessLoader[]>;

	getHarness<T extends AnyComponentHarness>(query: HarnessQuery<T>): Promise<T>;

	getHarnessOrNull<T extends AnyComponentHarness>(
		query: HarnessQuery<T>,
	): Promise<T | null>;

	getAllHarnesses<T extends AnyComponentHarness>(
		query: HarnessQuery<T>,
	): Promise<T[]>;

	hasHarness<T extends AnyComponentHarness>(
		query: HarnessQuery<T>,
	): Promise<boolean>;

	/**
	 * Gets the root harness loader from which to start
	 * searching for content contained by this harness.
	 */
	protected getRootHarnessLoader(): Promise<HarnessLoader>;
}

/**
 * A component harness parent interface that works both for both component
 * harnesses from this package and component harnesses defined via `@angular/cdk/testing`
 */
export interface AnyComponentHarness {
	/** Gets a `Promise` for the `TestElement` representing the host element of the component. */
	host(): Promise<TestElement>;
}

/** Constructor for a ComponentHarness subclass. */
export interface ComponentHarnessConstructor<T extends AnyComponentHarness> {
	new (locatorFactory: LocatorFactory): T;

	/**
	 * `ComponentHarness` subclasses must specify a static `hostSelector` property that is used to
	 * find the host element for the corresponding component. This property should match the selector
	 * for the Angular component.
	 */
	hostSelector: string;
}
