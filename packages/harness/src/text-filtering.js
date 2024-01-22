/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Gets text of element excluding certain selectors within the element.
 * @param {Element} element Element to get text from,
 * @param {string} excludeSelector Selector identifying which elements to exclude,
 */
export function _getTextWithExcludedElements(element, excludeSelector) {
	const clone = /** @type {Element} */ (element.cloneNode(true));
	for (const exclusion of clone.querySelectorAll(excludeSelector)) {
		exclusion.remove();
	}
	return (clone.textContent || "").trim();
}
