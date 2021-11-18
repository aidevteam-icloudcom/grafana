import { MapLayerRegistryItem, MapLayerOptions, PanelData, GrafanaTheme2, PluginState } from '@grafana/data';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { unByKey } from 'ol/Observable';
import { checkFeatureMatchesStyleRule } from '../../utils/checkFeatureMatchesStyleRule';
import { ComparisonOperation, FeatureRuleConfig, FeatureStyleConfig } from '../../types';
import { Style } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { GeomapStyleRulesEditor } from '../../editor/GeomapStyleRulesEditor';
import { defaultStyleConfig, StyleConfig } from '../../style/types';
import { getStyleConfigState } from '../../style/utils';
import { polyStyle } from '../../style/markers';
import { StyleEditor } from './StyleEditor';
export interface GeoJSONMapperConfig {
  // URL for a geojson file
  src?: string;

  // Styles that can be applied
  styles: FeatureStyleConfig[];

  // The default
  style: StyleConfig;
}

const defaultOptions: GeoJSONMapperConfig = {
  src: 'public/maps/countries.geojson',
  styles: [],
  style: defaultStyleConfig,
};

interface StyleCheckerState {
  poly: Style | Style[];
  point: Style | Style[];
  rule?: FeatureRuleConfig;
}

export const DEFAULT_STYLE_RULE: FeatureStyleConfig = {
  style: defaultStyleConfig,
  rule: {
    property: '',
    operation: ComparisonOperation.EQ,
    value: '',
  },
};

export const geojsonMapper: MapLayerRegistryItem<GeoJSONMapperConfig> = {
  id: 'geojson-value-mapper',
  name: 'Map values to GeoJSON file',
  description: 'color features based on query results',
  isBaseMap: false,
  state: PluginState.alpha,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: MapLayerOptions<GeoJSONMapperConfig>, theme: GrafanaTheme2) => {
    const config = { ...defaultOptions, ...options.config };

    const source = new VectorSource({
      url: config.src,
      format: new GeoJSON(),
    });

    const key = source.on('change', () => {
      if (source.getState() == 'ready') {
        unByKey(key);
        // var olFeatures = source.getFeatures(); // olFeatures.length === 1
        // window.setTimeout(function () {
        //     var olFeatures = source.getFeatures(); // olFeatures.length > 1
        //     // Only after using setTimeout can I search the feature list... :(
        // }, 100)

        console.log('SOURCE READY!!!', source.getFeatures().length);
      }
    });

    const styles: StyleCheckerState[] = [];
    if (config.styles) {
      for (const r of config.styles) {
        if (r.style) {
          const s = await getStyleConfigState(r.style);
          styles.push({
            point: s.maker(s.base),
            poly: polyStyle(s.base),
            rule: r.rule,
          });
        }
      }
    }
    if (true) {
      const s = await getStyleConfigState(config.style);
      styles.push({
        point: s.maker(s.base),
        poly: polyStyle(s.base),
      });
    }

    const vectorLayer = new VectorLayer({
      source,
      style: (feature: FeatureLike) => {
        const isPoint = feature.getGeometry()?.getType() === 'Point';

        for (const check of styles) {
          if (check.rule && !checkFeatureMatchesStyleRule(check.rule, feature)) {
            continue;
          }
          return isPoint ? check.point : check.poly;
        }
        return undefined; // unreachable
      },
    });

    return {
      init: () => vectorLayer,
      update: (data: PanelData) => {
        console.log('todo... find values matching the ID and update');

        // // Update each feature
        // source.getFeatures().forEach((f) => {
        //   console.log('Find: ', f.getId(), f.getProperties());
        // });
      },

      // Geojson source url
      registerOptionsUI: (builder) => {
        const features = source.getFeatures();
        console.log('FEATURES', source.getState(), features.length, options);

        builder
          .addSelect({
            path: 'config.src',
            name: 'GeoJSON URL',
            settings: {
              options: [
                { label: 'public/maps/countries.geojson', value: 'public/maps/countries.geojson' },
                { label: 'public/maps/usa-states.geojson', value: 'public/maps/usa-states.geojson' },
                { label: 'public/gazetteer/airports.geojson', value: 'public/gazetteer/airports.geojson' },
              ],
              allowCustomValue: true,
            },
            defaultValue: defaultOptions.src,
          })
          .addCustomEditor({
            id: 'config.styles',
            path: 'config.styles',
            name: 'Style Rules',
            description: 'The style for the first matching rule will apply',
            editor: GeomapStyleRulesEditor,
            settings: {},
            defaultValue: [],
          })
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: 'Default Style',
            description: 'The style to apply when no rules above match',
            editor: StyleEditor,
            settings: {
              simpleFixedValues: true,
            },
            defaultValue: defaultOptions.style,
          });
      },
    };
  },
  defaultOptions,
};
