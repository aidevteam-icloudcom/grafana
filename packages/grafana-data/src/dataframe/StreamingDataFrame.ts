import { Field, DataFrame, FieldType } from '../types/dataFrame';
import { QueryResultMeta } from '../types';
import { ArrayVector } from '../vector';
import { DataFrameJSON, decodeFieldValueEntities } from './DataFrameJSON';

// binary search for index of closest value
function closestIdx(num: number, arr: number[], lo?: number, hi?: number) {
  let mid;
  lo = lo || 0;
  hi = hi || arr.length - 1;
  let bitwise = hi <= 2147483647;

  while (hi - lo > 1) {
    mid = bitwise ? (lo + hi) >> 1 : Math.floor((lo + hi) / 2);

    if (arr[mid] < num) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (num - arr[lo] <= arr[hi] - num) {
    return lo;
  }

  return hi;
}

// mutable circular push
function circPush(data: number[][], newData: number[][], maxDelta = Infinity, maxLength = Infinity) {
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].concat(newData[i]);
  }

  let nlen = data[0].length;

  let sliceIdx = 0;

  if (nlen > maxLength) {
    sliceIdx = nlen - maxLength;
  }

  if (maxDelta !== Infinity) {
    let low = data[0][sliceIdx];
    let high = data[0][nlen - 1];

    if (high - low > maxDelta) {
      sliceIdx = closestIdx(high - maxDelta, data[0], sliceIdx);
    }
  }

  if (sliceIdx) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].slice(sliceIdx);
    }
  }

  return data;
}

/**
 * @alpha
 */
export interface StreamingFrameOptions {
  maxLength?: number; // 1000
  maxSeconds?: number; // how long to keep things
}

/**
 * Unlike a circular buffer, this will append and periodically slice the front
 *
 * @alpha
 */
export class StreamingDataFrame implements DataFrame {
  name?: string;
  refId?: string;
  meta?: QueryResultMeta;

  // raw field buffers
  fields: Array<Field<any, ArrayVector<any>>> = [];

  options: StreamingFrameOptions;

  constructor(frame: DataFrameJSON, opts?: StreamingFrameOptions) {
    this.options = {
      maxLength: 1000,
      ...opts,
    };
    this.update(frame);
  }

  get length() {
    if (!this.fields.length) {
      return 0;
    }
    return this.fields[0].values.length;
  }

  /**
   * apply the new message to the existing data.  This will replace the existing schema
   * if a new schema is included in the message, or append data matching the current schema
   */
  update(msg: DataFrameJSON) {
    const { schema, data } = msg;
    if (schema) {
      // Keep old values if they are the same shape
      let oldValues: ArrayVector[] | undefined;
      if (schema.fields.length === this.fields.length) {
        let same = true;
        oldValues = this.fields.map((f, idx) => {
          const oldField = this.fields[idx];
          if (f.name !== oldField.name || f.type !== oldField.type) {
            same = false;
          }
          return f.values;
        });
        if (!same) {
          oldValues = undefined;
        }
      }

      this.name = schema.name;
      this.refId = schema.refId;
      this.meta = schema.meta;

      // Create new fields from the schema
      this.fields = schema.fields.map((f, idx) => {
        return {
          config: f.config ?? {},
          name: f.name,
          labels: f.labels,
          type: f.type ?? FieldType.other,
          values: oldValues ? oldValues[idx] : new ArrayVector(),
        };
      });
    }

    if (data && data.values.length && data.values[0].length) {
      const { values, entities } = data;
      if (values.length !== this.fields.length) {
        throw new Error('update message mismatch');
      }

      if (entities) {
        entities.forEach((ents, i) => {
          if (ents) {
            decodeFieldValueEntities(ents, values[i]);
            // TODO: append replacements to field
          }
        });
      }

      let curValues = this.fields.map((f) => f.values.buffer);

      let maxMillis = (this.options.maxSeconds || Infinity) * 1e3;

      let appended = circPush(curValues, values, maxMillis, this.options.maxLength);

      appended.forEach((v, i) => {
        this.fields[i].values.buffer = v;
      });
    }
  }
}
