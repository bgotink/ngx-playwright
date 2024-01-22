import {createBuilder} from "@snuggery/architect";

import {execute} from "./builder.js";

/**
 * @typedef {import('./schema.js').Schema} Schema
 */

export default createBuilder(execute);
