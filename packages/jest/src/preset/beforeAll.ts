/// <reference path="../global.d.ts" />

import {createEnvironment, getNativeElement} from '@ngx-playwright/harness';

(global as any).harnessEnvironment = createEnvironment(page);

global.getHandle = getNativeElement;
