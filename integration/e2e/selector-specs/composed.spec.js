import {test, expect} from "@ngx-playwright/test";

/** @param {Element[]} elements */
function getIds(elements) {
	return elements.map((el) => el.id);
}

test.describe("composed CSS selector", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(new URL("fixture.html", import.meta.url).href);
	});

	test("light DOM works", async ({page}) => {
		await expect(
			page.locator("composed-css=:root").getAttribute("id"),
		).resolves.toEqual("1");

		await expect(
			page.locator("composed-css=.light").getAttribute("id"),
		).resolves.toEqual("2");

		await expect(
			page.locator("composed-css=.light > .intermediary").getAttribute("id"),
		).resolves.toEqual("3");
		await expect(
			page
				.locator("composed-css=.light > .intermediary > .leaf")
				.evaluateAll(getIds),
		).resolves.toEqual(["4", "5", "6"]);

		const light = page.locator(".light");

		await expect(
			light.locator("composed-css=.leaf").evaluateAll(getIds),
		).resolves.toEqual(["4", "5", "6"]);
		await expect(
			light
				.locator("composed-css=:scope > .intermediary >.leaf")
				.evaluateAll(getIds),
		).resolves.toEqual(["4", "5", "6"]);

		await expect(
			page.locator("composed-css=.light .leaf").evaluateAll(getIds),
		).resolves.toEqual(["4", "5", "6"]);
		await expect(
			page.locator("composed-css=:root .light .leaf").evaluateAll(getIds),
		).resolves.toEqual(["4", "5", "6"]);

		await expect(
			light.locator("composed-css=.leaf.first + .leaf").getAttribute("id"),
		).resolves.toEqual("5");

		await expect(
			light.locator("composed-css=.leaf.first ~ .leaf").evaluateAll(getIds),
		).resolves.toEqual(["5", "6"]);

		await expect(
			light.locator("composed-css=.leaf:is(.first + *)").getAttribute("id"),
		).resolves.toEqual("5");
		await expect(
			light.locator("composed-css=.leaf:where(.first + *)").getAttribute("id"),
		).resolves.toEqual("5");

		await expect(
			light.locator("composed-css=div").evaluateAll(getIds),
		).resolves.toEqual(["2", "3", "4", "5", "6", "7"]);

		// Waiting on https://github.com/LeaVerou/parsel/issues/74
		// await expect(
		// 	light.locator("composed-css=:has(> .leaf)").evaluateAll(getIds),
		// ).resolves.toEqual(["3"]);
		await expect(
			light.locator("composed-css=:scope > :has(.leaf)").evaluateAll(getIds),
		).resolves.toEqual(["3"]);
		await expect(
			light
				.locator("composed-css=:not(:is(.leaf), :has(.leaf))")
				.getAttribute("id"),
		).resolves.toEqual("7");
	});

	test("shadow DOM works", async ({page}) => {
		await expect(
			page.locator("composed-css=.shadow").getAttribute("id"),
		).resolves.toEqual("8");

		await expect(
			page.locator("composed-css=.shadow > .intermediary").getAttribute("id"),
		).resolves.toEqual("9");
		await expect(
			page.locator("composed-css=.shadow > .intermediary > .leaf").count(),
		).resolves.toBe(0);
		await expect(
			page
				.locator("composed-css=.shadow > .intermediary > slot > .leaf")
				.evaluateAll(getIds),
		).resolves.toEqual(["12", "13", "14"]);

		const shadow = page.locator(".shadow");

		await expect(
			shadow.locator("composed-css=.leaf").evaluateAll(getIds),
		).resolves.toEqual(["12", "13", "14"]);
		await expect(
			shadow
				.locator("composed-css=:scope > .intermediary > slot >.leaf")
				.evaluateAll(getIds),
		).resolves.toEqual(["12", "13", "14"]);

		await expect(
			page.locator("composed-css=.shadow .leaf").evaluateAll(getIds),
		).resolves.toEqual(["12", "13", "14"]);
		await expect(
			page.locator("composed-css=:root .shadow .leaf").evaluateAll(getIds),
		).resolves.toEqual(["12", "13", "14"]);

		await expect(
			shadow.locator("composed-css=.leaf.first + .leaf").getAttribute("id"),
		).resolves.toEqual("13");

		await expect(
			shadow.locator("composed-css=.leaf.first ~ .leaf").evaluateAll(getIds),
		).resolves.toEqual(["13", "14"]);

		await expect(
			shadow.locator("composed-css=.leaf:is(.first + *)").getAttribute("id"),
		).resolves.toEqual("13");
		await expect(
			shadow.locator("composed-css=.leaf:where(.first + *)").getAttribute("id"),
		).resolves.toEqual("13");

		await expect(
			shadow.locator("composed-css=div").evaluateAll(getIds),
		).resolves.toEqual(["8", "9", "12", "13", "14", "11"]);

		// Waiting on https://github.com/LeaVerou/parsel/issues/74
		// await expect(
		// 	shadow.locator("composed-css=:has(> .leaf)").evaluateAll(getIds),
		// ).resolves.toEqual(["10"]);
		await expect(
			shadow.locator("composed-css=:scope > :has(.leaf)").evaluateAll(getIds),
		).resolves.toEqual(["9"]);
		await expect(
			shadow
				.locator("composed-css=:not(:is(.leaf), :has(.leaf))")
				.evaluateAll(getIds),
		).resolves.toEqual(["11"]);
	});

	test("should correctly access slotted content and default content", async ({
		page,
	}) => {
		await expect(
			page
				.locator("#slot-children")
				.locator("composed-css=span")
				.evaluateAll(getIds),
		).resolves.toEqual(["3", "2"]);

		await expect(
			page
				.locator("#slot-children slot:not([name])")
				.locator("composed-css=span")
				.evaluateAll(getIds),
		).resolves.toEqual(["3"]);
		await expect(
			page
				.locator("#slot-children slot[name=alt]")
				.locator("composed-css=span")
				.evaluateAll(getIds),
		).resolves.toEqual(["2"]);

		await expect(
			page.locator("composed-css=#slot-children #1").count(),
		).resolves.toBe(0);
	});

	test("support for (first/last/only)-(child/of-type) selectors", async ({
		page,
	}) => {
		const fixture = page.locator("#slot-nth");

		await expect(
			fixture
				.locator("composed-css=slot:not([name]) :first-child")
				.evaluateAll(getIds),
		).resolves.toEqual(["1"]);
		await expect(
			fixture
				.locator("composed-css=slot[name=alt] :first-child")
				.evaluateAll(getIds),
		).resolves.toEqual(["3"]);
		await expect(
			fixture
				.locator('composed-css=slot[name="alt-too"] :first-child')
				.evaluateAll(getIds),
		).resolves.toEqual(["8"]);

		await expect(
			fixture
				.locator("composed-css=slot:not([name]) :last-child")
				.evaluateAll(getIds),
		).resolves.toEqual(["7"]);
		await expect(
			fixture
				.locator("composed-css=slot[name=alt] :last-child")
				.evaluateAll(getIds),
		).resolves.toEqual(["5"]);
		await expect(
			fixture
				.locator('composed-css=slot[name="alt-too"] :last-child')
				.evaluateAll(getIds),
		).resolves.toEqual(["8"]);

		await expect(
			fixture.locator("composed-css=:only-child").evaluateAll(getIds),
		).resolves.toEqual(["8"]);

		await expect(
			fixture.locator("composed-css=:only-of-type").evaluateAll(getIds),
		).resolves.toEqual(["4", "8"]);
	});

	test("support for nth-of-type selectors", async ({page}) => {
		const fixture = page.locator("#slot-nth slot:not([name])");

		await expect(
			fixture
				.locator("composed-css=:scope :nth-of-type(1)")
				.evaluateAll(getIds),
		).resolves.toEqual(["1", "2"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-of-type(2)")
				.evaluateAll(getIds),
		).resolves.toEqual(["6", "7"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-of-type(2n)")
				.evaluateAll(getIds),
		).resolves.toEqual(["6", "7"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-of-type(2n -1)")
				.evaluateAll(getIds),
		).resolves.toEqual(["1", "2"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-of-type(-n + 1)")
				.evaluateAll(getIds),
		).resolves.toEqual(["1", "2"]);
	});

	test("support for nth-child selectors", async ({page}) => {
		const fixture = page.locator("#slot-nth slot:not([name])");

		await expect(
			fixture.locator("composed-css=:scope :nth-child(1)").evaluateAll(getIds),
		).resolves.toEqual(["1"]);
		await expect(
			fixture.locator("composed-css=:scope :nth-child(2)").evaluateAll(getIds),
		).resolves.toEqual(["2"]);

		await expect(
			fixture.locator("composed-css=:scope :nth-child(2n)").evaluateAll(getIds),
		).resolves.toEqual(["2", "7"]);

		await expect(
			fixture
				.locator("composed-css=:scope :nth-child(n + 3)")
				.evaluateAll(getIds),
		).resolves.toEqual(["6", "7"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-child(-n + 3)")
				.evaluateAll(getIds),
		).resolves.toEqual(["1", "2", "6"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-child(2n + 2)")
				.evaluateAll(getIds),
		).resolves.toEqual(["2", "7"]);
		await expect(
			fixture
				.locator("composed-css=:scope :nth-child(2n + 3)")
				.evaluateAll(getIds),
		).resolves.toEqual(["6"]);

		await expect(
			fixture
				.locator("composed-css=:scope :nth-child(1 of b)")
				.evaluateAll(getIds),
		).resolves.toEqual(["2"]);
	});

	test("support for :has(>/+/~ selector)", async ({page}) => {
		const fixture = page.locator(".shadow");

		await expect(
			fixture.locator("composed-css=:has(.last)").evaluateAll(getIds),
		).resolves.toEqual(["8", "9", "10"]);
		await expect(
			fixture.locator("composed-css=:has(> .last)").evaluateAll(getIds),
		).resolves.toEqual(["10"]);

		await expect(
			fixture.locator("composed-css=.leaf:has(+ .last)").evaluateAll(getIds),
		).resolves.toEqual(["13"]);
		await expect(
			fixture.locator("composed-css=.leaf:has(~ .last)").evaluateAll(getIds),
		).resolves.toEqual(["12", "13"]);
	});
});
