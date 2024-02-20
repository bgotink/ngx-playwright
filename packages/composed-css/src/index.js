import {parse as _parse} from "parsel-js";

/** @type {Map<string, WeakRef<import("parsel-js").AST>>} */
const parseCache = new Map();

/**
 * @param {string} selector
 */
function parse(selector) {
	let ast = parseCache.get(selector)?.deref();

	if (!ast) {
		// Don't ask parsel to parse sub-selectors in :is/:where/:has/:not, because
		// of https://github.com/LeaVerou/parsel/issues/74.
		// This means we have to look through the AST and parse sub-selectors in
		// these pseudo-selectors. The naive solution would parse the selector when
		// needed in matchesSelector, but that would result in a lot of redundant
		// parse operations.
		// There are basically two approaches to solve this, either by pre-processing
		// the AST to look for sub-selectors to parse, or by memoizing the parse
		// function. The latter is easier, in fewer lines of code, but it is
		// theoretically less safe, e.g. `querySelector(':root, :is(<invalid>)') is
		// invalid but will work because we never parse `<invalid>` as selector.
		ast = _parse(selector, {recursive: false}) || invalidSelector(selector);
		parseCache.set(selector, new WeakRef(ast));
	}

	return ast;
}

/** @param {Element} element */
function getChildNodes(element) {
	// If the element is a `<slot>` with assigned nodes, use those assigned nodes.
	// If the element is a `<slot>` but there are no assigned nodes, use the slot's
	// children, which function as default content for the slot.

	if (
		element.tagName === "SLOT" &&
		/** @type {HTMLSlotElement} */ (element).assignedNodes().length
	) {
		return /** @type {HTMLSlotElement} */ (element).assignedNodes();
	}

	return (element.shadowRoot ?? element).childNodes;
}

/** @param {Element} element */
function getChildren(element) {
	// Identical to getChildNodes(element) but limited to elements only

	if (
		element.tagName === "SLOT" &&
		/** @type {HTMLSlotElement} */ (element).assignedNodes().length
	) {
		return /** @type {HTMLSlotElement} */ (element).assignedElements();
	}

	return (element.shadowRoot ?? element).children;
}

/**
 * @param {Element} element
 */
function getParent(element) {
	// This function is the inverse to getChildNodes(el), i.e.
	// for (const b of getChildren(a)) {
	//   assert(getParent(b) === a);
	// }

	if (element.assignedSlot) {
		return element.assignedSlot;
	}

	if (element.parentElement) {
		return element.parentElement;
	}

	if (/** @type {ShadowRoot | null} */ (element.parentNode)?.host) {
		return /** @type {ShadowRoot} */ (element.parentNode).host;
	}

	return null;
}

/**
 * Walk the composed DOM from the given element in document order
 *
 * That means: depth first. This is identical to the way {@link TreeWalker} walks
 * through the DOM, except this function pierces through slots and shadow roots.
 *
 * @param {Element} element
 * @returns {Generator<Element>}
 */
function* walkComposedTree(element) {
	yield element;

	for (const child of getChildren(element)) {
		yield* walkComposedTree(child);
	}
}

/**
 * @param {Element} element
 */
function getSiblings(element) {
	if (element.assignedSlot) {
		return element.assignedSlot.assignedElements();
	}

	// parentElement could be null if the element is the scope or :root
	return element.parentElement ?
			Array.from(element.parentElement.children)
		:	null;
}

/**
 * @param {Element} element
 */
function getSiblingsOfType(element) {
	const siblings = getSiblings(element);

	if (!siblings) {
		return siblings;
	}

	return siblings.filter(
		(sibling) =>
			sibling.tagName.toLowerCase() === element.tagName.toLowerCase(),
	);
}

/**
 * @param {Element} element
 */
function getPreviousSibling(element) {
	if (element.assignedSlot) {
		const siblings = element.assignedSlot.assignedElements();
		return siblings[siblings.indexOf(element) - 1] ?? null;
	}

	return element.previousElementSibling;
}

/**
 * @param {string} nth
 */
function parseNth(nth) {
	// If the recursive option to parsel is ever re-enabled in `parse()`, this can
	// be simplified as parsel already takes care of the sub-selector part.
	const [anb, selector] = /** @type {[string, string | undefined]} */ (
		nth.split(/\s+of\s+/, 2)
	);

	/** @type {(indexStartingFromOne: number) => boolean} */
	let indexMatches;
	switch (anb) {
		case "even":
			indexMatches = (i) => i % 2 === 0;
			break;
		case "odd":
			indexMatches = (i) => i % 2 !== 0;
			break;
		default: {
			let [a, b] =
				anb.includes("n") ?
					/** @type {[string, string]} */ (anb.split("n"))
				:	["0", anb];
			a = a.trim();
			b = b.trim();

			let aNumber = 1;
			if (a) {
				aNumber = a === "-" ? -1 : parseInt(a);
			}

			let bNumber = 0;
			if (b) {
				switch (b[0]) {
					case "-":
						bNumber = -1 * parseInt(b.slice(1).trim());
						break;
					case "+":
						bNumber = parseInt(b.slice(1).trim());
						break;
					default:
						bNumber = parseInt(b);
						break;
				}
			}

			if (aNumber === 0) {
				indexMatches = (i) => i === bNumber;
			} else {
				indexMatches = (i) => {
					i = i - bNumber;

					return i % aNumber === 0 && i / aNumber >= 0;
				};
			}
		}
	}

	return {
		childAst: selector && parse(selector),
		indexMatches,
	};
}

/**
 * Check if the element matches the selector described by the given AST
 *
 * @param {Element} element The element to check
 * @param {Element} scope The element that counts as `:scope`
 * @param {import('parsel-js').AST} ast The selector's AST
 * @returns {boolean}
 */
function matchesSelector(element, scope, ast) {
	switch (ast.type) {
		// First, the simple selectors, e.g. `.lorem`, `#ipsum`
		case "universal":
			return true;
		case "attribute":
			return element.matches(ast.content);
		case "class":
			return element.classList.contains(ast.name);
		case "id":
			return element.id === ast.name;
		case "type":
			// HTML tag names are upper case, but XML (SVG, XHTML) tag names are cased
			// as they're written in the document, so we have to transform both the
			// selector and the tag name to a consistent case.
			return element.tagName.toLowerCase() === ast.name.toLowerCase();

		// Compound selectors, e.g. `.lorem#ipsum`
		case "compound":
			for (const child of ast.list) {
				if (!matchesSelector(element, scope, child)) {
					return false;
				}
			}

			return true;

		// Complex selectors, e.g. `.lorem > #ipsum`
		case "complex":
			switch (ast.combinator) {
				case ">": {
					const parent = getParent(element);

					return (
						parent != null &&
						matchesSelector(element, scope, ast.right) &&
						matchesSelector(parent, scope, ast.left)
					);
				}
				case " ": {
					let ancestor = getParent(element);

					if (ancestor == null || !matchesSelector(element, scope, ast.right)) {
						return false;
					}

					while (ancestor != null) {
						if (matchesSelector(ancestor, scope, ast.left)) {
							return true;
						}

						ancestor = getParent(ancestor);
					}

					return false;
				}
				case "+": {
					const previousSibling = getPreviousSibling(element);

					return (
						previousSibling != null &&
						matchesSelector(element, scope, ast.right) &&
						matchesSelector(previousSibling, scope, ast.left)
					);
				}
				case "~": {
					let previousSibling = getPreviousSibling(element);

					if (
						previousSibling == null ||
						!matchesSelector(element, scope, ast.right)
					) {
						return false;
					}

					while (previousSibling) {
						if (matchesSelector(previousSibling, scope, ast.left)) {
							return true;
						}

						previousSibling = getPreviousSibling(previousSibling);
					}

					return false;
				}
				default:
					return unreachable();
			}

		// List of selectors, e.g. `.lorem, #ipsum`
		case "list":
			for (const child of ast.list) {
				if (matchesSelector(element, scope, child)) {
					return true;
				}
			}

			return false;

		// Pseudo-elements are not supported.
		// There are only two types of pseudo-elements that actually yield elements:
		// - `:slotted()` is superfluous because you can simply use the `>` combinator
		// - `::part()` doesn't seem like it's useful? idk
		//
		// See https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements
		case "pseudo-element":
			return invalidSelector(ast.content);

		// Now the hard part: pseudo-classes...
		// Add a custom implementation for all pseudo-classes that depend on the DOM
		// tree itself and for pseudo-classes that contain sub-selectors, use the
		// native Element#matches() for all other pseudos.
		case "pseudo-class":
			switch (ast.name) {
				case "root":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === scope.ownerDocument.documentElement;
				case "scope":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === scope;

				case "empty":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					for (const child of getChildNodes(element)) {
						if (child.nodeType !== Node.COMMENT_NODE) {
							return false;
						}
					}

					return true;

				case "first-child":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === getSiblings(element)?.at(0);
				case "last-child":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === getSiblings(element)?.at(-1);
				case "only-child":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return getSiblings(element)?.length === 1;

				case "first-of-type":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === getSiblingsOfType(element)?.at(0);
				case "last-of-type":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return element === getSiblingsOfType(element)?.at(-1);
				case "only-of-type":
					if (ast.argument) {
						invalidSelector(ast.content);
					}

					return getSiblingsOfType(element)?.length === 1;

				case "nth-of-type":
				case "nth-last-of-type": {
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					const siblings = getSiblingsOfType(element);
					if (siblings == null) {
						return false;
					}

					const {childAst, indexMatches} = parseNth(ast.argument);

					if (childAst) {
						invalidSelector(ast.content);
					}

					if (ast.name === "nth-of-type") {
						return indexMatches(1 + siblings.indexOf(element));
					} else {
						return indexMatches(siblings.length - siblings.indexOf(element));
					}
				}

				case "nth-child":
				case "nth-last-child": {
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					let siblings = getSiblings(element);
					if (siblings == null) {
						return false;
					}

					const {childAst, indexMatches} = parseNth(ast.argument);

					if (childAst) {
						siblings = siblings.filter((sibling) =>
							matchesSelector(sibling, scope, childAst),
						);
					}

					if (ast.name === "nth-child") {
						return indexMatches(1 + siblings.indexOf(element));
					} else {
						return indexMatches(siblings.length - siblings.indexOf(element));
					}
				}

				case "is":
				case "where": {
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					return matchesSelector(element, scope, parse(ast.argument));
				}
				case "not":
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					return !matchesSelector(element, scope, parse(ast.argument));
				case "has":
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					// :scope is there to prevent the :has argument from matching the element
					// itself, and because :has selectors can start with a combinator
					// We start the selector at the parent element because the combinator
					// can point towards siblings, which would be missed if the selector
					// started at the element instead.
					return (
						querySelector(
							`:scope ${ast.argument}`,
							getParent(element) || element,
							element,
						) != null
					);

				case "host":
				case "host-context":
					return invalidSelector(ast.content);

				default:
					return element.matches(ast.content);
			}
	}

	unreachable();
}

/**
 * @param {string} text
 * @returns {never}
 */
function invalidSelector(text) {
	throw new Error(`Invalid selector: ${text}`);
}

/**
 * @returns {never}
 */
function unreachable() {
	throw new Error("This code should be unreachable");
}

/**
 * @param {Element | Document} node
 */
function toElement(node) {
	return "documentElement" in node ? node.documentElement : node;
}

/**
 * Returns the first element matching the given selector in the given container in the composed DOM tree
 *
 * @param {string} selector The selector to look for
 * @param {Element | Document} [container] The element to look inside of, note the element itself can also match. If no container is passed, the entire `globalThis.document` is searched.
 * @param {Element} [scope] Element that matches `:scope`, you shouldn't need to pass this parameter, it is used internally to support `:has(+/~)`
 */
export function querySelector(
	selector,
	container = document,
	scope = toElement(container),
) {
	const ast = parse(selector);

	for (const element of walkComposedTree(toElement(container))) {
		if (matchesSelector(element, scope, ast)) {
			return element;
		}
	}

	return null;
}

/**
 * Returns all elements matching the given selector in the given container in the composed DOM tree
 *
 * @param {string} selector The selector to look for
 * @param {Element | Document} [container] The element to look inside of, note the element itself can also match. If no container is passed, the entire `globalThis.document` is searched.
 * @param {Element} [scope] Element that matches `:scope`, you shouldn't need to pass this parameter, it is used internally to support `:has(+/~)`
 */
export function querySelectorAll(
	selector,
	container = document,
	scope = toElement(container),
) {
	const ast = parse(selector);

	/** @type {Element[]} */
	const results = [];
	for (const element of walkComposedTree(toElement(container))) {
		if (matchesSelector(element, scope, ast)) {
			results.push(element);
		}
	}
	return results;
}
