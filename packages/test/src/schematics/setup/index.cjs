// Note: CJS file because Angular's CLI doesn't support ESM yet

const {
	SchematicsException,
	apply,
	applyTemplates,
	chain,
	mergeWith,
	move,
	url,
} = require("@angular-devkit/schematics");
const {getWorkspace, updateWorkspace} = require("@snuggery/schematics");
const {posix: path} = require("path");

/**
 *
 * @param {import("./schema.js").Schema} options
 * @returns {import("@angular-devkit/schematics").Rule}
 */
exports.factory = function (options) {
	return async (tree, context) => {
		const [projectName, project, isAngularProject] = getProject(
			options,
			await getWorkspace(tree),
			context,
		);

		const ext = options.typescript ? "ts" : "mjs";
		const type = options.angular ?? isAngularProject ? "angular" : "vanilla";

		return chain([
			mergeWith(
				apply(url(`./files-${type}-${ext}`), [
					applyTemplates({
						dot: ".",
						prefix: project.prefix ?? "app",
					}),
					move(path.join(project.root, "playwright")),
				]),
			),
			updateWorkspace((workspace) => {
				const project =
					/** @type {import('@snuggery/core').ProjectDefinition} */ (
						workspace.projects.get(projectName)
					);

				project.targets.set("e2e", {
					builder: "@ngx-playwright/test:run",
					options: {
						config: path.join(
							project.root,
							`playwright/playwright.config.${ext}`,
						),
						devServerTarget: "serve",
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
 * @param {import('@angular-devkit/schematics').SchematicContext} context
 * @returns {[string, import('@snuggery/core').ProjectDefinition, boolean]}
 */
function getProject(options, workspace, context) {
	const applicationProjectNames = Array.from(workspace.projects)
		.filter(([, project]) => project.extensions.projectType === "application")
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
				`Multiple applications found, pass one existing application project name with --project`,
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
		context.logger.warn(
			`Project ${JSON.stringify(projectName)} is not an application project`,
		);
	}

	const project = /** @type {import('@snuggery/core').ProjectDefinition} */ (
		workspace.projects.get(projectName)
	);
	if (project.targets.has("e2e") && !options.replaceE2eTarget) {
		throw new SchematicsException(
			`Project ${JSON.stringify(
				projectName,
			)} already has an e2e target, pass --replace-e2e-target to replace that target`,
		);
	}
	const serveTarget = project.targets.get("serve");
	if (!serveTarget) {
		throw new SchematicsException(
			`Project ${JSON.stringify(
				projectName,
			)} doesn't have a "serve" target, add one before adding e2e tests`,
		);
	}

	return [
		projectName,
		project,
		serveTarget.builder.startsWith("@nx/angular:") ||
			serveTarget.builder.startsWith("@angular-devkit/build-angular:"),
	];
}
