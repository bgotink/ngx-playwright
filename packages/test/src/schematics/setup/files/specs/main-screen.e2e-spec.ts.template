import {expect, createTest} from '@ngx-playwright/test';

import {MainScreen} from '../screens/main-screen.js';

const test = createTest(MainScreen);

test.describe('the main screen of the application', () => {
  test('it should have a title', ({$: {title}}) => {
    expect(title).toBeTruthy();
  });
});
