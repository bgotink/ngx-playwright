import type {TestElement as AngularTestElement} from "@angular/cdk/testing";
import type {TestElement} from "@ngx-playwright/harness";

let ours: TestElement = null!;
let angular: AngularTestElement = null!;

ours = angular;
angular = ours;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
(function noop(..._args: unknown[]) {})(ours, angular);
