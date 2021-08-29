import {readFileSync} from 'fs';
import {dirname, resolve} from 'path';

const playwrightPkgJsonPath = require.resolve('@playwright/test/package.json');

const playwrightPkgJson = JSON.parse(
  readFileSync(playwrightPkgJsonPath, 'utf-8'),
) as typeof import('@playwright/test/package.json');

const relativeBin = playwrightPkgJson.bin?.playwright;

if (typeof relativeBin !== 'string') {
  throw new Error(
    `Couldn't find playwright binary in ${dirname(playwrightPkgJsonPath)}`,
  );
}

require(resolve(dirname(playwrightPkgJsonPath), relativeBin));
