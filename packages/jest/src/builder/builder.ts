import {
  createBuilder,
  targetFromTargetString,
  BuilderContext,
  BuilderOutput,
} from '@angular-devkit/architect';
import type {DevServerBuilderOptions} from '@angular-devkit/build-angular';
import type {JsonObject} from '@angular-devkit/core';
import {
  getProjectPath,
  resolveTargetString,
  resolveWorkspacePath,
} from '@snuggery/architect';
import {runCLI} from 'jest';
import type {Config as JestConfig} from '@jest/types';

import type {Schema} from './schema';

async function runJest(
  baseUrl: string,
  jestConfig: string,
  context: BuilderContext,
): Promise<BuilderOutput> {
  try {
    const {
      results: {success},
    } = await runCLI(
      {
        config: jestConfig,
        testURL: baseUrl,
      } as JestConfig.Argv,
      [await getProjectPath(context)],
    );

    return {success};
  } catch (e) {
    return {
      success: false,
      error: `Failed to run jest: ${e.message ?? e}`,
    };
  }
}

export default createBuilder<Schema & JsonObject>(async (input, context) => {
  let {baseUrl, host, port} = input;

  let server;

  if (baseUrl == null) {
    if (input.devServerTarget == null) {
      return {
        success: false,
        error: 'Pass one of devServerTarget or baseUrl',
      };
    }

    const target = targetFromTargetString(
      resolveTargetString(context, input.devServerTarget),
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

    server = await context.scheduleTarget(target, overrides);
    const result = await server.result;
    if (!result.success) {
      return {success: false};
    }

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

  try {
    return await runJest(
      baseUrl,
      resolveWorkspacePath(context, input.jestConfig),
      context,
    );
  } catch {
    return {success: false};
  } finally {
    await server?.stop();
  }
});
