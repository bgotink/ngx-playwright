/**
 * @fileoverview Init-script injected into the browser context to set up the `frameworkStabilizers`
 * property to include a stabilizer that waits for the application's scripts to be loaded.
 *
 * This fixes a gap in Angular's `frameworkStabilizers` since those don't exist yet while
 * angular is still loading.
 */

(function () {
	// prettier-ignore
	const frameworkStabilizers =
		/** @type {import('./angular-types.js').AngularWindow} */ (
			globalThis
		).frameworkStabilizers ??= [];

	let ready = false;
	/** @type {Promise<void>} */
	const domLoaded = new Promise((resolve) => {
		// Init scripts registered by playwright run before the page's own scripts,
		// so in theory DOMContentLoaded hasn't fired yet.
		// On pages without external stylesheets and without scripts, DOMContentLoaded
		// can already have fired, e.g. on `about:blank`.
		if (document.readyState === "complete") {
			resolve();
			return;
		}

		document.addEventListener(
			"DOMContentLoaded",
			() => {
				ready = true;
				resolve();
			},
			{
				once: true,
			},
		);
	});

	frameworkStabilizers.push((callback) => {
		const didWork = !ready;
		domLoaded.then(() => callback(didWork));
	});
})();
