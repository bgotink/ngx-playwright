/* eslint-disable @typescript-eslint/no-var-requires */

import {
  BrowserType,
  chromium,
  ChromiumBrowser,
  firefox,
  FirefoxBrowser,
  webkit,
  WebKitBrowser,
} from 'playwright-core';

import type {BrowserSpec, RunnerBrowserSpec} from './types';

const getBrowserTypeByType = {
  chromium: () => {
    try {
      return require('playwright-chromium').chromium as typeof chromium;
    } catch {
      try {
        return require('playwright').chromium as typeof chromium;
      } catch {
        return chromium;
      }
    }
  },
  firefox: () => {
    try {
      return require('playwright-firefox').firefox as typeof firefox;
    } catch {
      try {
        return require('playwright').firefox as typeof firefox;
      } catch {
        return firefox;
      }
    }
  },
  webkit: () => {
    try {
      return require('playwright-webkit').webkit as typeof webkit;
    } catch {
      try {
        return require('playwright').webkit as typeof webkit;
      } catch {
        return webkit;
      }
    }
  },
};

function invalidBrowser(name: string): () => never {
  return () => {
    throw new Error(`Invalid browser type: ${JSON.stringify(name)}`);
  };
}

export function getBrowserType(
  spec: BrowserSpec | RunnerBrowserSpec,
): BrowserType<ChromiumBrowser | FirefoxBrowser | WebKitBrowser> {
  return (getBrowserTypeByType[spec.type] ?? invalidBrowser(spec.type))();
}
