import {HarnessPredicate, parallel} from "@ngx-playwright/harness";

import {isAngularBootstrapped, waitUntilAngularStable} from "./browser.js";
import {shouldStabilizeAutomatically} from "./change-detection.js";
import {isLocator, PlaywrightElement} from "./element.js";
import {waitUntilRootZoneStable} from "./zone/browser.js";

/**
 * @type {WeakMap<import('@ngx-playwright/harness').TestElement, import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator>}
 */
const elementHandles = new WeakMap();

/** @typedef {import("@ngx-playwright/harness").HarnessEnvironment} _HE */

/**
 * @implements {_HE}
 */
export class PlaywrightHarnessEnvironment {
	/**
	 * @readonly
	 * @type {import('@playwright/test').Page}
	 */
	#page;

	/**
	 * @readonly
	 * @type {import('@playwright/test').Locator}
	 */
	#documentRoot;

	/**
	 * @readonly
	 * @type {Required<import('./types.js').PlaywrightHarnessEnvironmentOptions>}
	 */
	#opts;

	/**
	 * @readonly
	 * @type {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator}
	 */
	#rawRootElement;

	/**
	 * @internal
	 * @param {import('@playwright/test').Page} page
	 * @param {Readonly<import('./types.js').PlaywrightHarnessEnvironmentOptions>=} options
	 * @param {import('@playwright/test').Locator=} documentRoot
	 * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator=} element
	 */
	constructor(
		page,
		{respectShadowBoundaries = false, useLocators = false} = {},
		documentRoot = page.locator(":root"),
		element = documentRoot,
	) {
		this.#rawRootElement = element;
		this.#page = page;
		this.#documentRoot = documentRoot;
		this.#opts = {
			respectShadowBoundaries,
			useLocators,
		};
	}

	/**
	 * If true, all query selectors respect shadowroots
	 *
	 * By default, shadow boundaries are pierced by all queries.
	 */
	get respectShadowBoundaries() {
		return this.#opts.respectShadowBoundaries;
	}

	/**
	 * Wait until the angular app is bootstrapped and stable
	 *
	 * This does more than {@link #forceStabilize}, which only waits for stability.
	 */
	async waitForAngularReady() {
		try {
			await this.#page.waitForFunction(isAngularBootstrapped);
		} catch {
			throw new Error(
				"Angular failed to bootstrap the application, check whether there are any errors in the console when you open the application",
			);
		}

		await this.forceStabilize();
	}

	/**
	 * Returns the playwright handle for the given element
	 *
	 * @param {import('@ngx-playwright/harness').TestElement} element A TestElement created by this environment
	 * @returns {Promise<import('@playwright/test').ElementHandle<HTMLElement | SVGElement>>} The playwright ElementHandle underpinning the given TestElement
	 * @throws If the given element wasn't created by a playwright environment
	 */
	async getPlaywrightHandle(element) {
		const handleOrLocator = elementHandles.get(element);

		if (handleOrLocator == null) {
			throw new Error(
				"The given TestElement was not created by PlaywrightHarnessEnvironment",
			);
		}

		if (isLocator(handleOrLocator)) {
			// Only one case where we are passed a Locator: the root element of the page, which is always
			// present -> we can safely ignore the null return type
			return /** @type {import('@playwright/test').ElementHandle<HTMLElement | SVGElement>} */ (
				await handleOrLocator.elementHandle()
			);
		} else {
			return handleOrLocator;
		}
	}

	/**
	 * Returns the playwright locator for the given element
	 *
	 * @param {import('@angular/cdk/testing').TestElement} element A TestElement created by this environment
	 * @returns {import('@playwright/test').Locator} The playwright ElementHandle underpinning the given TestElement
	 * @throws If the given element wasn't created by a playwright environment,
	 *         or if this playwright environment isn't configured to use locators
	 */
	getPlaywrightLocator(element) {
		const handleOrLocator = elementHandles.get(element);

		if (handleOrLocator == null) {
			throw new Error(
				"The given TestElement was not created by PlaywrightHarnessEnvironment",
			);
		}

		if (!isLocator(handleOrLocator)) {
			throw new Error(
				"This PlaywrightHarnessEnvironment is not configured to use locators",
			);
		}

		return handleOrLocator;
	}

	/**
	 * Create a copy of the current environment with the given options
	 *
	 * @param {import('./types.js').PlaywrightHarnessEnvironmentOptions} options
	 * @returns {PlaywrightHarnessEnvironment}
	 */
	withOptions(options) {
		return new PlaywrightHarnessEnvironment(
			this.#page,
			{
				...this.#opts,
				...options,
			},
			this.#documentRoot,
			this.#rawRootElement,
		);
	}

	// HarnessEnvironment API:
	//

	// HarnessLoader API

	/**
	 * @param {string} selector
	 * @returns {Promise<import("@ngx-playwright/harness").HarnessLoader>}
	 */
	async getChildLoader(selector) {
		return this.#createEnvironment(
			await _assertResultFound(this.#getAllRawElements(selector), [
				_getDescriptionForHarnessLoaderQuery(selector),
			]),
		);
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<import("@ngx-playwright/harness").HarnessLoader[]>}
	 */
	async getAllChildLoaders(selector) {
		return (await this.#getAllRawElements(selector)).map((e) =>
			this.#createEnvironment(e),
		);
	}

	/**
	 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
	 * @param {import("@ngx-playwright/harness").HarnessQuery<T>} query
	 * @returns {Promise<T>}
	 */
	async getHarness(query) {
		return this.locatorFor(query)();
	}

	/**
	 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
	 * @param {import("@ngx-playwright/harness").HarnessQuery<T>} query
	 * @returns {Promise<T | null>}
	 */
	async getHarnessOrNull(query) {
		return this.locatorForOptional(query)();
	}

	/**
	 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
	 * @param {import("@ngx-playwright/harness").HarnessQuery<T>} query
	 * @returns {Promise<T[]>}
	 */
	async getAllHarnesses(query) {
		return this.locatorForAll(query)();
	}

	/**
	 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
	 * @param {import("@ngx-playwright/harness").HarnessQuery<T>} query
	 * @returns {Promise<boolean>}
	 */
	async hasHarness(query) {
		return (await this.locatorForOptional(query)()) !== null;
	}

	// LocatorFactory API

	/** @returns {import("@ngx-playwright/harness").LocatorFactory} */
	documentRootLocatorFactory() {
		return this.#createEnvironment(this.#documentRoot);
	}

	/** @type {import("@ngx-playwright/harness").TestElement=} */
	#rootElement;

	/** @returns {import("@ngx-playwright/harness").TestElement} */
	get rootElement() {
		return (this.#rootElement ??= this.#createTestElement(
			this.#rawRootElement,
		));
	}

	set rootElement(rootElement) {
		this.#rootElement = rootElement;
	}

	/**
	 * @template {(import("@ngx-playwright/harness").HarnessQuery<any> | string)[]} T
	 * @param  {T} queries
	 * @returns {import("@ngx-playwright/harness").AsyncFactoryFn<import("@ngx-playwright/harness").LocatorFnResult<T>>}
	 */
	locatorFor(...queries) {
		return () =>
			_assertResultFound(
				this.#getAllHarnessesAndTestElements(queries),
				_getDescriptionForLocatorForQueries(queries),
			);
	}

	/**
	 * @template {(import("@ngx-playwright/harness").HarnessQuery<any> | string)[]} T
	 * @param  {T} queries
	 * @returns {import("@ngx-playwright/harness").AsyncFactoryFn<import("@ngx-playwright/harness").LocatorFnResult<T> | null>}
	 */
	locatorForOptional(...queries) {
		return async () =>
			(await this.#getAllHarnessesAndTestElements(queries))[0] || null;
	}

	/**
	 * @template {(import("@ngx-playwright/harness").HarnessQuery<any> | string)[]} T
	 * @param  {T} queries
	 * @returns {import("@ngx-playwright/harness").AsyncFactoryFn<import("@ngx-playwright/harness").LocatorFnResult<T>[]>}
	 */
	locatorForAll(...queries) {
		return () => this.#getAllHarnessesAndTestElements(queries);
	}

	/** @returns {Promise<import("@ngx-playwright/harness").HarnessLoader>} */
	async rootHarnessLoader() {
		return this;
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<import("@ngx-playwright/harness").HarnessLoader>}
	 */
	async harnessLoaderFor(selector) {
		return this.#createEnvironment(
			await _assertResultFound(this.#getAllRawElements(selector), [
				_getDescriptionForHarnessLoaderQuery(selector),
			]),
		);
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<import("@ngx-playwright/harness").HarnessLoader | null>}
	 */
	async harnessLoaderForOptional(selector) {
		const elements = await this.#getAllRawElements(selector);
		return elements[0] ? this.#createEnvironment(elements[0]) : null;
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<import("@ngx-playwright/harness").HarnessLoader[]>}
	 */
	async harnessLoaderForAll(selector) {
		return (await this.#getAllRawElements(selector)).map((element) =>
			this.#createEnvironment(element),
		);
	}

	// Angular's LocatorFactory API

	/**
	 * Flushes change detection and async tasks captured in the Angular zone.
	 * In most cases it should not be necessary to call this manually. However, there may be some edge
	 * cases where it is needed to fully flush animation events.
	 */
	async forceStabilize() {
		await this.#page.evaluate(waitUntilAngularStable);
	}

	/**
	 * Waits for all scheduled or running async tasks to complete. This allows harness
	 * authors to wait for async tasks outside of the Angular zone.
	 */
	async waitForTasksOutsideAngular() {
		await this.#page.evaluate(waitUntilRootZoneStable);
	}

	// Helpers

	/**
	 * @template {(import("@ngx-playwright/harness").HarnessQuery<any> | string)[]} T
	 * @param {T} queries
	 * @returns {Promise<import("@ngx-playwright/harness").LocatorFnResult<T>[]>}
	 */
	async #getAllHarnessesAndTestElements(queries) {
		if (!queries.length) {
			throw Error(
				"CDK Component harness query must contain at least one element.",
			);
		}

		const {allQueries, harnessQueries, elementQueries, harnessTypes} =
			_parseQueries(queries);

		// Combine all of the queries into one large comma-delimited selector and use it to get all raw
		// elements matching any of the individual queries.
		const rawElements = await this.#getAllRawElements(
			[
				...elementQueries,
				...harnessQueries.map((predicate) => predicate.getSelector()),
			].join(","),
		);

		// If every query is searching for the same harness subclass, we know every result corresponds
		// to an instance of that subclass. Likewise, if every query is for a `TestElement`, we know
		// every result corresponds to a `TestElement`. Otherwise we need to verify which result was
		// found by which selector so it can be matched to the appropriate instance.
		const skipSelectorCheck =
			(elementQueries.length === 0 && harnessTypes.size === 1) ||
			harnessQueries.length === 0;

		const perElementMatches = await parallel(() =>
			rawElements.map(async (rawElement) => {
				const testElement = this.#createTestElement(rawElement);
				const allResultsForElement = await parallel(
					// For each query, get `null` if it doesn't match, or a `TestElement` or
					// `ComponentHarness` as appropriate if it does match. This gives us everything that
					// matches the current raw element, but it may contain duplicate entries (e.g.
					// multiple `TestElement` or multiple `ComponentHarness` of the same type).
					() =>
						allQueries.map((query) =>
							this.#getQueryResultForElement(
								query,
								rawElement,
								testElement,
								skipSelectorCheck,
							),
						),
				);
				return _removeDuplicateQueryResults(allResultsForElement);
			}),
		);
		return /** @type {import("@ngx-playwright/harness").LocatorFnResult<T>[]} */ (
			perElementMatches.flat()
		);
	}

	/**
	 * @template {import("@ngx-playwright/harness").AnyComponentHarness} T
	 * @param {string | HarnessPredicate<T>} query
	 * @param {import("@playwright/test").ElementHandle<HTMLElement | SVGElement> | import("@playwright/test").Locator} rawElement
	 * @param {import("@ngx-playwright/harness").TestElement} testElement
	 * @param {boolean=} skipSelectorCheck
	 * @returns {Promise<T | import("@ngx-playwright/harness").TestElement | null>}
	 */
	async #getQueryResultForElement(
		query,
		rawElement,
		testElement,
		skipSelectorCheck = false,
	) {
		if (typeof query === "string") {
			return skipSelectorCheck || (await testElement.matchesSelector(query)) ?
					testElement
				:	null;
		}
		if (
			skipSelectorCheck ||
			(await testElement.matchesSelector(query.getSelector()))
		) {
			const harness = new query.harnessType(
				this.#createEnvironment(rawElement),
			);
			return (await query.evaluate(harness)) ? harness : null;
		}
		return null;
	}

	/**
	 * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator} handle
	 * @returns {import('@ngx-playwright/harness').TestElement}
	 */
	#createTestElement(handle) {
		// This function is called in the HarnessEnvironment constructor, so we
		// can't directly use private properties here due to the polyfill in tslib
		const element = new PlaywrightElement(
			() => this.#page,
			handle,
			async () => {
				if (shouldStabilizeAutomatically()) {
					await this.forceStabilize();
				}
			},
		);

		elementHandles.set(element, handle);

		return element;
	}

	/**
	 * @param {import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator} element
	 * @returns {PlaywrightHarnessEnvironment}
	 */
	#createEnvironment(element) {
		return new PlaywrightHarnessEnvironment(
			this.#page,
			this.#opts,
			this.#documentRoot,
			element,
		);
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<(import('@playwright/test').ElementHandle<HTMLElement | SVGElement> | import('@playwright/test').Locator)[]>}
	 */
	async #getAllRawElements(selector) {
		if (!isLocator(this.#rawRootElement)) {
			return await this.#rawRootElement.$$(
				this.#opts.respectShadowBoundaries ?
					`css:light=${selector}`
				:	`css=${selector}`,
			);
		} else {
			const locator = this.#rawRootElement.locator(
				this.#opts.respectShadowBoundaries ?
					`css:light=${selector}`
				:	`css=${selector}`,
			);

			if (this.#opts.useLocators) {
				return Array.from({length: await locator.count()}, (_, i) =>
					locator.nth(i),
				);
			}

			return /** @type {import('@playwright/test').ElementHandle<HTMLElement | SVGElement>[]} */ (
				await locator.elementHandles()
			);
		}
	}
}

/**
 * Parses a list of queries in the format accepted by the `locatorFor*` methods into an easier to
 * work with format.
 *
 * @template {(import("@ngx-playwright/harness").HarnessQuery<any> | string)[]} T
 * @param {T} queries
 * @returns {import("./types.js").ParsedQueries<import("@ngx-playwright/harness").LocatorFnResult<T> & import("@ngx-playwright/harness").AnyComponentHarness>}
 */
function _parseQueries(queries) {
	const allQueries = [];
	const harnessQueries = [];
	const elementQueries = [];
	/** @type {Set<import("@ngx-playwright/harness").ComponentHarnessConstructor<import("@ngx-playwright/harness").LocatorFnResult<T> & import("@ngx-playwright/harness").AnyComponentHarness>>} */
	const harnessTypes = new Set();

	for (const query of queries) {
		if (typeof query === "string") {
			allQueries.push(query);
			elementQueries.push(query);
		} else {
			const predicate =
				_isPredicate(query) ? query : new HarnessPredicate(query, {});
			allQueries.push(predicate);
			harnessQueries.push(predicate);
			harnessTypes.add(predicate.harnessType);
		}
	}

	return {allQueries, harnessQueries, elementQueries, harnessTypes};
}

/**
 * Removes duplicate query results for a particular element. (e.g. multiple `TestElement`
 * instances or multiple instances of the same `ComponentHarness` class.
 *
 * @template {(import("@ngx-playwright/harness").AnyComponentHarness | import("@ngx-playwright/harness").TestElement | null)[]} T
 * @param {T} results
 * @returns {Promise<T>}
 */
async function _removeDuplicateQueryResults(results) {
	let testElementMatched = false;
	const matchedHarnessTypes = new Set();
	const dedupedMatches = [];
	for (const result of results) {
		if (!result) {
			continue;
		}
		if (_isComponentHarness(result)) {
			if (!matchedHarnessTypes.has(result.constructor)) {
				matchedHarnessTypes.add(result.constructor);
				dedupedMatches.push(result);
			}
		} else if (!testElementMatched) {
			testElementMatched = true;
			dedupedMatches.push(result);
		}
	}
	return /** @type {T} */ (dedupedMatches);
}

/**
 * Verifies that there is at least one result in an array.
 *
 * @template T
 * @param {Promise<T[]>} results
 * @param {string[]} queryDescriptions
 * @returns {Promise<T>}
 */
async function _assertResultFound(results, queryDescriptions) {
	const result = (await results)[0];
	if (result == undefined) {
		throw Error(
			`Failed to find element matching one of the following queries:\n` +
				queryDescriptions.map((desc) => `(${desc})`).join(",\n"),
		);
	}
	return result;
}

/** @param {string} selector */
function _getDescriptionForHarnessLoaderQuery(selector) {
	return `HarnessLoader for element matching selector: "${selector}"`;
}

/**
 * Gets a list of description strings from a list of queries.
 * @param {(string | import("@ngx-playwright/harness").HarnessQuery<any>)[]} queries
 */
function _getDescriptionForLocatorForQueries(queries) {
	return queries.map((query) =>
		typeof query === "string" ?
			_getDescriptionForTestElementQuery(query)
		:	_getDescriptionForComponentHarnessQuery(query),
	);
}

/**
 * Gets a description string for a `ComponentHarness` query.
 * @param {import("@ngx-playwright/harness").HarnessQuery<any>} query
 */
function _getDescriptionForComponentHarnessQuery(query) {
	const harnessPredicate =
		_isPredicate(query) ? query : new HarnessPredicate(query, {});
	const {name, hostSelector} = harnessPredicate.harnessType;
	const description = `${name} with host element matching selector: "${hostSelector}"`;
	const constraints = harnessPredicate.getDescription();
	return (
		description +
		(constraints ?
			` satisfying the constraints: ${harnessPredicate.getDescription()}`
		:	"")
	);
}

/**
 * @param {import("@ngx-playwright/harness").HarnessQuery<any>} query
 * @returns {query is HarnessPredicate<any>}
 */
function _isPredicate(query) {
	return "harnessType" in query && "getDescription" in query;
}

/**
 * @param {import("@ngx-playwright/harness").AnyComponentHarness | import("@ngx-playwright/harness").TestElement} value
 * @returns {value is import("@ngx-playwright/harness").AnyComponentHarness}
 */
function _isComponentHarness(value) {
	// We only have to take Playwright test elements into account, helpfully
	return !(value instanceof PlaywrightElement);
}

/**
 * Gets a description string for a `TestElement` query.
 * @param {string} selector
 */
function _getDescriptionForTestElementQuery(selector) {
	return `TestElement for element matching selector: "${selector}"`;
}
