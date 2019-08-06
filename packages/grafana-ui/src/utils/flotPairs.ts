// Types
import { NullValueMode, GraphSeriesValue, Field } from '@grafana/data';

export interface FlotPairsOptions {
  xField: Field;
  yField: Field;
  nullValueMode?: NullValueMode;
}

export function getFlotPairs({ xField, yField, nullValueMode }: FlotPairsOptions): GraphSeriesValue[][] {
  const vX = xField.values;
  const vY = yField.values;
  const length = vX.getLength();
  if (vY.getLength() !== length) {
    throw new Error('Unexpected field length');
  }

  const ignoreNulls = nullValueMode === NullValueMode.Ignore;
  const nullAsZero = nullValueMode === NullValueMode.AsZero;

  const pairs: any[][] = [];

  for (let i = 0; i < length; i++) {
    const x = vX.get(i);
    let y = vY.get(i);

    if (y === null) {
      if (ignoreNulls) {
        continue;
      }
      if (nullAsZero) {
        y = 0;
      }
    }

    // X must be a value
    if (x === null) {
      continue;
    }

    pairs.push([x, y]);
  }
  return pairs;
}
