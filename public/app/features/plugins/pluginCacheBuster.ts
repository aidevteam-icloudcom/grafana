const cache: Record<string, string> = {};
const defaultBust = Date.now();

type CacheablePlugin = {
  path: string;
  version: string;
};

// TODO: should we use pluginId rather than path?
export function registerPluginInCache({ path, version }: CacheablePlugin): void {
  if (!cache[path]) {
    cache[path] = encodeURI(version);
  }
}

// TODO: should we use pluginId rather than path?
export function invalidatePluginInCache(pluginId: string): void {
  const path = `plugins/${pluginId}/module`;
  if (cache[path]) {
    delete cache[path];
  }
}

export function locateWithCache(load: { address: string }): string {
  const { address } = load;
  const path = extractPath(address);

  if (!path) {
    return `${address}?_cache=${defaultBust}`;
  }

  const version = cache[path];
  const bust = version || defaultBust;
  return `${address}?_cache=${bust}`;
}

function extractPath(address: string): string | undefined {
  const match = /\/public\/(plugins\/.+\/module)\.js/i.exec(address);
  if (!match) {
    return;
  }
  const [_, path] = match;
  if (!path) {
    return;
  }
  return path;
}
