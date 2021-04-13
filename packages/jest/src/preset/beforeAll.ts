/// <reference path="../global.d.ts" />

import type {HarnessEnvironment} from '@angular/cdk/testing';
import {
  createEnvironment,
  manuallyStabilize as _manuallyStabilize,
  autoStabilize as _autoStabilize,
  isAutoStabilizing,
} from '@ngx-playwright/harness';
import type {Page} from 'playwright-core';

const cachedEnvironments = new WeakMap<Page, HarnessEnvironment<unknown>>();

function isPromiseLike(value: any): value is PromiseLike<any> {
  return !!value && typeof value.then === 'function';
}

Object.defineProperty(globalThis, 'harnessEnvironment', {
  configurable: true,
  get: () => {
    let environment = cachedEnvironments.get(page);

    if (environment == null) {
      environment = createEnvironment(page);
      cachedEnvironments.set(page, environment);
    }

    return environment;
  },
});

global.autoStabilize = (fn?: () => any): any => {
  if (!fn) {
    _autoStabilize(() => page);
    return;
  }

  return () => {
    if (isAutoStabilizing()) {
      // already automatically stabilizing
      return fn();
    }

    _autoStabilize(() => page);
    let isPromise = false;
    try {
      const result = fn();

      if (isPromiseLike(result)) {
        isPromise = true;
        return Promise.resolve(result).finally(() => manuallyStabilize());
      } else {
        return result;
      }
    } finally {
      if (!isPromise) {
        manuallyStabilize();
      }
    }
  };
};

global.manuallyStabilize = (fn?: () => any): any => {
  if (!fn) {
    _manuallyStabilize();
    return;
  }

  return () => {
    if (!isAutoStabilizing()) {
      // already manually stabilizing
      return fn();
    }

    _manuallyStabilize();
    let isPromise = false;
    try {
      const result = fn();

      if (isPromiseLike(result)) {
        isPromise = true;
        return Promise.resolve(result).finally(() => autoStabilize());
      } else {
        return result;
      }
    } finally {
      if (!isPromise) {
        autoStabilize();
      }
    }
  };
};

autoStabilize();
