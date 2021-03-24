'use strict';
// @ts-check

const {createBuilder} = require('@angular-devkit/architect');
const {tags} = require('@angular-devkit/core');
const {npath} = require('@yarnpkg/fslib');

const {exec, pipe} = require('./util');

module.exports = createBuilder(async function ({tag}, ctx) {
  ctx.logger.info(`Publishing project...`);

  const root = npath.toPortablePath(ctx.workspaceRoot);

  try {
    await exec('git', ['diff', '--quiet', '--exit-code'], root);
    await exec('git', ['diff', '--cached', '--quiet', '--exit-code'], root);
  } catch {
    return {
      success: false,
      error: `Git repository isn't clean`,
    };
  }

  const versionApplyOutput = await pipe(
    'yarn',
    ['version', 'apply', '--all', '--json'],
    root,
  );
  /** @type {{cwd: string, ident: string, oldVersion: string, newVersion: string}[]} */
  const data = versionApplyOutput
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  ctx.logger.info('Version updates:');
  for (const {cwd, ident, oldVersion, newVersion} of data) {
    if (cwd && newVersion && ident) {
      ctx.logger.info(
        `${ident.padEnd(20, ' ')} ${oldVersion.padEnd(
          10,
          ' ',
        )} -> ${newVersion}`,
      );
    } else {
      return {success: false, error: 'Failed to apply version'};
    }
  }

  await exec(
    'git',
    [
      'commit',
      '--all',
      '--message',
      tags.stripIndents`{chore} release ${data.length} package${
        data.length > 1 ? 's' : ''
      }
    
      ${data
        .map(
          line => `- ${line.ident}: ${line.oldVersion} -> ${line.newVersion}`,
        )
        .join('\n')}
      `,
    ],
    root,
  );

  for (const {ident, newVersion} of data) {
    await exec(
      'git',
      ['tag', `${ident}@${newVersion}`, '--message', `${ident}@${newVersion}`],
      root,
    );
  }

  await exec('sn', ['build', 'all'], root);

  try {
    for (const {cwd} of data) {
      await exec(
        'yarn',
        [
          'snuggery-workspace',
          'publish',
          ...(typeof tag === 'string' ? ['--tag', tag] : []),
        ],
        cwd,
      );
    }
  } catch (e) {
    return {
      success: false,
      error: e?.message ?? e,
    };
  }

  return {success: true};
});
