import {
  DataFrame,
  FieldConfigSource,
  FieldMatcherID,
  getFieldDisplayName,
  isSystemOverrideWithRef,
  SystemConfigOverrideRule,
} from '@grafana/data';
import { GraphNGLegendEvent, GraphNGLegendEventMode } from '@grafana/ui';

const displayOverrideRef = 'hideSeriesFrom';
const isHideSeriesOverride = isSystemOverrideWithRef(displayOverrideRef);

export const hideSeriesConfigFactory = (
  event: GraphNGLegendEvent,
  fieldConfig: FieldConfigSource<any>,
  data: DataFrame[]
): FieldConfigSource<any> => {
  const { fieldIndex, mode } = event;
  const { overrides } = fieldConfig;

  const frame = data[fieldIndex.frameIndex];

  if (!frame) {
    return fieldConfig;
  }

  const field = frame.fields[fieldIndex.fieldIndex];

  if (!field) {
    return fieldConfig;
  }

  const displayName = getFieldDisplayName(field, frame, data);
  const currentIndex = overrides.findIndex(isHideSeriesOverride);

  if (currentIndex < 0) {
    const override = createFreshOverride(displayName);

    return {
      ...fieldConfig,
      overrides: [override, ...fieldConfig.overrides],
    };
  }

  const overridesCopy = Array.from(overrides);
  const [current] = overridesCopy.splice(currentIndex, 1) as SystemConfigOverrideRule[];

  if (mode === GraphNGLegendEventMode.toggleSelection) {
    const existing = getExistingDisplayNames(current);

    if (existing.find(name => name === displayName)) {
      return {
        ...fieldConfig,
        overrides: overridesCopy,
      };
    }

    const override = createFreshOverride(displayName);

    return {
      ...fieldConfig,
      overrides: [override, ...overridesCopy],
    };
  }

  const override = createExtendedOverride(current, displayName);

  if (!override) {
    return {
      ...fieldConfig,
      overrides: overridesCopy,
    };
  }

  return {
    ...fieldConfig,
    overrides: [override, ...overridesCopy],
  };
};

const createFreshOverride = (displayName: string): SystemConfigOverrideRule => {
  return {
    __systemRef: displayOverrideRef,
    matcher: {
      id: FieldMatcherID.readOnly,
      options: {
        prefix: 'All except:',
        innerId: FieldMatcherID.byNames,
        innerOptions: {
          mode: 'exclude',
          names: [displayName],
        },
      },
    },
    properties: [
      {
        id: 'custom.hideFrom',
        value: {
          graph: true,
          legend: false,
          tooltip: false,
        },
      },
    ],
  };
};

const createExtendedOverride = (
  current: SystemConfigOverrideRule,
  displayName: string
): SystemConfigOverrideRule | undefined => {
  const property = current.properties.find(p => p.id === 'custom.hideFrom') ?? {
    id: 'custom.hideFrom',
    value: {
      graph: true,
      legend: false,
      tooltip: false,
    },
  };

  const existing = getExistingDisplayNames(current);
  const index = existing.findIndex(name => name === displayName);

  if (index < 0) {
    existing.push(displayName);
  } else {
    existing.splice(index, 1);
  }

  if (existing.length === 0) {
    return;
  }

  return {
    __systemRef: displayOverrideRef,
    matcher: {
      id: FieldMatcherID.readOnly,
      options: {
        prefix: 'All except:',
        innerId: FieldMatcherID.byNames,
        innerOptions: {
          mode: 'exclude',
          names: existing,
        },
      },
    },
    properties: [
      {
        ...property,
        value: {
          graph: true,
          legend: false,
          tooltip: false,
        },
      },
    ],
  };
};

const getExistingDisplayNames = (rule: SystemConfigOverrideRule): string[] => {
  const names = rule.matcher.options?.innerOptions?.names;
  if (!Array.isArray(names)) {
    return [];
  }
  return names;
};
