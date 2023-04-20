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
export function getTextWithExcludedElements(element, excludeSelector) {
  const clone = /** @type {Element} */ (element.cloneNode(true));

  for (const child of clone.querySelectorAll(excludeSelector)) {
    child.parentNode?.removeChild(child);
  }

  // Fallback to textContent for SVG elements
  return (
    /** @type {Element & Partial<HTMLElement>} */ (clone).innerText ??
    clone.textContent ??
    ''
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
 * @returns {import('@angular/cdk/testing').ElementDimensions} The dimensions of the element
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
      /** @type {import('./angular-types').AngularWindow} */ (globalThis)
        .frameworkStabilizers
    ) !== 'undefined'
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
      /** @type {import('./angular-types').AngularWindow} */ (globalThis)
        .frameworkStabilizers
    ) !== 'undefined'
  ) {
    await Promise.all(
      /** @type {import('./angular-types').AngularWindow} */ (
        globalThis
      ).frameworkStabilizers.map(fn => new Promise(fn)),
    );
  }
}

/**
 *
 * @param {Element} element
 * @param {[string, Record<string, import('@angular/cdk/testing').EventData>]} event
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
