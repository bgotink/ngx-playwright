import {test, createTest, expect} from "@ngx-playwright/test";

import {MainComponentHarness} from "../harnesses/app-component-harness.js";

test.describe.parallel("the inScreen fixture", () => {
	test.describe("without passing a page", () => {
		test("it should pass in a screen", ({inScreen}) =>
			inScreen(MainComponentHarness, (_, screen) => {
				expect(_).toEqual({});
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inScreen}) =>
			inScreen(MainComponentHarness, ({button}, screen) => {
				expect(isATestElement(button)).toBe(true);
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure multiple properties", ({inScreen}) =>
			inScreen(MainComponentHarness, ({button, allLabels}, screen) => {
				expect(isATestElement(button)).toBe(true);
				expect(isATestElement(allLabels[0])).toBe(true);

				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure renamed properties", ({inScreen}) =>
			inScreen(
				MainComponentHarness,
				({button: one, allLabels: two}, screen) => {
					expect(isATestElement(one)).toBe(true);
					expect(isATestElement(two[0])).toBe(true);

					expect(screen).toEqual(expect.any(MainComponentHarness));
				},
			));

		test("it should destructure destructured properties", ({inScreen}) =>
			inScreen(
				MainComponentHarness,
				({button: one, allLabels: [two]}, screen) => {
					expect(isATestElement(one)).toBe(true);
					expect(isATestElement(two)).toBe(true);

					expect(screen).toEqual(expect.any(MainComponentHarness));
				},
			));

		test("it should destructure with comments", ({inScreen}) =>
			inScreen(
				MainComponentHarness,
				// prettier-ignore
				({



          // a comment
          button: one,
          /* other */ allLabels /** comment*/: //
           [two //
          ]//
        ,}, screen) => {
          expect(isATestElement(one)).toBe(true);
          expect(isATestElement(two)).toBe(true);

          expect(screen).toEqual(expect.any(MainComponentHarness));
        },
			));
	});

	test.describe("passing the global page", () => {
		test("it should pass in a screen", ({inScreen, page}) =>
			inScreen(page, MainComponentHarness, (_, screen) => {
				expect(_).toEqual({});
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inScreen, page}) =>
			inScreen(page, MainComponentHarness, ({button}, screen) => {
				expect(isATestElement(button)).toBe(true);
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));
	});

	test.describe("passing a separate page", () => {
		/** @type {import('@ngx-playwright/test').Page} */
		let otherPage;

		test.beforeEach(async ({context}) => {
			otherPage = await context.newPage();
		});

		test("it should pass in a screen", ({inScreen}) =>
			inScreen(otherPage, MainComponentHarness, (_, screen) => {
				expect(_).toEqual({});
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inScreen}) =>
			inScreen(otherPage, MainComponentHarness, ({button}, screen) => {
				expect(isATestElement(button)).toBe(true);
				expect(screen).toEqual(expect.any(MainComponentHarness));
			}));
	});

	/** @param {import('@angular/cdk/testing').TestElement} el */
	function isATestElement(el) {
		return typeof el.matchesSelector === "function";
	}
});

test.describe("the createTest function", () => {
	const test = createTest(MainComponentHarness);

	test("it should pass in a screen", ({screen, $}) => {
		expect($).toEqual({});
		expect(screen).toEqual(expect.any(MainComponentHarness));
	});

	test("it should destructure", ({$: {button}, screen}) => {
		expect(isATestElement(button)).toBe(true);
		expect(screen).toEqual(expect.any(MainComponentHarness));
	});

	test("it should destructure multiple properties", ({
		$: {button, allLabels},
		screen,
	}) => {
		expect(isATestElement(button)).toBe(true);
		expect(isATestElement(allLabels[0])).toBe(true);

		expect(screen).toEqual(expect.any(MainComponentHarness));
	});

	test("it should destructure renamed properties", ({
		$: {button: one, allLabels: two},
	}) => {
		expect(isATestElement(one)).toBe(true);
		expect(isATestElement(two[0])).toBe(true);
	});

	test("it should destructure destructured properties", ({
		$: {
			button: one,
			allLabels: [two],
		},
		screen,
	}) => {
		expect(isATestElement(one)).toBe(true);
		expect(isATestElement(two)).toBe(true);

		expect(screen).toEqual(expect.any(MainComponentHarness));
	});

	// prettier-ignore
	test('it should destructure with comments',
  ({
      $: {


        // a comment
        button: one,
        /* other */ allLabels /** comment*/: //
          [two //
        ]//
      ,}
    , screen}) => {
    expect(isATestElement(one)).toBe(true);
    expect(isATestElement(two)).toBe(true);

    expect(screen).toEqual(expect.any(MainComponentHarness));
  });

	/** @param {import('@angular/cdk/testing').TestElement} el */
	function isATestElement(el) {
		return typeof el.matchesSelector === "function";
	}
});
