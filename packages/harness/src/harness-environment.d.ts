import type {HarnessLoader} from "./harness-loader.js";
import type {LocatorFactory} from "./locator-factory.js";

/**
 * Base harness environment interface
 */
export interface HarnessEnvironment extends HarnessLoader, LocatorFactory {}
