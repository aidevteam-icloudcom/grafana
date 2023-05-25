import React from 'react';

import { DataQuery } from '@grafana/schema';

import { ScopedVars } from './ScopedVars';
import { PanelData } from './panel';
import { RawTimeRange, TimeZone } from './time';

// Plugin Extensions types
// ---------------------------------------

export enum PluginExtensionTypes {
  link = 'link',
  component = 'component',
}

type PluginExtensionBase = {
  id: string;
  type: PluginExtensionTypes;
  title: string;
  description: string;
  pluginId: string;
};

export type PluginExtensionLink = PluginExtensionBase & {
  type: PluginExtensionTypes.link;
  path?: string;
  onClick?: (event?: React.MouseEvent) => void;
};

export type PluginExtensionComponent = PluginExtensionBase & {
  type: PluginExtensionTypes.component;
  component: React.ComponentType;
};

export type PluginExtension = PluginExtensionLink | PluginExtensionComponent;

// Objects used for registering extensions (in app plugins)
// --------------------------------------------------------

export type PluginExtensionBaseConfig<Context extends object = object, ExtraProps extends object = object> = Pick<
  PluginExtensionBase,
  'title' | 'description' | 'type'
> &
  ExtraProps & {
    // The unique identifier of the Extension Point
    // (Core Grafana extension point ids are available in the `PluginExtensionPoints` enum)
    extensionPointId: string;

    // (Optional) A function that can be used to configure the extension dynamically based on the extension point's context
    configure?: (
      context?: Readonly<Context>
    ) => Partial<{ title: string; description: string } & ExtraProps> | undefined;
  };

export type PluginExtensionLinkConfig<Context extends object = object> = PluginExtensionBaseConfig<
  Context,
  Pick<PluginExtensionLink, 'path'> & {
    type: PluginExtensionTypes.link;
    onClick?: (event: React.MouseEvent | undefined, helpers: PluginExtensionEventHelpers<Context>) => void;
  }
>;

export type PluginExtensionComponentConfig<Context extends object = object> = PluginExtensionBaseConfig<
  Context,
  Pick<PluginExtensionComponent, 'component'> & {
    type: PluginExtensionTypes.component;
  }
>;

export type PluginExtensionConfig = PluginExtensionLinkConfig | PluginExtensionComponentConfig;

export type PluginExtensionEventHelpers<Context extends object = object> = {
  context?: Readonly<Context>;
  // Opens a modal dialog and renders the provided React component inside it
  openModal: (options: {
    // The title of the modal
    title: string;
    // A React element that will be rendered inside the modal
    body: React.ElementType<{ onDismiss?: () => void }>;
  }) => void;
};

// Extension Points & Contexts
// --------------------------------------------------------

// Extension Points available in core Grafana
export enum PluginExtensionPoints {
  DashboardPanelMenu = 'grafana/dashboard/panel/menu',
  DataSourceConfig = 'grafana/datasources/config',
}

export type PluginExtensionPanelContext = {
  pluginId: string;
  id: number;
  title: string;
  timeRange: RawTimeRange;
  timeZone: TimeZone;
  dashboard: Dashboard;
  targets: DataQuery[];
  scopedVars?: ScopedVars;
  data?: PanelData;
};

type Dashboard = {
  uid: string;
  title: string;
  tags: string[];
};
