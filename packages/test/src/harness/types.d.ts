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
	 * If `true`, the default `selectorEngine` is `light` instead of `playwright`.
	 *
	 * @deprecated Set `selectorEngine` instead
	 */
	respectShadowBoundaries?: boolean;

	/**
	 * The selector engine to use
	 *
	 * The `light` engine only traverses light DOM, it never pierces shadow roots or slotted content.
	 * The `composed` engine traverses the composed DOM, i.e. the DOM with shadow and light intermixed into one tree.
	 * The `playwright` engine is playwright's default engine, which traverses the light DOM while also piercing shadow roots. This engine doesn't traverse into slotted content, meaning it does something between `light` and `composed`.
	 *
	 * The default engine is `playwright`.
	 */
	selectorEngine?: "playwright" | "light" | "composed" | null;

	/**
	 * If true, `TestElement#text()` will include shadow content and slotted content
	 *
	 * Enabling this deviates from other `TestElement` implementations, so it is currently opt-in to ensure compatibility by default.
	 */
	innerTextWithShadows?: boolean;

	/**
	 * If true, back the `TestElement`s with `Locator`s instead of `ElementHandle`s.
	 *
	 * Uses `ElementHandle`s by default
	 */
	useLocators?: boolean;
}
