# `@ngx-playwright/composed-css`

<!-- cspell:word shadowrootmode -->

This package exposes two functions `querySelector` and `querySelectorAll` that allow for querying the composed DOM, i.e. the DOM as it is shown by the browser, with light and shadow DOM intermixed.

## CSS selectors

The selectors accepted by the functions in this package differ from the CSS selectors accepted by the browser in a few key ways.

- There is no support for `:host` and `:host-context`, these don't really mean anything in the context of `querySelector(All)`.
- There is no support for pseudo-element selectors:
  - `::slotted()` is not necessary, as you can replace `#some-slot::slotted(child-selector)` with `#some-slot > child-selector`
  - `::part()` is not considered useful in the context of writing tests, so it was not implemented
  - None of the other pseudo-elements yield actual elements, so they can't really work
- Browsers are lenient if unsupported or invalid selectors are used in e.g. `:is()`, but this package is strict and will throw an error whenever it encounters an invalid selector.

## Composed DOM

Suppose the following DOM:

```html
<my-element>
	<template shadowrootmode="open">
		<header>
			<slot name="title"></slot>
		</header>
		<main>
			<slot></slot>
		</main>
		<footer>
			<slot name="footer"></slot>
		</footer>
	</template>

	<h1 slot="title">Very Important Page</h1>
	<p>Important information, I guess</p>
	<button slot="footer">Click me</button>
</my-element>
```

This library exposes two functions `querySelector` and `querySelectorAll` that traverse this page's composed DOM. For our example above, that means these functions work as if the page instead contained the DOM

```html
<my-element>
	<header>
		<slot name="title">
			<h1 slot="title">Very Important Page</h1>
		</slot>
	</header>
	<main>
		<slot>
			<p>Important information, I guess</p>
		</slot>
	</main>
	<footer>
		<slot name="footer">
			<button slot="footer">Click me</button>
		</slot>
	</footer>
</my-element>
```

The following queries work if you use `document.querySelector(All)`, but not via this package's functions

- `document.querySelector('h1:not(:last-child)')`
- `document.querySelector('button:not(:first-child)')`
- `document.querySelector('p:not(:only-child)')`
- `document.querySelectorAll('my-element > button')`

The following queries work if this package, but not via `document.querySelector(All)`:

- `querySelector('h1:last-child')`
- `querySelector('button:first-child')`
- `querySelector('p:only-child')`
- `querySelector('slot[name=footer] > button')`

## Playwright custom selector engine

This package exposes a `./selector-engine` entrypoint that can be used as [Playwright custom selector engine](https://playwright.dev/docs/extensibility#custom-selector-engines).

Install the engine in playwright using, for example:

```js
import {selectors} from "@playwright/test";

await selectors.register(
	"css:composed",
	import.meta.resolve("@ngx-playwright/composed-css/selector-engine"),
);
```
