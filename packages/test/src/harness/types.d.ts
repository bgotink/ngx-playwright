import type {
	ComponentHarness,
	ComponentHarnessConstructor,
	HarnessPredicate,
} from "@ngx-playwright/harness";

/** Parsed form of the queries passed to the `locatorFor*` methods. */
export type ParsedQueries<T extends ComponentHarness> = {
	/** The full list of queries, in their original order. */
	allQueries: (string | HarnessPredicate<T>)[];
	/**
	 * A filtered view of `allQueries` containing only the queries that are looking for a
	 * `ComponentHarness`
	 */
	harnessQueries: HarnessPredicate<T>[];
	/**
	 * A filtered view of `allQueries` containing only the queries that are looking for a
	 * `TestElement`
	 */
	elementQueries: string[];
	/** The set of all `ComponentHarness` subclasses represented in the original query list. */
	harnessTypes: Set<ComponentHarnessConstructor<T>>;
};

export interface PlaywrightHarnessEnvironmentOptions {
	/**
	 * If true, all query selectors respect shadowroots
	 *
	 * By default, shadow boundaries are pierced by all queries.
	 */
	respectShadowBoundaries?: boolean;

	/**
	 * If true, back the `TestElement`s with `Locator`s instead of `ElementHandle`s.
	 *
	 * Uses `ElementHandle`s by default
	 */
	useLocators?: boolean;
}
