// Note: CJS file because Angular's CLI doesn't support ESM yet

const {
  SchematicsException,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url,
} = require('@angular-devkit/schematics');
const {getWorkspace, updateWorkspace} = require('@snuggery/schematics');
const {posix: path} = require('path');

/**
 *
 * @param {import("./schema.js").Schema} options
 * @returns {import("@angular-devkit/schematics").Rule}
 */
exports.factory = function (options) {
  return async tree => {
    const [projectName, project] = getProject(
      options,
      await getWorkspace(tree),
    );

    return chain([
      mergeWith(
        apply(url('./files'), [
          applyTemplates({
            dot: '.',
            prefix: project.prefix ?? 'app',
          }),
          move(path.join(project.root, 'playwright')),
        ]),
      ),
      updateWorkspace(workspace => {
        const project =
          /** @type {import('@snuggery/core').ProjectDefinition} */ (
            workspace.projects.get(projectName)
          );

        project.targets.set('e2e', {
          builder: '@ngx-playwright/test:run',
          options: {
            config: path.join(project.root, 'playwright/playwright.config.js'),
            devServerTarget: 'serve',
          },
          configurations: {
            ci: {
              forbidOnly: true,
            },
          },
        });
      }),
    ]);
  };
};

/**
 * @param {import('./schema.js').Schema} options
 * @param {import('@snuggery/core').WorkspaceDefinition} workspace
 * @returns {[string, import('@snuggery/core').ProjectDefinition]}
 */
function getProject(options, workspace) {
  const applicationProjectNames = Array.from(workspace.projects)
    .filter(([, project]) => project.extensions.type === 'application')
    .map(([name]) => name);

  let projectName = options.project;
  if (projectName == null) {
    if (applicationProjectNames.length !== 1) {
      if (applicationProjectNames.length === 0) {
        throw new SchematicsException(
          `Couldn't find any application projects to configure e2e tests for`,
        );
      }

      throw new SchematicsException(
        `Multiple applications found, pass one project name with --project`,
      );
    }

    projectName = /** @type {string} */ (applicationProjectNames[0]);
  }

  if (!workspace.projects.has(projectName)) {
    throw new SchematicsException(
      `Project ${JSON.stringify(projectName)} doesn't exist in the workspace`,
    );
  }

  if (!applicationProjectNames.includes(projectName)) {
    throw new SchematicsException(
      `Project ${JSON.stringify(projectName)} is not an application project`,
    );
  }

  const project = /** @type {import('@snuggery/core').ProjectDefinition} */ (
    workspace.projects.get(projectName)
  );
  if (project.targets.has('e2e') && !options.replaceE2eTarget) {
    throw new SchematicsException(
      `Project ${JSON.stringify(
        projectName,
      )} already has an e2e target, pass --replace-e2e-target to replace that target`,
    );
  }

  return [projectName, project];
}
