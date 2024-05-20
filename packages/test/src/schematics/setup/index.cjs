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
 * @param {import("./schema.cjs").Schema} options
 * @returns {import("@angular-devkit/schematics").Rule}
 */
exports.factory = function (options) {
	return async (tree) => {
		const [projectName, project, isAngularProject] = getProject(
			options,
			await getWorkspace(tree),
		);

		const extension = options.typescript ? "ts" : "mjs";
		const angular = options.angular ?? isAngularProject;

		return chain([
			mergeWith(
				apply(url(`./files-${extension}`), [
					applyTemplates({
						dot: ".",
					}),
					move(path.join(project.root, "playwright")),
				]),
			),
			mergeWith(
				apply(url(`./files-${options.harnesses ? "harness" : "no-harness"}`), [
					applyTemplates({
						dot: ".",
						prefix: project.prefix ?? "app",

						extension,
						importExtension: extension === "ts" ? "js" : extension,

						harnessPackage:
							angular ? "@angular/cdk/testing" : "@ngx-playwright/test",
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
							`playwright/playwright.config.${extension}`,
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
 * @param {import('./schema.cjs').Schema} options
 * @param {import('@snuggery/core').WorkspaceDefinition} workspace
 * @returns {[string, import('@snuggery/core').ProjectDefinition, boolean]}
 */
function getProject(options, workspace) {
	let projectName = options.project;
	if (projectName == null) {
		const projectsWithServeTarget = Array.from(workspace.projects)
			.filter(([, project]) => project.targets.has("serve"))
			.map(([name]) => name);
		if (projectsWithServeTarget.length !== 1) {
			if (projectsWithServeTarget.length === 0) {
				throw new SchematicsException(
					`Couldn't find any projects to configure e2e tests for, no projects have a "serve" target`,
				);
			}

			throw new SchematicsException(
				`Multiple projects with a "serve" target found, pass one project name with --project`,
			);
		}

		projectName = /** @type {string} */ (projectsWithServeTarget[0]);
	}

	if (!workspace.projects.has(projectName)) {
		throw new SchematicsException(
			`Project ${JSON.stringify(projectName)} doesn't exist in the workspace`,
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
			serveTarget.builder.startsWith("@angular-devkit/build-angular:") ||
			serveTarget.builder.startsWith("@angular/build:"),
	];
}
