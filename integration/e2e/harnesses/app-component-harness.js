// cspell: disable

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, TestKey} from '@angular/cdk/testing';

import {
  SubComponentHarness,
  SubComponentSpecialHarness,
} from './sub-component-harness.js';

export class WrongComponentHarness extends ComponentHarness {
  static hostSelector = 'wrong-selector';
}

export class MainComponentHarness extends ComponentHarness {
  static path = '/';
  static hostSelector = 'test-main';

  title = this.locatorFor('h1');
  button = this.locatorFor('button');
  asyncCounter = this.locatorFor('#asyncCounter');
  counter = this.locatorFor('#counter');
  input = this.locatorFor('#input');
  value = this.locatorFor('#value');
  allLabels = this.locatorForAll('label');
  allLists = this.locatorForAll(SubComponentHarness);
  memo = this.locatorFor('textarea');
  clickTest = this.locatorFor('.click-test');
  clickTestResult = this.locatorFor('.click-test-result');
  clickModifiersResult = this.locatorFor('.click-modifiers-test-result');
  singleSelect = this.locatorFor('#single-select');
  singleSelectValue = this.locatorFor('#single-select-value');
  singleSelectChangeEventCounter = this.locatorFor(
    '#single-select-change-counter',
  );
  multiSelect = this.locatorFor('#multi-select');
  multiSelectValue = this.locatorFor('#multi-select-value');
  multiSelectChangeEventCounter = this.locatorFor(
    '#multi-select-change-counter',
  );
  contextmenuTestResult = this.locatorFor('.contextmenu-test-result');
  // Allow null for element
  nullItem = this.locatorForOptional('wrong locator');
  // Allow null for component harness
  nullComponentHarness = this.locatorForOptional(WrongComponentHarness);
  errorItem = this.locatorFor('wrong locator');

  globalEl = this.documentRootLocatorFactory().locatorFor('.sibling');
  errorGlobalEl = this.documentRootLocatorFactory().locatorFor('wrong locator');
  nullGlobalEl =
    this.documentRootLocatorFactory().locatorForOptional('wrong locator');

  optionalUsername = this.locatorForOptional('#username');
  optionalSubComponent = this.locatorForOptional(SubComponentHarness);
  errorSubComponent = this.locatorFor(WrongComponentHarness);

  taskStateTestTrigger = this.locatorFor('#task-state-test-trigger');
  taskStateTestResult = this.locatorFor('#task-state-result');

  fourItemLists = this.locatorForAll(SubComponentHarness.with({itemCount: 4}));
  toolsLists = this.locatorForAll(
    SubComponentHarness.with({title: 'List of test tools'}),
  );
  fourItemToolsLists = this.locatorForAll(
    SubComponentHarness.with({title: 'List of test tools', itemCount: 4}),
  );
  testLists = this.locatorForAll(SubComponentHarness.with({title: /test/}));
  requiredFourIteamToolsLists = this.locatorFor(
    SubComponentHarness.with({title: 'List of test tools', itemCount: 4}),
  );
  lastList = this.locatorFor(
    SubComponentHarness.with({selector: ':last-child'}),
  );
  specaialKey = this.locatorFor('.special-key');

  requiredAncestorRestrictedSubcomponent = this.locatorFor(
    SubComponentHarness.with({ancestor: '.other'}),
  );
  optionalAncestorRestrictedSubcomponent = this.locatorForOptional(
    SubComponentHarness.with({ancestor: '.other'}),
  );
  allAncestorRestrictedSubcomponent = this.locatorForAll(
    SubComponentHarness.with({ancestor: '.other'}),
  );
  requiredAncestorRestrictedMissingSubcomponent = this.locatorFor(
    SubComponentHarness.with({ancestor: '.not-found'}),
  );
  optionalAncestorRestrictedMissingSubcomponent = this.locatorForOptional(
    SubComponentHarness.with({ancestor: '.not-found'}),
  );
  allAncestorRestrictedMissingSubcomponent = this.locatorForAll(
    SubComponentHarness.with({ancestor: '.not-found'}),
  );
  multipleAncestorSelectorsSubcomponent = this.locatorForAll(
    SubComponentHarness.with({ancestor: '.other, .subcomponents'}),
  );
  directAncestorSelectorSubcomponent = this.locatorForAll(
    SubComponentHarness.with({ancestor: '.other >'}),
  );

  subcomponentHarnessesAndElements = this.locatorForAll(
    '#counter',
    SubComponentHarness,
  );
  subcomponentHarnessAndElementsRedundant = this.locatorForAll(
    SubComponentHarness.with({title: /test/}),
    'test-sub',
    SubComponentHarness,
    'test-sub',
  );
  subcomponentAndSpecialHarnesses = this.locatorForAll(
    SubComponentHarness,
    SubComponentSpecialHarness,
  );
  missingElementsAndHarnesses = this.locatorFor(
    '.not-found',
    SubComponentHarness.with({title: /not found/}),
  );
  shadows = this.locatorForAll('.in-the-shadows');
  deepShadow = this.locatorFor(
    'test-shadow-boundary test-sub-shadow-boundary > .in-the-shadows',
  );
  hoverTest = this.locatorFor('#hover-box');
  customEventBasic = this.locatorFor('#custom-event-basic');
  customEventObject = this.locatorFor('#custom-event-object');

  #testTools = this.locatorFor(SubComponentHarness);

  /** @param {number} times */
  async increaseCounter(times) {
    const button = await this.button();
    for (let i = 0; i < times; i++) {
      await button.click();
    }
  }

  /**
   * @param {number} index
   */
  async getTestTool(index) {
    const subComponent = await this.#testTools();
    return subComponent.getItem(index);
  }

  async getTestTools() {
    const subComponent = await this.#testTools();
    return subComponent.getItems();
  }

  async sendEnter() {
    await (await this.input()).sendKeys(TestKey.ENTER);
  }

  async sendAltJ() {
    await (await this.input()).sendKeys({alt: true}, 'j');
  }

  async getTaskStateResult() {
    await (await this.taskStateTestTrigger()).click();
    // Wait for async tasks to complete since the click caused a
    // timeout to be scheduled outside of the NgZone.
    await this.waitForTasksOutsideAngular();
    return (await this.taskStateTestResult()).text();
  }
}
