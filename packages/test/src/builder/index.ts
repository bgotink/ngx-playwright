import {createBuilder} from '@angular-devkit/architect';

import {execute} from './builder';
import type {Schema} from './schema';

export {Schema};

export default createBuilder<Schema>(execute);
