/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @abstract
 * @implements {import('./component-harness.js').AnyComponentHarness}
 */
export class ComponentHarness {
	/**
	 * @type {import('./locator-factory.js').LocatorFactory}
	 * @protected
	 * @readonly
	 */
	locatorFactory;

	/** @param {import('./locator-factory.js').LocatorFactory} */
	constructor(locatorFactory) {
		this.locatorFactory = locatorFactory;
	}

	/** @returns {Promise<import('./test-element.js').TestElement>} */
	async host() {
		return this.locatorFactory.rootElement;
	}

	/**
	 * @protected
	 * @returns {import('./locator-factory.js').LocatorFactory}
	 */
	documentRootLocatorFactory() {
		return this.locatorFactory.documentRootLocatorFactory();
	}

	/**
	 * @template {(import('./harness-predicate.js').HarnessQuery<any> | string)[]} T
	 * @protected
	 * @param {...T} queries
	 * @returns {import('./locator-factory.js').AsyncFactoryFn<import('./locator-factory.js').LocatorFnResult<T>>}
	 */
	locatorFor(...queries) {
		return this.locatorFactory.locatorFor(...queries);
	}

	/**
	 * @template {(import('./harness-predicate.js').HarnessQuery<any> | string)[]} T
	 * @protected
	 * @param {...T} queries
	 * @returns {import('./locator-factory.js').AsyncFactoryFn<import('./locator-factory.js').LocatorFnResult<T> | null>}
	 */
	locatorForOptional(...queries) {
		return this.locatorFactory.locatorForOptional(...queries);
	}

	/**
	 * @protected
	 * @template {(import('./harness-predicate.js').HarnessQuery<any> | string)[]} T
	 * @param {...T} queries
	 * @returns {import('./locator-factory.js').AsyncFactoryFn<import('./locator-factory.js').LocatorFnResult<T>[]>}
	 */
	locatorForAll(...queries) {
		return this.locatorFactory.locatorForAll(...queries);
	}
}

/**
 * @template {string} [S=string]
 * @abstract
 * @implements {import('./harness-loader.js').HarnessLoader}
 */
export class ContentContainerComponentHarness extends ComponentHarness {
	/** @param {S} selector */
	async getChildLoader(selector) {
		return await (await this.getRootHarnessLoader()).getChildLoader(selector);
	}

	/** @param {S} selector */
	async getAllChildLoaders(selector) {
		return await (
			await this.getRootHarnessLoader()
		).getAllChildLoaders(selector);
	}

	/**
	 * @template {import('./component-harness.js').AnyComponentHarness} T
	 * @param {import('./harness-predicate.js').HarnessQuery<T>} query
	 */
	async getHarness(query) {
		return await (await this.getRootHarnessLoader()).getHarness(query);
	}

	/**
	 * @template {import('./component-harness.js').AnyComponentHarness} T
	 * @param {import('./harness-predicate.js').HarnessQuery<T>} query
	 * @returns
	 */
	async getHarnessOrNull(query) {
		return await (await this.getRootHarnessLoader()).getHarnessOrNull(query);
	}

	/**
	 * @template {import('./component-harness.js').AnyComponentHarness} T
	 * @param {import('./harness-predicate.js').HarnessQuery<T>} query
	 * @returns
	 */
	async getAllHarnesses(query) {
		return await (await this.getRootHarnessLoader()).getAllHarnesses(query);
	}

	/**
	 * @template {import('./component-harness.js').AnyComponentHarness} T
	 * @param {import('./harness-predicate.js').HarnessQuery<T>} query
	 * @returns
	 */
	async hasHarness(query) {
		return await (await this.getRootHarnessLoader()).hasHarness(query);
	}

	/**
	 * @protected
	 */
	async getRootHarnessLoader() {
		return this.locatorFactory.rootHarnessLoader();
	}

	/**
	 * @deprecated Only added for compatibility with @angular/cdk/testing
	 */
	forceStabilize() {
		return this.locatorFactory.forceStabilize();
	}

	/**
	 * @deprecated Only added for compatibility with @angular/cdk/testing
	 */
	waitForTasksOutsideAngular() {
		return this.locatorFactory.waitForTasksOutsideAngular();
	}
}
