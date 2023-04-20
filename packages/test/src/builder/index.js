import {createBuilder} from '@snuggery/architect';

import {execute} from './builder.js';

/**
 * @typedef {import('./schema').Schema} Schema
 */

export default createBuilder(execute);
