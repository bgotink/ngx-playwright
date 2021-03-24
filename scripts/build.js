'use strict';
// @ts-check

const {createBuilder} = require('@angular-devkit/architect');
const {xfs, npath, ppath, NodeFS} = require('@yarnpkg/fslib');

const {exec} = require('./util');

class FilteredFs extends NodeFS {
  constructor(filter) {
    super();

    this.filter = filter;
  }

  async readdirPromise(p) {
    const original = await super.readdirPromise(p);

    return Promise.all(
      original.map(async f => {
        const resolved = ppath.join(p, f);

        if (
          (!/^__.*__$/.test(f) &&
            (await this.statPromise(resolved)).isDirectory()) ||
          this.filter.test(resolved)
        ) {
          return f;
        } else {
          return null;
        }
      }),
    ).then(arr => arr.filter(f => f != null));
  }

  async readdirSync(p) {
    const original = super.readdirSync(p);

    return original.filter(f => {
      const resolved = ppath.join(p, f);
      return (
        this.statSync(resolved).isDirectory() || this.filter.test(resolved)
      );
    });
  }
}

module.exports = createBuilder(async function (_, ctx) {
  ctx.logger.info(`Building project ${ctx.target.project}`);

  const root = ppath.join(
    npath.toPortablePath(ctx.workspaceRoot),
    (await ctx.getProjectMetadata(ctx.target.project)).root,
  );
  const dist = ppath.join(root, 'dist');

  try {
    await xfs.removePromise(dist, {recursive: true});
    await xfs.mkdirPromise(dist);

    await Promise.all([
      tsc(root),

      xfs.copyFilePromise(
        ppath.join(root, 'README.md'),
        ppath.join(dist, 'README.md'),
      ),
      xfs.copyFilePromise(
        ppath.join(npath.toPortablePath(__dirname), '../LICENSE.md'),
        ppath.join(dist, 'LICENSE.md'),
      ),

      xfs.copyPromise(dist, ppath.join(root, 'src'), {
        baseFs: new FilteredFs(/\.d\.ts$|\.json$/),
      }),

      xfs.readJsonPromise(ppath.join(root, 'package.json')).then(pJson => {
        delete pJson.scripts;
        delete pJson.devDependencies;
        delete pJson.private;
        delete pJson.resolutions;
        delete pJson.workspaces;

        return xfs.writeJsonPromise(ppath.join(dist, 'package.json'), pJson);
      }),
    ]);

    await pack(root);
  } catch (e) {
    return {
      success: false,
      error: e?.message ?? e,
    };
  }

  return {success: true};
});

let tscPath;
{
  const typescriptPath = require.resolve('typescript/package.json');
  tscPath = ppath.join(
    ppath.dirname(typescriptPath),
    require(typescriptPath).bin.tsc,
  );
}

function tsc(root) {
  return exec(process.argv0, [tscPath], root);
}

function pack(root) {
  return exec('yarn', ['snuggery-workspace', 'pack'], root);
}
