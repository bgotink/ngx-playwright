/**
 * A query for a `ComponentHarness`, which is expressed as either a `ComponentHarnessConstructor` or
 * a `HarnessPredicate`.
 *
 * @template {import('./component-harness.js').AnyComponentHarness} T
 * @typedef {import('./component-harness.js').ComponentHarnessConstructor<T> | HarnessPredicate<T>} HarnessQuery
 */

import {parallel} from "./change-detection.js";

/**
 * An async function that takes an item and returns a boolean promise
 *
 * @template T
 * @callback AsyncPredicate
 * @param {T} item
 * @returns {Promise<boolean>}
 */

/**
 * An async function that takes an item and an option value and returns a boolean promise.
 *
 * @template T, O
 * @callback AsyncOptionPredicate
 * @param {T} item
 * @param {O} option
 * @returns {Promise<boolean>}
 */

/**
 * A set of criteria that can be used to filter a list of `ComponentHarness` instances.
 *
 * @typedef {object} BaseHarnessFilters
 * @prop {string} [selector] Only find instances whose host element matches the given selector.
 * @prop {string} [ancestor] Only find instances that are nested under an element with the given selector.
 */

/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 *
 * @template {import('./component-harness.js').AnyComponentHarness} T
 */
export class HarnessPredicate {
	/**
	 * @type {AsyncPredicate<T>[]}
	 */
	#predicates = [];
	/** @type {string[]} */
	#descriptions = [];
	/** @type {string=} */
	#ancestor;
	/** @type {import('./component-harness.js').ComponentHarnessConstructor<T>} */
	harnessType;

	/**
	 * @param {typeof this['harnessType']} harnessType
	 * @param {BaseHarnessFilters} options
	 */
	constructor(harnessType, options) {
		this.harnessType = harnessType;

		this.#ancestor = options.ancestor || "";
		if (options.ancestor) {
			this.#descriptions.push(
				`has ancestor matching selector "${this.#ancestor}"`,
			);
		}
		const selector = options.selector;
		if (selector !== undefined) {
			this.add(`host matches selector "${selector}"`, async (item) => {
				return (await item.host()).matchesSelector(selector);
			});
		}
	}

	/**
	 * Checks if the specified nullable string value matches the given pattern.
	 * @param {string | null | Promise<string | null>} value The nullable string value to check, or a Promise resolving to the
	 *   nullable string value.
	 * @param {string | RegExp | null} pattern The pattern the value is expected to match. If `pattern` is a string,
	 *   `value` is expected to match exactly. If `pattern` is a regex, a partial match is
	 *   allowed. If `pattern` is `null`, the value is expected to be `null`.
	 * @return {Promise<boolean>} Whether the value matches the pattern.
	 */
	static async stringMatches(value, pattern) {
		value = await value;
		if (pattern === null) {
			return value === null;
		} else if (value === null) {
			return false;
		}
		return typeof pattern === "string" ?
				value === pattern
			:	pattern.test(value);
	}

	/**
	 * Adds a predicate function to be run against candidate harnesses.
	 * @param {string} description A description of this predicate that may be used in error messages.
	 * @param {AsyncPredicate<T>} predicate An async predicate function.
	 * @return {this} (for method chaining).
	 */
	add(description, predicate) {
		this.#descriptions.push(description);
		this.#predicates.push(predicate);
		return this;
	}

	/**
	 * Adds a predicate function that depends on an option value to be run against candidate
	 * harnesses. If the option value is undefined, the predicate will be ignored.
	 * @template O
	 * @param {string} name The name of the option (may be used in error messages).
	 * @param {O | undefined} option The option value.
	 * @param {AsyncOptionPredicate<T, O>} predicate The predicate function to run if the option value is not undefined.
	 * @return {this} (for method chaining).
	 */
	addOption(name, option, predicate) {
		if (option !== undefined) {
			this.add(`${name} = ${_valueAsString(option)}`, (item) =>
				predicate(item, option),
			);
		}
		return this;
	}

	/**
	 * Filters a list of harnesses on this predicate.
	 * @param {readonly T[]} harnesses The list of harnesses to filter.
	 * @return {Promise<T[]>} A list of harnesses that satisfy this predicate.
	 */
	async filter(harnesses) {
		if (harnesses.length === 0) {
			return [];
		}
		const results = await parallel(() =>
			harnesses.map((h) => this.evaluate(h)),
		);
		return harnesses.filter((_, i) => results[i]);
	}

	/**
	 * Evaluates whether the given harness satisfies this predicate.
	 * @param {T} harness The harness to check
	 * @return {Promise<boolean>} A promise that resolves to true if the harness satisfies this predicate,
	 *   and resolves to false otherwise.
	 */
	async evaluate(harness) {
		const results = await parallel(() =>
			this.#predicates.map((p) => p(harness)),
		);
		return results.reduce((combined, current) => combined && current, true);
	}

	/**
	 * Gets a description of this predicate for use in error messages
	 *
	 * @returns {string}
	 */
	getDescription() {
		return this.#descriptions.join(", ");
	}

	/**
	 * Gets the selector used to find candidate elements.
	 *
	 * @returns {string}
	 */
	getSelector() {
		if (!this.#ancestor) {
			return (this.harnessType.hostSelector || "").trim();
		}

		return `:is(${this.#ancestor}) :is(${this.harnessType.hostSelector || ""})`;
	}
}

/**
 * Represent a value as a string for the purpose of logging.
 *
 * @param {unknown} value
 */
function _valueAsString(value) {
	if (value === undefined) {
		return "undefined";
	}
	try {
		const stringifiedValue = JSON.stringify(value, (_, v) =>
			v instanceof RegExp ?
				`◬HARNESS_REGEX◬${v
					.toString()
					.replace(/"/g, "◬HARNESS_QUOTE◬")}◬HARNESS_REGEX◬`
			:	v,
		);

		return stringifiedValue
			.replace(/"?◬HARNESS_REGEX◬"?/g, "")
			.replace(/◬HARNESS_QUOTE◬/g, '"');
	} catch {
		// `JSON.stringify` will throw if the object is cyclical,
		// in this case the best we can do is report the value as `{...}`.
		return "{...}";
	}
}
