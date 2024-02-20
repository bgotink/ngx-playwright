import {parse as _parse} from "parsel-js";

/** @type {Map<string, WeakRef<import("parsel-js").AST>>} */
const parseCache = new Map();

/**
 * @param {string} selector
 */
function parse(selector) {
	let ast = parseCache.get(selector)?.deref();

	if (!ast) {
		// Don't ask parsel to parse sub-selectors in :is/:where/:has/:not, because of
		// https://github.com/LeaVerou/parsel/issues/74.
		ast = _parse(selector, {recursive: false}) || invalidSelector(selector);
		parseCache.set(selector, new WeakRef(ast));
	}

	return ast;
}

/** @param {Element} element */
function getChildNodes(element) {
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
function getParent(element) {
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

	return Array.from(siblings).filter(
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
	const [anb, selector] = /** @type {[string, string | undefined]} */ (
		nth.split(/\s+of\s*/, 2)
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
					/** @type {[String, string]} */ (anb.split("n"))
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
 * @param {Element} element
 * @param {Element} scope
 * @param {import('parsel-js').AST} ast
 * @returns {boolean}
 */
function matchesSelector(element, scope, ast) {
	switch (ast.type) {
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

		case "list":
			for (const child of ast.list) {
				if (matchesSelector(element, scope, child)) {
					return true;
				}
			}

			return false;
		case "compound":
			for (const child of ast.list) {
				if (!matchesSelector(element, scope, child)) {
					return false;
				}
			}

			return true;

		case "pseudo-element":
			return invalidSelector(ast.content);
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
						siblings = Array.from(siblings).filter((sibling) =>
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
				case "has":
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					// :scope is there to prevent the :has argument from matching the element
					// itself, and because :has selectors can start with a combinator
					return (
						querySelector(
							`:scope ${ast.argument}`,
							getParent(element) || element,
							element,
						) != null
					);
				case "not":
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					return !matchesSelector(element, scope, parse(ast.argument));

				case "host":
				case "host-context":
					return invalidSelector(ast.content);

				default:
					return element.matches(ast.content);
			}

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
			}

			return unreachable();
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
 * @param {string} selector
 * @param {Element | Document} container
 * @param {Element} scope
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
 * @param {string} selector
 * @param {Element | Document} container
 * @param {Element} scope
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
