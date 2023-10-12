import moment from 'moment-timezone';
import { map } from 'rxjs/operators';

import { getTimeZone, getTimeZoneInfo } from '../../datetime';
import { DataFrame, Field, FieldType, TransformationApplicabilityLevels } from '../../types';
import { DataTransformerInfo } from '../../types/transformations';

import { DataTransformerID } from './ids';

export interface FormatTimeTransformerOptions {
  timeField: string;
  outputFormat: string;
  useTimezone: boolean;
}

export const formatTimeTransformer: DataTransformerInfo<FormatTimeTransformerOptions> = {
  id: DataTransformerID.formatTime,
  name: 'Format Time',
  description: 'Set the output format of a time field',
  defaultOptions: { timeField: '', outputFormat: '', useTimezone: true },
  isApplicable: (data: DataFrame[]) => {
    // Search for a time field
    // if there is one then we can use this transformation
    for (const frame of data) {
      for (const field of frame.fields) {
        if (field.type === 'time') {
          return TransformationApplicabilityLevels.Applicable;
        }
      }
    }

    return TransformationApplicabilityLevels.NotApplicable;
  },
  isApplicableDescription: "The Format time transformation requires a time field to work. No time field could be found.",
  operator: (options) => (source) =>
    source.pipe(
      map((data) => {
        // If a field and a format are configured
        // then format the time output
        const formatter = createTimeFormatter(options.timeField, options.outputFormat, options.useTimezone);

        if (!Array.isArray(data) || data.length === 0) {
          return data;
        }

        return data.map((frame) => ({
          ...frame,
          fields: formatter(frame.fields),
        }));
      })
    ),
};

/**
 * @internal
 */
export const createTimeFormatter =
  (timeField: string, outputFormat: string, useTimezone: boolean) => (fields: Field[]) => {
    const tz = getTimeZone();

    return fields.map((field) => {
      // Find the configured field
      if (field.name === timeField) {
        // Update values to use the configured format
        const newVals = field.values.map((value) => {
          const date = moment(value);

          // Apply configured timezone if the
          // option has been set. Otherwise
          // use the date directly
          if (useTimezone) {
            const info = getTimeZoneInfo(tz, value);
            const realTz = info !== undefined ? info.ianaName : 'UTC';

            return date.tz(realTz).format(outputFormat);
          } else {
            return date.format(outputFormat);
          }
        });

        return {
          ...field,
          type: FieldType.string,
          values: newVals,
        };
      }

      return field;
    });
  };
