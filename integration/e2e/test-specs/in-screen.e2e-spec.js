import {MainComponentHarness} from "../harnesses/app-component-harness.js";

import {test, createTest, expect} from "./test.js";

test.describe.parallel("the inHarness fixture", () => {
	test.describe("without passing a page", () => {
		test("it should pass in a harness", ({inHarness}) =>
			inHarness(MainComponentHarness, (_, harness) => {
				expect(_).toEqual({});
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inHarness}) =>
			inHarness(MainComponentHarness, ({button}, harness) => {
				expect(isATestElement(button)).toBe(true);
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure multiple properties", ({inHarness}) =>
			inHarness(MainComponentHarness, ({button, allLabels}, harness) => {
				expect(isATestElement(button)).toBe(true);
				expect(isATestElement(allLabels[0])).toBe(true);

				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure renamed properties", ({inHarness}) =>
			inHarness(
				MainComponentHarness,
				({button: one, allLabels: two}, harness) => {
					expect(isATestElement(one)).toBe(true);
					expect(isATestElement(two[0])).toBe(true);

					expect(harness).toEqual(expect.any(MainComponentHarness));
				},
			));

		test("it should destructure destructured properties", ({inHarness}) =>
			inHarness(
				MainComponentHarness,
				({button: one, allLabels: [two]}, harness) => {
					expect(isATestElement(one)).toBe(true);
					expect(isATestElement(two)).toBe(true);

					expect(harness).toEqual(expect.any(MainComponentHarness));
				},
			));

		test("it should destructure with comments", ({inHarness}) =>
			inHarness(
				MainComponentHarness,
				// prettier-ignore
				({



          // a comment
          button: one,
          /* other */ allLabels /** comment*/: //
           [two //
          ]//
        ,}, harness) => {
          expect(isATestElement(one)).toBe(true);
          expect(isATestElement(two)).toBe(true);

          expect(harness).toEqual(expect.any(MainComponentHarness));
        },
			));
	});

	test.describe("passing the global page", () => {
		test("it should pass in a harness", ({inHarness, page}) =>
			inHarness(page, MainComponentHarness, (_, harness) => {
				expect(_).toEqual({});
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inHarness, page}) =>
			inHarness(page, MainComponentHarness, ({button}, harness) => {
				expect(isATestElement(button)).toBe(true);
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));
	});

	test.describe("passing a separate page", () => {
		/** @type {import('@ngx-playwright/test').Page} */
		let otherPage;

		test.beforeEach(async ({context}) => {
			otherPage = await context.newPage();
		});

		test("it should pass in a harness", ({inHarness}) =>
			inHarness(otherPage, MainComponentHarness, (_, harness) => {
				expect(_).toEqual({});
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));

		test("it should destructure", ({inHarness}) =>
			inHarness(otherPage, MainComponentHarness, ({button}, harness) => {
				expect(isATestElement(button)).toBe(true);
				expect(harness).toEqual(expect.any(MainComponentHarness));
			}));
	});

	/** @param {import('@angular/cdk/testing').TestElement} el */
	function isATestElement(el) {
		return typeof el.matchesSelector === "function";
	}
});

test.describe("the createTest function", () => {
	const test = createTest(MainComponentHarness);

	test("it should pass in a harness", ({harness, $}) => {
		expect($).toEqual({});
		expect(harness).toEqual(expect.any(MainComponentHarness));
	});

	test("it should destructure", ({$: {button}, harness}) => {
		expect(isATestElement(button)).toBe(true);
		expect(harness).toEqual(expect.any(MainComponentHarness));
	});

	test("it should destructure multiple properties", ({
		$: {button, allLabels},
		harness,
	}) => {
		expect(isATestElement(button)).toBe(true);
		expect(isATestElement(allLabels[0])).toBe(true);

		expect(harness).toEqual(expect.any(MainComponentHarness));
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
		harness,
	}) => {
		expect(isATestElement(one)).toBe(true);
		expect(isATestElement(two)).toBe(true);

		expect(harness).toEqual(expect.any(MainComponentHarness));
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
    , harness}) => {
    expect(isATestElement(one)).toBe(true);
    expect(isATestElement(two)).toBe(true);

    expect(harness).toEqual(expect.any(MainComponentHarness));
  });

	/** @param {import('@angular/cdk/testing').TestElement} el */
	function isATestElement(el) {
		return typeof el.matchesSelector === "function";
	}
});
