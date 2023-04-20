/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';

export class CompoundSelectorHarness extends ComponentHarness {
  static hostSelector = '.some-div, .some-span';

  static with(options = {}) {
    return new HarnessPredicate(CompoundSelectorHarness, options);
  }

  async getText() {
    return (await this.host()).text();
  }
}
