import {querySelector, querySelectorAll} from "./index.js";

/**
 * @param {Element} root
 * @param {string} selector
 */
export function query(root, selector) {
	return querySelector(selector, root);
}

/**
 * @param {Element} root
 * @param {string} selector
 */
export function queryAll(root, selector) {
	return querySelectorAll(selector, root);
}
