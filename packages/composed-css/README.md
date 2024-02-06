# `@ngx-playwright/composed-css`

<!-- cspell:word shadowrootmode -->

This package exposes two functions `querySelector` and `querySelectorAll` that allow for querying the composed DOM, i.e. the DOM as it is shown by the browser, with light and shadow DOM intermixed.

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
- `querySelector('slot[name=footer] button')`

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
