import type {TestElement} from '@angular/cdk/testing';

import {MainComponentHarness} from '../harnesses/app-component-harness';

describe('the inScreen global', () => {
  describe('without passing a page', () => {
    it(
      'should pass in a screen',
      inScreen(MainComponentHarness, (_, screen) => {
        expect(_).toEqual({});
        expect(screen).toEqual(expect.any(MainComponentHarness));
      }),
    );

    it(
      'should destructure',
      inScreen(MainComponentHarness, ({button}, screen) => {
        expect(isATestElement(button)).toBe(true);
        expect(screen).toEqual(expect.any(MainComponentHarness));
      }),
    );

    it(
      'should destructure multiple properties',
      inScreen(MainComponentHarness, ({button, allLabels}, screen) => {
        expect(isATestElement(button)).toBe(true);
        expect(isATestElement(allLabels[0]!)).toBe(true);

        expect(screen).toEqual(expect.any(MainComponentHarness));
      }),
    );

    it(
      'should destructure renamed properties',
      inScreen(
        MainComponentHarness,
        ({button: one, allLabels: two}, screen) => {
          expect(isATestElement(one)).toBe(true);
          expect(isATestElement(two[0]!)).toBe(true);

          expect(screen).toEqual(expect.any(MainComponentHarness));
        },
      ),
    );

    it(
      'should destructure destructured properties',
      inScreen(
        MainComponentHarness,
        ({button: one, allLabels: [two]}, screen) => {
          expect(isATestElement(one)).toBe(true);
          expect(isATestElement(two!)).toBe(true);

          expect(screen).toEqual(expect.any(MainComponentHarness));
        },
      ),
    );

    it(
      'should destructure with comments',
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
          expect(isATestElement(two!)).toBe(true);

          expect(screen).toEqual(expect.any(MainComponentHarness));
        },
      ),
    );
  });

  describe('passing the global page', () => {
    it(
      'should pass in a screen',
      inScreen(page, MainComponentHarness, (_, screen) => {
        expect(_).toEqual({});
        expect(screen).toEqual(expect.any(MainComponentHarness));
      }),
    );

    it(
      'should destructure',
      inScreen(page, MainComponentHarness, ({button}, screen) => {
        expect(isATestElement(button)).toBe(true);
        expect(screen).toEqual(expect.any(MainComponentHarness));
      }),
    );
  });

  describe('passing a separate page', () => {
    let otherPage: import('playwright-core').Page;

    beforeEach(async () => {
      otherPage = await browserContext.newPage();
    });

    it('should pass in a screen', () =>
      inScreen(otherPage, MainComponentHarness, (_, screen) => {
        expect(_).toEqual({});
        expect(screen).toEqual(expect.any(MainComponentHarness));
      })());

    it('should destructure', () =>
      inScreen(otherPage, MainComponentHarness, ({button}, screen) => {
        expect(isATestElement(button)).toBe(true);
        expect(screen).toEqual(expect.any(MainComponentHarness));
      })());
  });

  function isATestElement(el: TestElement) {
    return typeof el.matchesSelector === 'function';
  }
});
