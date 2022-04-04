// cspell: disable

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness} from '@angular/cdk/testing';

export class FakeOverlayHarness extends ComponentHarness {
  static hostSelector = '.fake-overlay';

  /** Gets the description of the fake overlay. */
  async getDescription() {
    return (await this.host()).text();
  }
}
