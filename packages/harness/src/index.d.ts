export {_setParallelImplementation, parallel} from "./change-detection.js";
export {
	type AnyComponentHarness,
	ComponentHarness,
	type ComponentHarnessConstructor,
	ContentContainerComponentHarness,
} from "./component-harness.js";
export type {ElementDimensions} from "./element-dimensions.js";
export type {HarnessEnvironment} from "./harness-environment.js";
export type {HarnessLoader} from "./harness-loader.js";
export {
	type AsyncOptionPredicate,
	type AsyncPredicate,
	type BaseHarnessFilters,
	HarnessPredicate,
	type HarnessQuery,
} from "./harness-predicate.js";
export type {
	AsyncFactoryFn,
	LocatorFactory,
	LocatorFnResult,
} from "./locator-factory.js";
export {
	type EventData,
	type ModifierKeys,
	type TestElement,
	TestKey,
	type TextOptions,
} from "./test-element.js";
export {getNoKeysSpecifiedError} from "./test-element-errors.js";
export {_getTextWithExcludedElements} from "./text-filtering.js";
