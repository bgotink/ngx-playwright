import {
	type TestElement as AngularTestElement,
	ComponentHarness as AngularComponentHarness,
	type HarnessLoader as AngularHarnessLoader,
	type HarnessPredicate as AngularHarnessPredicate,
} from "@angular/cdk/testing";
import {
	type TestElement,
	type LocatorFnResult,
	ComponentHarness,
	type HarnessLoader,
	type HarnessPredicate,
} from "@ngx-playwright/harness";

function verifyAssignable<T>(value: Pick<T, keyof T>): void;
function verifyAssignable() {}

function create<T>(): T {
	return null!;
}

class TestHarness extends ComponentHarness {
	static hostSelector = "my-test";

	header = this.locatorFor("header");
}

class AngularTestHarness extends AngularComponentHarness {
	static hostSelector = "my-test";

	footer = this.locatorFor("footer");
}

verifyAssignable<AngularTestElement>(create<TestElement>());
verifyAssignable<TestElement>(create<AngularTestElement>());

verifyAssignable<AngularComponentHarness>(create<ComponentHarness>());
verifyAssignable<ComponentHarness>(create<AngularComponentHarness>());

verifyAssignable<AngularHarnessLoader>(create<HarnessLoader>());
// verifyAssignable<HarnessLoader>(create<AngularHarnessLoader>());

verifyAssignable<TestHarness>(create<LocatorFnResult<[typeof TestHarness]>>());
verifyAssignable<TestHarness>(
	create<LocatorFnResult<[HarnessPredicate<TestHarness>]>>(),
);
verifyAssignable<AngularTestHarness>(
	create<LocatorFnResult<[AngularHarnessPredicate<AngularTestHarness>]>>(),
);
