import {
	resolveTargetString,
	resolveWorkspacePath,
	scheduleTarget,
	BuildFailureError,
	firstValueFrom,
	targetFromTargetString,
} from "@snuggery/architect";
import {env} from "node:process";
import {fileURLToPath} from "node:url";

/**
 *
 * @param {import('./schema.js').Schema} input
 * @param {import('@snuggery/architect').BuilderContext} context
 */
async function getBaseUrl({baseUrl, devServerTarget, host, port, ui}, context) {
	let stop = async () => {};

	if (baseUrl == null) {
		if (devServerTarget == null) {
			throw new BuildFailureError("Pass one of devServerTarget or baseUrl");
		}

		const target = targetFromTargetString(
			resolveTargetString(context, devServerTarget),
		);
		const serverOptions = await context.getTargetOptions(target);

		/** @type {Partial<import('@angular/build').DevServerBuilderOptions> & import('@snuggery/core').JsonObject} */
		const overrides = {
			// Using the UI doesn't necessarily mean watching is enabled, but as watch
			// can be toggled in the UI we have to assume it's enabled.
			// cspell:ignore PWTEST
			watch: !!(ui || env.PWTEST_WATCH),
			// Live reload would lead to reloading running tests, which can only lead
			// to confusing errors.
			liveReload: false,
		};

		if (host !== undefined) {
			overrides.host = host;
		} else if (typeof serverOptions.host === "string") {
			host = serverOptions.host;
		} else {
			host = overrides.host = "localhost";
		}

		if (port !== undefined) {
			overrides.port = port;
		}

		const server = await context.scheduleTarget(target, overrides);
		stop = () => server.stop();

		const result = await server.result;
		if (!result.success) {
			await stop();
			throw new BuildFailureError(
				result.error ??
					`Building ${resolveTargetString(context, devServerTarget)} failed`,
			);
		}

		context.addTeardown(stop);

		if (typeof serverOptions.publicHost === "string") {
			let publicHost = serverOptions.publicHost;
			if (!/^\w+:\/\//.test(publicHost)) {
				publicHost = `${serverOptions.ssl ? "https" : "http"}://${publicHost}`;
			}
			const clientUrl = new URL(publicHost);
			baseUrl = clientUrl.href;
		} else if (typeof result.baseUrl === "string") {
			baseUrl = result.baseUrl;
		} else if (typeof result.port === "number") {
			baseUrl = new URL(
				`${serverOptions.ssl ? "https" : "http"}://${host}:${result.port}`,
			).href;
		} else {
			await stop();
			throw new BuildFailureError(`Failed to get address to test`);
		}
	}

	if (baseUrl && !baseUrl.endsWith("/")) {
		baseUrl += "/";
	}

	return {
		baseUrl,
		stop,
	};
}

/**
 * @param {import('./schema.js').Schema} input
 * @param {import('@snuggery/architect').BuilderContext} context
 */
export async function execute(input, context) {
	const {baseUrl, stop} = await getBaseUrl(input, context);

	try {
		await firstValueFrom(
			context,
			scheduleTarget(
				{
					builder: "@snuggery/snuggery:execute",
				},
				{
					package: "@playwright/test",
					resolveFrom: fileURLToPath(import.meta.url),
					binary: "playwright",
					arguments: [
						"test",
						...(input.config != null ?
							["--config", resolveWorkspacePath(context, input.config)]
						:	[]),

						...(input.browser != null ? ["--browser", input.browser] : []),
						...(input.debug ? ["--debug"] : []),
						...(input.forbidOnly ? ["--forbid-only"] : []),
						...(input.fullyParallel ? ["--fully-parallel"] : []),
						...(input.globalTimeout != null ?
							["--global-timeout", `${input.globalTimeout}`]
						:	[]),
						...(input.grep != null ? ["--grep", input.grep] : []),
						...(input.grepInvert != null ?
							["--grep-invert", input.grepInvert]
						:	[]),
						...(input.headed ? ["--headed"] : []),
						...(input.ignoreSnapshots ? ["--ignore-snapshots"] : []),
						...(input.list ? ["--list"] : []),
						...(input.maxFailures != null ?
							["--max-failures", `${input.maxFailures}`]
						:	[]),
						...(input.output != null ?
							["--output", resolveWorkspacePath(context, input.output)]
						:	[]),
						...(input.passWithNoTests ? ["--pass-with-no-tests"] : []),
						...(input.project != null ? ["--project", input.project] : []),
						...(input.quiet ? ["--quiet"] : []),
						...(input.repeatEach != null ?
							["--repeat-each", `${input.repeatEach}`]
						:	[]),
						...(input.reporter != null ? ["--reporter", input.reporter] : []),
						...(input.retries != null ? ["--retries", `${input.retries}`] : []),
						...(input.shard != null ? ["--shard", input.shard] : []),
						...(input.timeout != null ? ["--timeout", `${input.timeout}`] : []),
						...(input.trace != null ? ["--trace", input.trace] : []),
						...(input.ui ? ["--ui"] : []),
						...(input.updateSnapshots ? ["--update-snapshots"] : []),
						...(input.workers != null ? ["--workers", `${input.workers}`] : []),
					],
					env: {
						PLAYWRIGHT_TEST_BASE_URL: baseUrl,
					},
					stdio: "inherit",
				},
				context,
			),
		);
	} finally {
		await stop();
	}
}
