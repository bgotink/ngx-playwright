import {test, expect} from "@ngx-playwright/test";

test.describe("inner HTML implementation", () => {
	test.use({
		innerTextWithShadows: true,
	});

	test.beforeEach(async ({page}) => {
		await page.goto(new URL("fixture.html", import.meta.url).href);
	});

	for (const fixture of ["one", "two", "three"]) {
		test(`fixture ${fixture}`, async ({page, harnessEnvironment}) => {
			const testElement = await harnessEnvironment.locatorFor(`#${fixture}`)();
			const elementHandle =
				/** @type {import('@ngx-playwright/test').ElementHandle<SVGElement | HTMLElement>} */ (
					await page.$(`#${fixture}`)
				);

			expect(await testElement.text()).toEqual(await elementHandle.innerText());
		});
	}
});
