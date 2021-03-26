import {
  createBuilder,
  targetFromTargetString,
  BuilderOutput,
  BuilderContext,
} from '@angular-devkit/architect';
import type {DevServerBuilderOptions} from '@angular-devkit/build-angular';
import type {JsonObject} from '@angular-devkit/core';
import {
  getProjectPath,
  resolveTargetString,
  resolveWorkspacePath,
} from '@snuggery/architect';
import {runCLI} from 'jest';

import type {Schema, JestConfig} from './schema';

function mapJestConfig(
  context: BuilderContext,
  config: JestConfig,
): JestConfig {
  const mappedConfig: JestConfig = {};

  for (const key of Object.keys(config) as (keyof JestConfig)[]) {
    if (
      config[key] == null ||
      (Array.isArray(config[key]) && (config[key] as unknown[]).length === 0)
    ) {
      continue;
    }

    switch (key) {
      case 'config':
      case 'outputFile':
        mappedConfig[key] = resolveWorkspacePath(context, config[key]);
        break;
      default:
        // @ts-expect-error :shrug:
        mappedConfig[key] = config[key];
    }
  }

  return mappedConfig;
}

async function runJest(
  context: BuilderContext,
  baseUrl: string,
  jestConfig: JestConfig,
): Promise<BuilderOutput> {
  try {
    const {
      results: {success},
    } = await runCLI(
      {
        $0: '',
        _: [],

        ...jestConfig,

        testURL: baseUrl,
      },
      [jestConfig.config ?? (await getProjectPath(context))],
    );

    return {success};
  } catch (e) {
    return {
      success: false,
      error: `Failed to run jest: ${e.message ?? e}`,
    };
  }
}

export default createBuilder<Schema & JsonObject>(
  async ({baseUrl, host, port, devServerTarget, ...jestOverrides}, context) => {
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
          publicHost = `${
            serverOptions.ssl ? 'https' : 'http'
          }://${publicHost}`;
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
        context,
        baseUrl,
        mapJestConfig(context, jestOverrides),
      );
    } catch {
      return {success: false};
    } finally {
      await server?.stop();
    }
  },
);
