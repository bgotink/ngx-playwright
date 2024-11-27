import {mixinFixtures} from "@bgotink/playwright-coverage";
import {test as base, createTest as createBase} from "@ngx-playwright/test";

export const test = mixinFixtures(base);
/** @type {typeof createBase} */
export const createTest = (...args) => mixinFixtures(createBase(...args));

export {expect} from "@ngx-playwright/test";
