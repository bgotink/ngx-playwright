/**
 * @file
 * These functions run inside the browser via playwright's `evaluate` functions.
 *
 * Every function has to be pure. They cannot have any dependencies, not even to
 * other functions in this file.
 */

/**
 * Gets text of element excluding certain selectors within the element.
 *
 * @param {Element} element Element to get text from,
 * @param {string} excludeSelector Selector identifying which elements to exclude
 * @internal
 * @returns {string}
 */
export function nativeInnerTextWithExcludedElements(element, excludeSelector) {
	const clone = /** @type {Element} */ (element.cloneNode(true));

	for (const child of clone.querySelectorAll(excludeSelector)) {
		child.parentNode?.removeChild(child);
	}

	// Fallback to textContent for SVG elements
	return (
		/** @type {Element & Partial<HTMLElement>} */ (clone).innerText ??
		clone.textContent ??
		""
	);
}

/**
 * Blurs the given element
 * @param {HTMLElement | SVGElement} element Element to blur
 * @internal
 */
export function blur(element) {
	element.blur();
}

/**
 * Check whether the given element matches the given selector
 *
 * @param {Element} element Element to match
 * @param {string} selector Selector to match the element against
 * @returns {boolean} Whether the element matches the selector
 * @internal
 */
export function matches(element, selector) {
	return element.matches(selector);
}

/**
 * Returns the dimensions of the given element
 *
 * @param {Element} element The element for which to get the dimensions
 * @returns {import('@ngx-playwright/harness').ElementDimensions} The dimensions of the element
 * @internal
 */
export function getBoundingClientRect(element) {
	const {left, top, width, height} = element.getBoundingClientRect();
	return {left, top, width, height};
}

/**
 * Returns the computed value for the given style property on the given element
 *
 * @param {Element} element The element for which to get the style property
 * @param {string} styleProperty The style property to get
 * @returns {string} The value for the style property
 */
export function getStyleProperty(element, styleProperty) {
	return getComputedStyle(element).getPropertyValue(styleProperty);
}

/**
 * Returns whether the angular app is bootstrapped
 *
 * @returns {boolean}
 */
export function isAngularBootstrapped() {
	return (
		typeof (
			/** @type {import('./angular-types.js').AngularWindow} */ (globalThis)
				.frameworkStabilizers
		) !== "undefined"
	);
}

/**
 * Waits until the angular app is stable
 *
 * @returns {Promise<void>}
 */
export async function waitUntilAngularStable() {
	if (
		typeof (
			/** @type {import('./angular-types.js').AngularWindow} */ (globalThis)
				.frameworkStabilizers
		) !== "undefined"
	) {
		await Promise.all(
			/** @type {import('./angular-types.js').AngularWindow} */ (
				globalThis
			).frameworkStabilizers.map((fn) => new Promise(fn)),
		);
	}
}

/**
 *
 * @param {Element} element
 * @param {[string, Record<string, import('@ngx-playwright/harness').EventData>]} event
 * @returns {void}
 */
export function dispatchEvent(element, [name, properties]) {
	const {detail, ...otherProps} = properties ?? {};

	const event = new CustomEvent(name, {detail});
	Object.assign(event, otherProps);

	element.dispatchEvent(event);
}

/**
 * @param {Element} element
 * @param {string} value
 */
export function setContenteditableValue(element, value) {
	if (!(/** @type {HTMLElement} */ (element).isContentEditable)) {
		throw new Error(
			"setContenteditableValue can only be called on a 'contenteditable' element",
		);
	}

	element.textContent = value;
}

/**
 * @param {Element} element
 * @param {string} property
 */
export function getProperty(element, property) {
	return /** @type {any} */ (element)[property];
}

/**
 * An `HTMLElement.innerText`-like implementation that includes shadow roots and slotted content
 *
 * The goal here is to remain relatively true to the innerText property, but make
 *
 * ```html
 * <div>
 *   #shadowRoot
 *     Hello <slot></slot>!
 *   <span>World</span>
 * </div>
 * ```
 *
 * return "Hello World!" instead of "World".
 *
 * @param {Element} element
 * @param {string} [exclude]
 * @see https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 */
export function innerText(element, exclude) {
	// Helper element that we can use to read innerText to turn Text nodes into
	// a useful string value
	const textContainer = document.createElement("div");
	// The element must be added to the DOM, otherwise certain crucial steps in
	// the innerText spec will not be applied
	document.body.append(textContainer);
	// Remove any display property, because running this function on an element
	// with `display: none` should still yield a useful result.
	const originalDisplay =
		/** @type {HTMLElement | SVGElement | MathMLElement} */ (element).style
			.display;
	/** @type {HTMLElement | SVGElement | MathMLElement} */ (
		element
	).style.display = "initial";

	const list = helper(element, undefined);

	// Reset the display property
	/** @type {HTMLElement | SVGElement | MathMLElement} */ (
		element
	).style.display = originalDisplay;
	// Remove the helper element
	textContainer.remove();

	/** @type {typeof list} `list` with empty strings removed and consecutive newlines collapsed */
	const cleanedList = [];

	let newLinesToInsert = 0;
	for (const item of list) {
		if (item === "") {
			continue;
		}

		if (typeof item === "string") {
			if (newLinesToInsert > 0) {
				cleanedList.push(newLinesToInsert);
				newLinesToInsert = 0;
			}
			cleanedList.push(item);
		} else {
			newLinesToInsert = Math.max(newLinesToInsert, item);
		}
	}

	// cleanedList is either [number], or [...(string | number)[], string] due to
	// how it is set up, so we don't have to check if it ends with a number.
	if (typeof cleanedList[0] === "number") {
		cleanedList.shift();
	}

	return cleanedList
		.map((v) => (typeof v === "number" ? "\n".repeat(v) : v))
		.join("");

	/**
	 * @param {Node} node
	 * @param {CSSStyleDeclaration} [parentStyle]
	 * @returns {(string | number)[]}
	 */
	function helper(node, parentStyle) {
		if (node instanceof Text) {
			const ps = /** @type {CSSStyleDeclaration} */ (parentStyle);

			if (ps.visibility !== "visible") {
				return [];
			}

			textContainer.firstChild?.remove();
			textContainer.append(node.cloneNode(true));

			textContainer.style.whiteSpace = ps.whiteSpace;
			textContainer.style.textTransform = ps.textTransform;

			return [textContainer.innerText];
		} else if (!(node instanceof Element)) {
			return [];
		}

		if (exclude && node.matches(exclude)) {
			return [];
		}

		const computedStyle = getComputedStyle(node);
		if (computedStyle.display === "none") {
			return [];
		}

		let childNodes;
		if (node.shadowRoot) {
			childNodes = node.shadowRoot.childNodes;
		} else if ("assignedNodes" in node) {
			const assignedNodes = /** @type {HTMLSlotElement} */ (
				node
			).assignedNodes();
			// If there are no assigned nodes in the slot, the slot will show its children
			childNodes = assignedNodes.length ? assignedNodes : node.childNodes;
		} else {
			childNodes = node.childNodes;
		}

		const result = Array.from(childNodes, (child) =>
			helper(child, computedStyle),
		).flat();

		if (computedStyle.visibility !== "visible") {
			return result;
		}

		if (node.tagName === "BR") {
			result.push("\n");
		}

		if (computedStyle.display === "table-cell") {
			// should add TAB if this isn't the last cell
		} else if (computedStyle.display === "table-row") {
			// should add LF if this isn't the last row
		}

		if (node.tagName === "P") {
			return [2, ...result, 2];
		} else if (
			computedStyle.display.startsWith("block ") ||
			computedStyle.display === "block" ||
			computedStyle.display === "flex" ||
			computedStyle.display === "grid" ||
			computedStyle.display === "table" ||
			computedStyle.display === "table-caption"
		) {
			return [1, ...result, 1];
		}

		return result;
	}
}
