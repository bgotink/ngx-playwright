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
 * @param {string} [exclude] CSS selector for elements to exclude from the innerText
 * @see https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 */
export function innerText(element, exclude) {
	if (!element || !isElement(element)) {
		throw new TypeError("Parameter element must be a DOM Element");
	}
	if (exclude != null && typeof exclude !== "string") {
		throw new TypeError("Parameter exclude must be a string");
	}

	if (!element.isConnected) {
		return "";
	}

	const document = element.ownerDocument;
	if (!document) {
		throw new TypeError("Parameter element must be linked to a document");
	}

	const window = document.defaultView;
	if (!window) {
		throw new TypeError(
			"Parameter element must be linked to a document shown in a window",
		);
	}
	const {getComputedStyle} = window;

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
	if (typeof cleanedList.at(0) === "number") {
		cleanedList.shift();
	}
	if (typeof cleanedList.at(-1) === "number") {
		cleanedList.pop();
	}

	return cleanedList
		.map((v) =>
			typeof v === "number" ?
				v === 0.5 ?
					" "
				:	"\n".repeat(v)
			:	v,
		)
		.join("");

	/**
	 * @param {Node} node
	 * @param {CSSStyleDeclaration} [parentStyle]
	 * @returns {(string | number)[]}
	 */
	function helper(node, parentStyle) {
		if (isText(node)) {
			const ps = /** @type {CSSStyleDeclaration} */ (parentStyle);

			if (ps.visibility !== "visible") {
				return [];
			}

			const text = /** @type {Text} */ (node.cloneNode(true));
			textContainer.append(text);

			textContainer.style.whiteSpace = ps.whiteSpace;
			textContainer.style.textTransform = ps.textTransform;

			const textContent = /** @type {string} */ (text.textContent);
			const innerText = textContainer.innerText;

			text.remove();

			/** @type {ReturnType<helper>} */
			const result = [innerText];

			if (innerText.at(0) !== textContent.at(0)) {
				result.unshift(0.5);
			}
			if (innerText.at(-1) !== textContent.at(-1)) {
				result.push(0.5);
			}

			return result;
		} else if (!isElement(node)) {
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

	/**
	 * @param {Node} node
	 * @returns {node is Text}
	 */
	function isText(node) {
		return node.nodeType === 3 /* Node.TEXT_NODE */;
	}

	/**
	 * @param {Node} node
	 * @returns {node is Element}
	 */
	function isElement(node) {
		return node.nodeType === 1 /* Node.ELEMENT_NODE */;
	}
}
