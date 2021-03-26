/**
 * @file
 * These functions run inside the browser via playwright's `evaluate` functions.
 *
 * Every function has to be pure. They cannot have any dependencies, not even to
 * other functions in this file.
 */

import type {ElementDimensions} from '@angular/cdk/testing';

/**
 * Gets text of element excluding certain selectors within the element.
 *
 * @param element Element to get text from,
 * @param excludeSelector Selector identifying which elements to exclude
 * @internal
 */
export function getTextWithExcludedElements(
  element: Element,
  excludeSelector: string,
): string {
  const clone = element.cloneNode(true) as Element;

  for (const child of clone.querySelectorAll(excludeSelector)) {
    child.parentNode?.removeChild(child);
  }

  // Fallback to textContent for SVG elements
  return (
    (clone as Element & Partial<HTMLElement>).innerText ??
    clone.textContent ??
    ''
  );
}

/**
 * Blurs the given element
 * @param element Element to blur
 * @internal
 */
export function blur(element: HTMLElement | SVGElement): void {
  element.blur();
}

/**
 * Check whether the given element matches the given selector
 *
 * @param element Element to match
 * @param selector Selector to match the element against
 * @returns Whether the element matches the selector
 * @internal
 */
export function matches(element: Element, selector: string): boolean {
  return element.matches(selector);
}

/**
 * Returns the dimensions of the given element
 *
 * @param element The element for which to get the dimensions
 * @returns The dimentions of the element
 * @internal
 */
export function getBoundingClientRect(element: Element): ElementDimensions {
  const {left, top, width, height} = element.getBoundingClientRect();
  return {left, top, width, height};
}

/**
 * Returns the computed value for the given style property on the given element
 *
 * @param element The element for which to get the style property
 * @param styleProperty The style property to get
 * @returns The value for the style property
 */
export function getStyleProperty(
  element: Element,
  styleProperty: string,
): string {
  return getComputedStyle(element).getPropertyValue(styleProperty);
}
