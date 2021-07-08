import React, { FC, useMemo } from 'react';
import { Select } from '@grafana/ui';
import {
  MapLayerConfig,
  DataFrame,
  MapLayerRegistryItem,
  PanelOptionsEditorBuilder,
  StandardEditorContext,
} from '@grafana/data';
import { geomapLayerRegistry } from '../layers/registry';
import { defaultGrafanaThemedMap } from '../layers/basemaps';
import { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';
import { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';
import { setOptionImmutably } from 'app/features/dashboard/components/PanelEditor/utils';
import { get as lodashGet } from 'lodash';

export interface LayerEditorProps<TConfig = any> {
  config?: MapLayerConfig<TConfig>;
  data: DataFrame[]; // All results
  onChange: (config: MapLayerConfig<TConfig>) => void;
  filter: (item: MapLayerRegistryItem) => boolean;
}

export const LayerEditor: FC<LayerEditorProps> = ({ config, onChange, data, filter }) => {
  // all basemaps
  const layerTypes = useMemo(() => {
    return geomapLayerRegistry.selectOptions(
      config?.type // the selected value
        ? [config.type] // as an array
        : [defaultGrafanaThemedMap.id],
      filter
    );
  }, [config?.type, filter]);

  // The options change with each layer type
  const optionsEditorBuilder = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(config?.type);
    if (!layer || !layer.registerOptionsUI) {
      return null;
    }
    const builder = new PanelOptionsEditorBuilder();
    layer.registerOptionsUI(builder);
    return builder;
  }, [config?.type]);

  // The react componnets
  const layerOptions = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(config?.type);
    if (!optionsEditorBuilder || !layer) {
      return null;
    }

    const category = new OptionsPaneCategoryDescriptor({
      id: 'Layer config',
      title: 'Layer config',
    });

    const ctx: StandardEditorContext<any> = {
      data,
      options: config?.config,
    };

    const currentConfig = { ...layer.defaultOptions, ...config?.config };
    const reg = optionsEditorBuilder.getRegistry();
    for (const pluginOption of reg.list()) {
      if (pluginOption.showIf && !pluginOption.showIf(currentConfig, data)) {
        continue;
      }

      // The nested value
      const doChange = (value: any) => {
        onChange({
          ...config,
          config: setOptionImmutably(currentConfig, pluginOption.path!, value),
        } as MapLayerConfig);
      };

      const Editor = pluginOption.editor;
      category.addItem(
        new OptionsPaneItemDescriptor({
          title: pluginOption.name,
          description: pluginOption.description,
          render: function renderEditor() {
            return (
              <Editor
                value={lodashGet(currentConfig, pluginOption.path)}
                onChange={doChange}
                item={pluginOption}
                context={ctx}
              />
            );
          },
        })
      );
    }

    return (
      <>
        <br />
        {category.items.map((item) => item.render())}
      </>
    );
  }, [optionsEditorBuilder, onChange, data, config]);

  return (
    <div>
      <Select
        options={layerTypes.options}
        value={layerTypes.current}
        onChange={(v) => {
          const layer = geomapLayerRegistry.getIfExists(v.value);
          if (!layer) {
            console.warn('layer does not exist', v);
            return;
          }
          onChange({
            type: layer.id,
            config: layer.defaultOptions, // clone?
          });
        }}
      />

      {layerOptions}
    </div>
  );
};

// const getStyles = stylesFactory((theme: GrafanaTheme) => ({
//   editorBox: css`
//     label: editorBox;
//     border: ${theme.border.width.sm} solid ${theme.colors.border2};
//     border-radius: ${theme.border.radius.sm};
//     margin: ${theme.spacing.xs} 0;
//     width: 100%;
//   `,
// }));
