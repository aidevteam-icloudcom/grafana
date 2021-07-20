import { cartoLayers } from './carto';
import { esriLayers } from './esri';
import { genericLayers } from './generic';
import { osmLayers } from './osm';
import { defaultBaseLayer } from './default';

// Use CartoDB if the tile server url is not set in defaults.ini
export const defaultGrafanaThemedMap = {
  ...defaultBaseLayer,
  id: 'default',
  name: 'Default base layer',
};

/**
 * Registry for layer handlers
 * Remove all other base layers if BaseLayerDisabled is set to true in defaults.ini
 */
export const basemapLayers = [
  defaultGrafanaThemedMap,
  ...osmLayers,
  ...cartoLayers,
  ...esriLayers, // keep formatting
  ...genericLayers,
];
