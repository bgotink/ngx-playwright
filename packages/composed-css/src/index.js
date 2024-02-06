import {parse} from "parsel-js";

/** @param {Element} element */
function getChildren(element) {
	if (
		element.tagName === "SLOT" &&
		/** @type {HTMLSlotElement} */ (element).assignedNodes().length
	) {
		return /** @type {HTMLSlotElement} */ (element).assignedElements();
	}

	return Array.from((element.shadowRoot ?? element).children);
}

/**
 * @param {Element | Document} node
 */
function getContext(node) {
	return "documentElement" in node ? node.documentElement : node;
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
function getPreviousSibling(element) {
	if (element.assignedSlot) {
		const siblings = element.assignedSlot.assignedElements();
		return siblings[siblings.indexOf(element) - 1] ?? null;
	}

	return element.previousElementSibling;
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

		case "pseudo-class":
			switch (ast.name) {
				case "root":
					if (ast.subtree) {
						invalidSelector(ast.content);
					}

					return element === scope.ownerDocument.documentElement;
				case "scope":
					if (ast.subtree) {
						invalidSelector(ast.content);
					}

					return element === scope;
				case "is":
				case "where":
					if (!ast.subtree) {
						invalidSelector(ast.content);
					}

					return matchesSelector(element, scope, ast.subtree);
				case "has":
					if (!ast.argument) {
						invalidSelector(ast.content);
					}

					return querySelector(`:scope ${ast.argument}`, element) != null;
				case "not":
					if (!ast.subtree) {
						invalidSelector(ast.content);
					}

					return !matchesSelector(element, scope, ast.subtree);
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
		case "pseudo-element":
			invalidSelector(ast.content);
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
 * @param {string} selector
 * @param {Element | Document} context
 */
export function querySelector(selector, context = document) {
	const ast = parse(selector) || invalidSelector(selector);
	context = getContext(context);

	for (const element of walkComposedTree(context)) {
		if (matchesSelector(element, context, ast)) {
			return element;
		}
	}

	return null;
}

/**
 * @param {string} selector
 * @param {Element | Document} context
 */
export function querySelectorAll(selector, context = document) {
	const ast = parse(selector) || invalidSelector(selector);
	context = getContext(context);

	/** @type {Element[]} */
	const results = [];
	for (const element of walkComposedTree(context)) {
		if (matchesSelector(element, context, ast)) {
			results.push(element);
		}
	}
	return results;
}
