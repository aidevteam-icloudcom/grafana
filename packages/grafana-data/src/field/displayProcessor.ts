// Libraries
import { toString, toNumber as _toNumber, isEmpty, isBoolean } from 'lodash';

// Types
import { Field, FieldType } from '../types/dataFrame';
import { DisplayProcessor, DisplayValue } from '../types/displayValue';
import { getValueFormat } from '../valueFormats/valueFormats';
import { getMappedValue } from '../utils/valueMappings';
import { dateTime } from '../datetime';
import { KeyValue, TimeZone } from '../types';
import { getScaleCalculator } from './scale';
import { getTestTheme } from '../utils/testdata/testTheme';
import { GrafanaThemeV2 } from '../themes/types';

interface DisplayProcessorOptions {
  field: Partial<Field>;
  /**
   * Will pick browser timezone if not defined
   */
  timeZone?: TimeZone;
  /**
   * Will pick 'dark' if not defined
   */
  theme: GrafanaThemeV2;
}

// Reasonable units for time
const timeFormats: KeyValue<boolean> = {
  dateTimeAsIso: true,
  dateTimeAsIsoNoDateIfToday: true,
  dateTimeAsUS: true,
  dateTimeAsUSNoDateIfToday: true,
  dateTimeAsLocal: true,
  dateTimeAsLocalNoDateIfToday: true,
  dateTimeFromNow: true,
};

export function getDisplayProcessor(options?: DisplayProcessorOptions): DisplayProcessor {
  if (!options || isEmpty(options) || !options.field) {
    return toStringProcessor;
  }

  const { field } = options;
  const config = field.config ?? {};

  let unit = config.unit;
  let hasDateUnit = unit && (timeFormats[unit] || unit.startsWith('time:'));

  if (field.type === FieldType.time && !hasDateUnit) {
    unit = `dateTimeAsSystem`;
    hasDateUnit = true;
  }

  const formatFunc = getValueFormat(unit || 'none');
  const scaleFunc = getScaleCalculator(field as Field, options.theme);

  return (value: any) => {
    const { mappings } = config;
    const isStringUnit = unit === 'string';

    if (hasDateUnit && typeof value === 'string') {
      value = dateTime(value).valueOf();
    }

    let text = toString(value);
    let numeric = isStringUnit ? NaN : toNumber(value);
    let prefix: string | undefined = undefined;
    let suffix: string | undefined = undefined;
    let shouldFormat = true;

    if (mappings && mappings.length > 0) {
      const mappedValue = getMappedValue(mappings, value);

      if (mappedValue) {
        text = mappedValue.text;
        const v = isStringUnit ? NaN : toNumber(text);

        if (!isNaN(v)) {
          numeric = v;
        }

        shouldFormat = false;
      }
    }

    if (!isNaN(numeric)) {
      if (shouldFormat && !isBoolean(value)) {
        const v = formatFunc(numeric, config.decimals, null, options.timeZone);
        text = v.text;
        suffix = v.suffix;
        prefix = v.prefix;
      }

      // Return the value along with scale info
      if (text) {
        return { text, numeric, prefix, suffix, ...scaleFunc(numeric) };
      }
    }

    if (!text) {
      if (config.noValue) {
        text = config.noValue;
      } else {
        text = ''; // No data?
      }
    }

    return { text, numeric, prefix, suffix, ...scaleFunc(-Infinity) };
  };
}

/** Will return any value as a number or NaN */
function toNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value === '' || value === null || value === undefined || Array.isArray(value)) {
    return NaN; // lodash calls them 0
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return _toNumber(value);
}

function toStringProcessor(value: any): DisplayValue {
  return { text: toString(value), numeric: toNumber(value) };
}

export function getRawDisplayProcessor(): DisplayProcessor {
  return (value: any) => ({
    text: `${value}`,
    numeric: (null as unknown) as number,
  });
}
