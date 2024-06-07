import { useObservable } from 'react-use';

import { PluginExtension } from '@grafana/data';
import { UsePluginLinksParams, UsePluginExtensionsResult } from '@grafana/runtime';

import { AddedLinkRegistry } from '../registry/addedLinkRegistry';

import { getPluginExtensions } from './getPluginExtensions';

export function createUsePluginLinks(registry: AddedLinkRegistry) {
  const observableRegistry = registry.asObservable();
  const cache: {
    id: string;
    links: Record<string, { context: UsePluginLinksParams['context']; extensions: PluginExtension[] }>;
  } = {
    id: '',
    links: {},
  };

  return function usePluginLinks(options: UsePluginLinksParams): UsePluginExtensionsResult<PluginExtension> {
    const registry = useObservable(observableRegistry);

    if (!registry) {
      return { links: [], isLoading: false };
    }

    if (registry.id !== cache.id) {
      cache.id = registry.id;
      cache.extensions = {};
    }

    // `getPluginExtensions` will return a new array of objects even if it is called with the same options, as it always constructing a frozen objects.
    // Due to this we are caching the result of `getPluginExtensions` to avoid unnecessary re-renders for components that are using this hook.
    // (NOTE: we are only checking referential equality of `context` object, so it is important to not mutate the object passed to this hook.)
    const key = `${options.extensionPointId}-${options.limitPerPlugin}`;
    if (cache.extensions[key] && cache.extensions[key].context === options.context) {
      return {
        extensions: cache.extensions[key].extensions,
        isLoading: false,
      };
    }

    const { extensions } = getPluginExtensions({ ...options, registry });

    cache.extensions[key] = {
      context: options.context,
      extensions,
    };

    return {
      extensions,
      isLoading: false,
    };
  };
}
