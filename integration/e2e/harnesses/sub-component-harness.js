// cspell: disable

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from "@angular/cdk/testing";

/**
 * @typedef {import('@angular/cdk/testing').BaseHarnessFilters & {
 *   title?: string | RegExp;
 *   itemCount?: number;
 * }} SubComponentHarnessFilters
 */

export class SubComponentHarness extends ComponentHarness {
	static hostSelector = "test-sub";

	/**
	 * @param {SubComponentHarnessFilters=} options
	 * @returns
	 */
	static with(options = {}) {
		return new HarnessPredicate(SubComponentHarness, options)
			.addOption("title", options.title, async (harness, title) =>
				HarnessPredicate.stringMatches((await harness.title()).text(), title),
			)
			.addOption(
				"item count",
				options.itemCount,
				async (harness, count) => (await harness.getItems()).length === count,
			);
	}

	title = this.locatorFor("h2");
	getItems = this.locatorForAll("li");
	globalElement = this.documentRootLocatorFactory().locatorFor("#username");

	async titleText() {
		return (await this.title()).text();
	}

	/**
	 *
	 * @param {number} index
	 */
	async getItem(index) {
		const items = await this.getItems();
		return /** @type {import('@angular/cdk/testing').TestElement} */ (
			items[index]
		);
	}
}

export class SubComponentSpecialHarness extends SubComponentHarness {
	/** @override */
	static hostSelector = "test-sub.test-special";
}
