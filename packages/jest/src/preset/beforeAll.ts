/// <reference path="../global.d.ts" />

import type {HarnessEnvironment} from '@angular/cdk/testing';
import {createEnvironment, getNativeElement} from '@ngx-playwright/harness';
import type {Page} from 'playwright-core';

const cachedEnvironments = new WeakMap<Page, HarnessEnvironment<unknown>>();

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

globalThis.getHandle = getNativeElement;
