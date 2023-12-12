import {TestKey, getNoKeysSpecifiedError} from "@angular/cdk/testing";

/** @typedef {import('@angular/cdk/testing').ElementDimensions} ElementDimensions */
/** @typedef {import('@angular/cdk/testing').EventData} EventData */
/** @typedef {import('@angular/cdk/testing').ModifierKeys} ModifierKeys */
/** @typedef {import('@angular/cdk/testing').TestElement} TestElement */
/** @typedef {import('@angular/cdk/testing').TextOptions} TextOptions */
/** @template [T=Node] @typedef {import('@playwright/test').ElementHandle<T>} ElementHandle */
/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

import * as contentScripts from "./browser.js";

/**
 * @type {Map<TestKey, [method: 'type' | 'press', key: string]>}
 */
const keyMap = new Map([
	[TestKey.BACKSPACE, ["press", "Backspace"]],
	[TestKey.TAB, ["press", "Tab"]],
	[TestKey.ENTER, ["press", "Enter"]],
	[TestKey.SHIFT, ["press", "Shift"]],
	[TestKey.CONTROL, ["press", "Control"]],
	[TestKey.ALT, ["press", "Alt"]],
	[TestKey.ESCAPE, ["press", "Escape"]],
	[TestKey.PAGE_UP, ["press", "PageUp"]],
	[TestKey.PAGE_DOWN, ["press", "PageDown"]],
	[TestKey.END, ["press", "End"]],
	[TestKey.HOME, ["press", "Home"]],
	[TestKey.LEFT_ARROW, ["press", "ArrowLeft"]],
	[TestKey.UP_ARROW, ["press", "ArrowUp"]],
	[TestKey.RIGHT_ARROW, ["press", "ArrowRight"]],
	[TestKey.DOWN_ARROW, ["press", "ArrowDown"]],
	[TestKey.INSERT, ["press", "Insert"]],
	[TestKey.DELETE, ["press", "Delete"]],
	[TestKey.F1, ["press", "F1"]],
	[TestKey.F2, ["press", "F2"]],
	[TestKey.F3, ["press", "F3"]],
	[TestKey.F4, ["press", "F4"]],
	[TestKey.F5, ["press", "F5"]],
	[TestKey.F6, ["press", "F6"]],
	[TestKey.F7, ["press", "F7"]],
	[TestKey.F8, ["press", "F8"]],
	[TestKey.F9, ["press", "F9"]],
	[TestKey.F10, ["press", "F10"]],
	[TestKey.F11, ["press", "F11"]],
	[TestKey.F12, ["press", "F12"]],
	[TestKey.META, ["press", "Meta"]],
	[TestKey.COMMA, ["type", ","]],
]);

const modifierMapping = /** @type {const} */ ([
	["alt", "Alt"],
	["shift", "Shift"],
	["meta", "Meta"],
	["control", "Control"],
]);

/**
 * @param {ModifierKeys} modifiers
 */
function getModifiers(modifiers) {
	return modifierMapping
		.filter(([modifier]) => modifiers[modifier])
		.map(([, modifier]) => modifier);
}

/**
 * @param {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} keys
 * @returns {keys is [ModifierKeys, ...(string | TestKey)[]]}
 */
function hasModifiers(keys) {
	return typeof keys[0] === "object";
}

/**
 * @template {unknown[]} T
 * @param {T} args
 * @returns {args is T & ['center', ...unknown[]]}
 */
function isCenterClick(args) {
	return args[0] === "center";
}

/**
 * @param {ClickParameters} args
 * @returns {args is [number, number, ModifierKeys?]}
 */
function isPositionedClick(args) {
	return typeof args[0] === "number";
}

/**
 * @typedef {[ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]} ClickParameters
 */

/**
 *
 * @param {ElementHandle<unknown> | Locator} handleOrLocator
 * @returns {handleOrLocator is Locator}
 */
export function isLocator(handleOrLocator) {
	return !("$$" in handleOrLocator);
}

/**
 * `TestElement` implementation backed by playwright's `ElementHandle`
 *
 * @internal
 * @implements TestElement
 */
export class PlaywrightElement {
	/**
	 * The page the element is on
	 *
	 * @readonly
	 * @type {() => Page}
	 */
	#page;

	/**
	 * Awaits for the angular app to become stable
	 *
	 * This function has to be called after every manipulation and before any query
	 *
	 * @readonly
	 * @type {<T>(fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<T>) => Promise<T>}
	 */
	#query;

	/**
	 * Awaits for the angular app to become stable
	 *
	 * This function has to be called after every manipulation and before any query
	 *
	 * @readonly
	 * @type {(fn: (handle: Locator | ElementHandle<HTMLElement | SVGElement>) => Promise<void>) => Promise<void>}
	 */
	#perform;

	/**
	 * Execute the given script
	 *
	 * @readonly
	 * @type {Locator['evaluate']}
	 */
	#evaluate;

	/**
	 * @param {() => Page} page
	 * @param {ElementHandle<HTMLElement | SVGElement> | Locator} handleOrLocator
	 * @param {() => Promise<void>} whenStable
	 */
	constructor(page, handleOrLocator, whenStable) {
		this.#page = page;

		this.#query = async (fn) => {
			await whenStable();
			return fn(handleOrLocator);
		};

		this.#perform = async (fn) => {
			try {
				return await fn(handleOrLocator);
			} finally {
				await whenStable();
			}
		};

		this.#evaluate = /** @type {Locator} */ (handleOrLocator).evaluate.bind(
			handleOrLocator,
		);
	}

	/**
	 *
	 * @param  {ClickParameters} args
	 * @returns {Promise<Parameters<ElementHandle['click']>[0]>}
	 */
	#toClickOptions = async (...args) => {
		/** @type {Parameters<ElementHandle['click']>[0]} */
		const clickOptions = {};
		/** @type {ModifierKeys | undefined} */
		let modifierKeys;

		if (isCenterClick(args)) {
			const size = await this.getDimensions();

			clickOptions.position = {
				x: size.width / 2,
				y: size.height / 2,
			};

			modifierKeys = args[1];
		} else if (isPositionedClick(args)) {
			clickOptions.position = {x: args[0], y: args[1]};
			modifierKeys = args[2];
		} else {
			modifierKeys = args[0];
		}

		if (modifierKeys) {
			clickOptions.modifiers = getModifiers(modifierKeys);
		}

		return clickOptions;
	};

	/**
	 * @returns {Promise<void>}
	 */
	blur() {
		// Playwright exposes a `focus` function but no `blur` function, so we have
		// to resort to executing a function ourselves.
		return this.#perform(() => this.#evaluate(contentScripts.blur));
	}

	/**
	 * @returns {Promise<void>}
	 */
	clear() {
		return this.#perform((handle) => handle.fill(""));
	}

	/**
	 * @param {ClickParameters} args
	 * @returns {Promise<void>}
	 */
	click(...args) {
		return this.#perform(async (handle) =>
			handle.click(await this.#toClickOptions(...args)),
		);
	}

	/**
	 * @param {ClickParameters} args
	 * @returns {Promise<void>}
	 */
	rightClick(...args) {
		return this.#perform(async (handle) =>
			handle.click({
				...(await this.#toClickOptions(...args)),
				button: "right",
			}),
		);
	}

	/**
	 * @param {string} name
	 * @param {Record<string, EventData>=} data
	 * @returns {Promise<void>}
	 */
	dispatchEvent(name, data) {
		// ElementHandle#dispatchEvent executes the equivalent of
		//   `element.dispatchEvent(new CustomEvent(name, {detail: data}))`
		// which doesn't match what angular wants: `data` are properties to be
		// placed on the event directly rather than on the `details` property

		return this.#perform(() =>
			// Cast to `any` needed because of infinite type instantiation
			this.#evaluate(
				contentScripts.dispatchEvent,
				/** @type {[string, any]} */ ([name, data]),
			),
		);
	}

	/**
	 * @returns {Promise<void>}
	 */
	focus() {
		return this.#perform((handle) => handle.focus());
	}

	/**
	 * @param {string} property
	 * @returns {Promise<string>}
	 */
	async getCssValue(property) {
		return this.#query(() =>
			this.#evaluate(contentScripts.getStyleProperty, property),
		);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async hover() {
		return this.#perform((handle) => handle.hover());
	}

	/**
	 * @returns {Promise<void>}
	 */
	async mouseAway() {
		const {left, top} = await this.#query(async (handle) => {
			let {left, top} = await this.#evaluate(
				contentScripts.getBoundingClientRect,
			);

			if (left < 0 && top < 0) {
				await handle.scrollIntoViewIfNeeded();
				({left, top} = await this.#evaluate(
					contentScripts.getBoundingClientRect,
				));
			}

			return {left, top};
		});

		return this.#perform(() =>
			this.#page().mouse.move(Math.max(0, left - 1), Math.max(0, top - 1)),
		);
	}

	/**
	 *
	 * @param  {...number} optionIndexes
	 * @returns {Promise<void>}
	 */
	selectOptions(...optionIndexes) {
		// ElementHandle#selectOption supports selecting multiple options at once,
		// but that triggers only one change event.
		// So we select options as if we're a user: one at a time

		return this.#perform(async (handle) => {
			/** @type {{index: number}[]} */
			const selections = [];
			for (const index of optionIndexes) {
				selections.push({index});
				await handle.selectOption(selections);
			}
		});
	}

	/**
	 *
	 * @param  {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} input
	 * @returns {Promise<void>}
	 */
	sendKeys(...input) {
		return this.#perform(async (handle) => {
			/** @type {string | undefined} */
			let modifiers;
			let keys;
			if (hasModifiers(input)) {
				/** @type {ModifierKeys} */
				let modifiersObject;
				[modifiersObject, ...keys] = input;

				modifiers = getModifiers(modifiersObject).join("+");
			} else {
				keys = input;
			}

			if (!keys.some((key) => key !== "")) {
				throw getNoKeysSpecifiedError();
			}

			await handle.focus();

			const {keyboard} = this.#page();

			if (modifiers) {
				await keyboard.down(modifiers);
			}

			try {
				for (const key of /** @type {(string | TestKey)[]} */ (keys)) {
					if (typeof key === "string") {
						await keyboard.type(key);
					} else if (keyMap.has(key)) {
						const [method, argument] =
							/** @type {[method: "type" | "press", key: string]} */ (
								keyMap.get(key)
							);
						await keyboard[method](argument);
					} else {
						throw new Error(`Unknown key: ${TestKey[key] ?? key}`);
					}
				}
			} finally {
				if (modifiers) {
					await keyboard.up(modifiers);
				}
			}
		});
	}

	/**
	 * @param {string} value
	 * @returns {Promise<void>}
	 */
	setInputValue(value) {
		return this.#perform((handle) => handle.fill(value));
	}

	/**
	 * @param {TextOptions=} options
	 * @returns {Promise<string>}
	 */
	text(options) {
		return this.#query((handle) => {
			if (options?.exclude) {
				return this.#evaluate(
					contentScripts.getTextWithExcludedElements,
					options.exclude,
				);
			}

			return handle.innerText();
		});
	}

	/**
	 * @param {string} value
	 * @returns {Promise<void>}
	 */
	setContenteditableValue(value) {
		return this.#perform(() =>
			this.#evaluate(contentScripts.setContenteditableValue, value),
		);
	}

	/**
	 * @param {string} name
	 * @returns {Promise<string | null>}
	 */
	getAttribute(name) {
		return this.#query((handle) => handle.getAttribute(name));
	}

	/**
	 * @param {string} name
	 * @returns {Promise<boolean>}
	 */
	async hasClass(name) {
		const classes =
			(await this.#query((handle) => handle.getAttribute("class")))?.split(
				/\s+/,
			) ?? [];

		return classes.includes(name);
	}

	/**
	 * @returns {Promise<ElementDimensions>}
	 */
	async getDimensions() {
		return this.#query(() =>
			this.#evaluate(contentScripts.getBoundingClientRect),
		);
	}

	/**
	 * @param {string} name
	 * @returns {Promise<any>}
	 */
	async getProperty(name) {
		const property = await this.#query(async (handle) => {
			if (isLocator(handle)) {
				return handle.evaluateHandle(contentScripts.getProperty, name);
			} else {
				return handle.getProperty(name);
			}
		});

		try {
			return await property.jsonValue();
		} finally {
			await property.dispose();
		}
	}

	/**
	 * @param {string} selector
	 * @returns {Promise<boolean>}
	 */
	async matchesSelector(selector) {
		return this.#query(() => this.#evaluate(contentScripts.matches, selector));
	}

	/**
	 * @returns {Promise<boolean>}
	 */
	async isFocused() {
		return this.matchesSelector(":focus");
	}
}
