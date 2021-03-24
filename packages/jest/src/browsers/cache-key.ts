import {BrowserSpec, LaunchType} from './types';

const cacheKeyCache = new WeakMap<BrowserSpec, string>();

export function getCacheKey(spec: BrowserSpec): string {
  if (cacheKeyCache.has(spec)) {
    return cacheKeyCache.get(spec)!;
  }

  const object: Record<string, unknown> = {
    type: spec.type,
    launchType: spec.launchType ?? LaunchType.Launch,
    slowMo: spec.slowMo,
    timeout: spec.timeout,
  };

  switch (spec.launchType ?? LaunchType.Launch) {
    case LaunchType.Connect:
      object.options = toSortedObject(spec.connectOptions);
      break;
    case LaunchType.Launch:
      object.options = toSortedObject(spec.launchOptions);
      break;
    case LaunchType.PersistentContext:
      object.options = toSortedObject(spec.persistentContextOptions);
      break;
  }

  const result = JSON.stringify(object);
  cacheKeyCache.set(spec, result);
  return result;
}

function toSortedObject(value: unknown): unknown {
  if (typeof value !== 'object' || !value) {
    return value ?? null;
  }

  if (Array.isArray(value)) {
    return value.map(element => toSortedObject(element));
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, toSortedObject((value as any)[key])]),
  );
}
