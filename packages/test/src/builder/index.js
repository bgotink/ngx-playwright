import {createBuilder} from '@angular-devkit/architect';

import {execute} from './builder.js';

/**
 * @typedef {import('./schema').Schema} Schema
 */

export default createBuilder(execute);
