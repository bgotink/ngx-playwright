// Keep using any to ensure compatibility with Angular's interfaces
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
	HarnessQuery as _AngularHarnessQuery,
	ComponentHarness as AngularComponentHarness,
} from "@angular/cdk/testing";

import type {HarnessLoader} from "./harness-loader.js";
import type {HarnessQuery} from "./harness-predicate.js";
import type {TestElement} from "./test-element.js";

/** An async function that returns a promise when called. */
export type AsyncFactoryFn<T> = () => Promise<T>;

type AngularHarnessQuery<T extends AngularComponentHarness> =
	true extends _AngularHarnessQuery<T> ? never : _AngularHarnessQuery<T>;

/**
 * The result type obtained when searching using a particular list of queries. This type depends on
 * the particular items being queried.
 * - If one of the queries is for a `ComponentHarnessConstructor<C1>`, it means that the result
 *   might be a harness of type `C1`
 * - If one of the queries is for a `HarnessPredicate<C2>`, it means that the result might be a
 *   harness of type `C2`
 * - If one of the queries is for a `string`, it means that the result might be a `TestElement`.
 *
 * Since we don't know for sure which query will match, the result type if the union of the types
 * for all possible results.
 *
 * e.g.
 * The type:
 * `LocatorFnResult&lt;[
 *   ComponentHarnessConstructor&lt;MyHarness&gt;,
 *   HarnessPredicate&lt;MyOtherHarness&gt;,
 *   string
 * ]&gt;`
 * is equivalent to:
 * `MyHarness | MyOtherHarness | TestElement`.
 */
export type LocatorFnResult<
	T extends readonly (HarnessQuery<any> | AngularHarnessQuery<any> | string)[],
> = {
	[I in keyof T]: T[I] extends (
		new (...args: any[]) => infer C // Map `ComponentHarnessConstructor<C>` to `C`.
	) ?
		C
	: // Map `HarnessPredicate<C>` to `C`.
	T[I] extends {harnessType: new (...args: any[]) => infer C} ? C
	: // Map `string` to `TestElement`.
	T[I] extends string ? TestElement
	: // Map everything else to `never` (should not happen due to the type constraint on `T`).
		never;
}[number];

/**
 * Interface used to create asynchronous locator functions used find elements and component
 * harnesses. This interface is used by `ComponentHarness` authors to create locator functions for
 * their `ComponentHarness` subclass.
 */
export interface LocatorFactory {
	/** Gets a locator factory rooted at the document root. */
	documentRootLocatorFactory(): LocatorFactory;

	/** The root element of this `LocatorFactory` as a `TestElement`. */
	rootElement: TestElement;

	/**
	 * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
	 * or element under the root element of this `LocatorFactory`.
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
	 * - `await lf.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
	 * - `await lf.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
	 * - `await lf.locatorFor('span')()` throws because the `Promise` rejects.
	 */
	locatorFor<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T>>;

	/**
	 * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
	 * or element under the root element of this `LocatorFactory`.
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
	 * - `await lf.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
	 * - `await lf.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
	 * - `await lf.locatorForOptional('span')()` gets `null`.
	 */
	locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T> | null>;

	/**
	 * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
	 * or elements under the root element of this `LocatorFactory`.
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
	 * - `await lf.locatorForAll(DivHarness, 'div')()` gets `[
	 *     DivHarness, // for #d1
	 *     TestElement, // for #d1
	 *     DivHarness, // for #d2
	 *     TestElement // for #d2
	 *   ]`
	 * - `await lf.locatorForAll('div', '#d1')()` gets `[
	 *     TestElement, // for #d1
	 *     TestElement // for #d2
	 *   ]`
	 * - `await lf.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
	 *     DivHarness, // for #d1
	 *     IdIsD1Harness, // for #d1
	 *     DivHarness // for #d2
	 *   ]`
	 * - `await lf.locatorForAll('span')()` gets `[]`.
	 */
	locatorForAll<T extends (HarnessQuery<any> | string)[]>(
		...queries: T
	): AsyncFactoryFn<LocatorFnResult<T>[]>;

	/** @return A `HarnessLoader` rooted at the root element of this `LocatorFactory`. */
	rootHarnessLoader(): Promise<HarnessLoader>;

	/**
	 * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`.
	 * @param selector The selector for the root element.
	 * @return A `HarnessLoader` rooted at the first element matching the given selector.
	 * @throws If no matching element is found for the given selector.
	 */
	harnessLoaderFor(selector: string): Promise<HarnessLoader>;

	/**
	 * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`
	 * @param selector The selector for the root element.
	 * @return A `HarnessLoader` rooted at the first element matching the given selector, or null if
	 *     no matching element is found.
	 */
	harnessLoaderForOptional(selector: string): Promise<HarnessLoader | null>;

	/**
	 * Gets a list of `HarnessLoader` instances, one for each matching element.
	 * @param selector The selector for the root element.
	 * @return A list of `HarnessLoader`, one rooted at each element matching the given selector.
	 */
	harnessLoaderForAll(selector: string): Promise<HarnessLoader[]>;

	/**
	 * @deprecated Only added for compatibility with @angular/cdk/testing
	 */
	forceStabilize(): Promise<void>;

	/**
	 * @deprecated Only added for compatibility with @angular/cdk/testing
	 */
	waitForTasksOutsideAngular(): Promise<void>;
}
