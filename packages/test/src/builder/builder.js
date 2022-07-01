import {targetFromTargetString} from '@angular-devkit/architect';
import {
  resolveTargetString,
  resolveWorkspacePath,
  scheduleTarget,
} from '@snuggery/architect';
import {switchMapSuccessfulResult} from '@snuggery/architect/operators';
import {defer} from 'rxjs';
import {finalize} from 'rxjs/operators/index.js';
import {fileURLToPath} from 'url';

/**
 *
 * @param {import('./schema.js').Schema} input
 * @param {import('@angular-devkit/architect').BuilderContext} context
 * @returns {Promise<(import('@angular-devkit/architect').BuilderOutput & {success: false}) | {success: true; baseUrl: string; stop(): Promise<void>}>}
 */
async function getBaseUrl({baseUrl, devServerTarget, host, port}, context) {
  /** @type {import('@angular-devkit/architect').BuilderRun=} */
  let server;

  if (baseUrl == null) {
    if (devServerTarget == null) {
      return {
        success: false,
        error: 'Pass one of devServerTarget or baseUrl',
      };
    }

    const target = targetFromTargetString(
      resolveTargetString(context, devServerTarget),
    );
    const serverOptions = await context.getTargetOptions(target);

    /** @type {Partial<import('@angular-devkit/build-angular').DevServerBuilderOptions> & import('@angular-devkit/core').JsonObject} */
    const overrides = {
      watch: false,
      liveReload: false,
    };

    if (host !== undefined) {
      overrides.host = host;
    } else if (typeof serverOptions.host === 'string') {
      host = serverOptions.host;
    } else {
      host = overrides.host = 'localhost';
    }

    if (port !== undefined) {
      overrides.port = port;
    }

    server = await context.scheduleTarget(target, overrides);
    const result = await server.result;
    if (!result.success) {
      await server.stop();
      return {success: false};
    }

    context.addTeardown(() => {
      console.log('tearing down the building');
      /** @type {import('@angular-devkit/architect').BuilderRun} */ (
        server
      ).stop();
    });

    if (typeof serverOptions.publicHost === 'string') {
      let publicHost = serverOptions.publicHost;
      if (!/^\w+:\/\//.test(publicHost)) {
        publicHost = `${serverOptions.ssl ? 'https' : 'http'}://${publicHost}`;
      }
      const clientUrl = new URL(publicHost);
      baseUrl = clientUrl.href;
    } else if (typeof result.baseUrl === 'string') {
      baseUrl = result.baseUrl;
    } else if (typeof result.port === 'number') {
      baseUrl = new URL(
        `${serverOptions.ssl ? 'https' : 'http'}://${host}:${result.port}`,
      ).href;
    } else {
      await server.stop();
      return {
        success: false,
        error: `Failed to get address to test`,
      };
    }
  }

  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  return {
    success: true,
    baseUrl,
    async stop() {
      await server?.stop();
    },
  };
}

/**
 *
 * @param {import('./schema.js').Schema} input
 * @param {import('@angular-devkit/architect').BuilderContext} context
 * @returns {import('rxjs').Observable<import('@angular-devkit/architect').BuilderOutput>}
 */
export function execute(input, context) {
  return defer(() => getBaseUrl(input, context)).pipe(
    switchMapSuccessfulResult(({baseUrl, stop}) =>
      scheduleTarget(
        {
          builder: '@snuggery/snuggery:execute',
        },
        {
          package: '@playwright/test',
          resolveFrom: fileURLToPath(import.meta.url),
          binary: 'playwright',
          arguments: [
            'test',
            ...(input.config != null
              ? ['--config', resolveWorkspacePath(context, input.config)]
              : []),

            ...(input.browser != null ? ['--browser', input.browser] : []),
            ...(input.debug ? ['--debug'] : []),
            ...(input.forbidOnly ? ['--forbid-only'] : []),
            ...(input.globalTimeout != null
              ? ['--global-timeout', `${input.globalTimeout}`]
              : []),
            ...(input.grep != null ? ['--grep', input.grep] : []),
            ...(input.grepInvert != null
              ? ['--grep-invert', input.grepInvert]
              : []),
            ...(input.headed != null ? ['--headed'] : []),
            ...(input.list != null ? ['--list'] : []),
            ...(input.maxFailures != null
              ? ['--max-failures', `${input.maxFailures}`]
              : []),
            ...(input.output != null
              ? ['--output', resolveWorkspacePath(context, input.output)]
              : []),
            ...(input.project != null ? ['--project', input.project] : []),
            ...(input.quiet != null ? ['--quiet'] : []),
            ...(input.repeatEach != null
              ? ['--repeat-each', `${input.repeatEach}`]
              : []),
            ...(input.reporter != null ? ['--reporter', input.reporter] : []),
            ...(input.retries != null ? ['--retries', `${input.retries}`] : []),
            ...(input.shard != null ? ['--shard', input.shard] : []),
            ...(input.timeout != null ? ['--timeout', `${input.timeout}`] : []),
            ...(input.updateSnapshots != null ? ['--update-snapshots'] : []),
            ...(input.workers != null ? ['--workers', `${input.workers}`] : []),
          ],
          env: {
            PLAYWRIGHT_TEST_BASE_URL: baseUrl,
          },
          stdio: 'inherit',
        },
        context,
      ).pipe(
        finalize(() => {
          stop();
        }),
      ),
    ),
  );
}
