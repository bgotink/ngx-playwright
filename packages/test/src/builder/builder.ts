import {
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
} from '@angular-devkit/architect';
import type {DevServerBuilderOptions} from '@angular-devkit/build-angular';
import type {JsonObject} from '@angular-devkit/core';
import {
  resolveTargetString,
  resolveWorkspacePath,
  scheduleTarget,
} from '@snuggery/architect';
import {switchMapSuccessfulResult} from '@snuggery/architect/operators';
import {defer, Observable} from 'rxjs';

import type {Schema} from './schema';

async function getBaseUrl(
  {baseUrl, devServerTarget, host, port}: Schema,
  context: BuilderContext,
): Promise<
  (BuilderOutput & {success: false}) | {success: true; baseUrl: string}
> {
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

    const overrides: Partial<DevServerBuilderOptions> & JsonObject = {
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

    const server = await context.scheduleTarget(target, overrides);
    const result = await server.result;
    if (!result.success) {
      return {success: false};
    }

    context.addTeardown(() => server.stop());

    if (typeof serverOptions.publicHost === 'string') {
      let publicHost = serverOptions.publicHost as string;
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
  };
}

export function execute(
  input: Schema,
  context: BuilderContext,
): Observable<BuilderOutput> {
  return defer(() => getBaseUrl(input, context)).pipe(
    switchMapSuccessfulResult(({baseUrl}) =>
      scheduleTarget(
        {
          builder: '@snuggery/snuggery:execute',
        },
        {
          package: '@playwright/test',
          resolveFrom: __filename,
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
      ),
    ),
  );
}
