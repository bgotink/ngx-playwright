import type {
	HarnessQuery as _AngularHarnessQuery,
	ComponentHarness as AngularComponentHarness,
} from "@angular/cdk/testing";

import type {AnyComponentHarness} from "./component-harness.js";
import type {HarnessQuery} from "./harness-predicate.js";

type AngularHarnessQuery<T extends AngularComponentHarness> =
	true extends _AngularHarnessQuery<T> ? never : _AngularHarnessQuery<T>;

/**
 * Interface used to load ComponentHarness objects. This interface is used by test authors to
 * instantiate `ComponentHarness`es.
 */
export interface HarnessLoader {
	/**
	 * Searches for an element with the given selector under the current instances's root element,
	 * and returns a `HarnessLoader` rooted at the matching element. If multiple elements match the
	 * selector, the first is used. If no elements match, an error is thrown.
	 * @param selector The selector for the root element of the new `HarnessLoader`
	 * @return A `HarnessLoader` rooted at the element matching the given selector.
	 * @throws If a matching element can't be found.
	 */
	getChildLoader(selector: string): Promise<HarnessLoader>;

	/**
	 * Searches for all elements with the given selector under the current instances's root element,
	 * and returns an array of `HarnessLoader`s, one for each matching element, rooted at that
	 * element.
	 * @param selector The selector for the root element of the new `HarnessLoader`
	 * @return A list of `HarnessLoader`s, one for each matching element, rooted at that element.
	 */
	getAllChildLoaders(selector: string): Promise<HarnessLoader[]>;

	/**
	 * Searches for an instance of the component corresponding to the given harness type under the
	 * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
	 * matching components are found, a harness for the first one is returned. If no matching
	 * component is found, an error is thrown.
	 * @param query A query for a harness to create
	 * @return An instance of the given harness type
	 * @throws If a matching component instance can't be found.
	 */
	getHarness<T extends AnyComponentHarness>(
		query: HarnessQuery<T> | AngularHarnessQuery<T>,
	): Promise<T>;

	/**
	 * Searches for an instance of the component corresponding to the given harness type under the
	 * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
	 * matching components are found, a harness for the first one is returned. If no matching
	 * component is found, null is returned.
	 * @param query A query for a harness to create
	 * @return An instance of the given harness type (or null if not found).
	 */
	getHarnessOrNull<T extends AnyComponentHarness>(
		query: HarnessQuery<T> | AngularHarnessQuery<T>,
	): Promise<T | null>;

	/**
	 * Searches for all instances of the component corresponding to the given harness type under the
	 * `HarnessLoader`'s root element, and returns a list `ComponentHarness` for each instance.
	 * @param query A query for a harness to create
	 * @return A list instances of the given harness type.
	 */
	getAllHarnesses<T extends AnyComponentHarness>(
		query: HarnessQuery<T> | AngularHarnessQuery<T>,
	): Promise<T[]>;

	/**
	 * Searches for an instance of the component corresponding to the given harness type under the
	 * `HarnessLoader`'s root element, and returns a boolean indicating if any were found.
	 * @param query A query for a harness to create
	 * @return A boolean indicating if an instance was found.
	 */
	hasHarness<T extends AnyComponentHarness>(
		query: HarnessQuery<T> | AngularHarnessQuery<T>,
	): Promise<boolean>;
}
