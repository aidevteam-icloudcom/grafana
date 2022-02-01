import { ArrayVector, DataFrame, FieldType } from '@grafana/data';

const INSERT_MODES = {
  threshold: (prev: number, next: number, threshold: number) => prev + threshold,
  midpoint: (prev: number, next: number, threshold: number) => (prev + next) / 2,
  // previous time + 1ms to prevent StateTimeline from forward-interpolating prior state
  plusone: (prev: number, next: number, threshold: number) => prev + 1,
};

type InsertMode = keyof typeof INSERT_MODES;

export function applyNullInsertThreshold(
  frame: DataFrame,
  refFieldName?: string | null,
  insertMode: InsertMode = 'threshold'
): DataFrame {
  if (frame.length < 2) {
    return frame;
  }

  const refField = frame.fields.find((field) => {
    // note: getFieldDisplayName() would require full DF[]
    return refFieldName != null ? field.name === refFieldName : field.type === FieldType.time;
  });

  if (refField == null) {
    return frame;
  }

  const thresholds = frame.fields.map((field) => field.config.custom?.insertNulls ?? refField.config.interval ?? null);

  const uniqueThresholds = new Set(thresholds);

  uniqueThresholds.delete(null);

  if (uniqueThresholds.size === 0) {
    return frame;
  } else if (uniqueThresholds.size === 1) {
    const threshold = [...uniqueThresholds][0];

    if (threshold <= 0) {
      return frame;
    }

    const refValues = refField.values.toArray();

    const frameValues = frame.fields.map((field) => field.values.toArray());

    const filledFieldValues = nullInsertThreshold(refValues, frameValues, threshold, insertMode);

    if (filledFieldValues === frameValues) {
      return frame;
    }

    const outFrame: DataFrame = {
      ...frame,
      length: filledFieldValues[0].length,
      fields: frame.fields.map((field, i) => ({
        ...field,
        values: new ArrayVector(filledFieldValues[i]),
      })),
    };

    return outFrame;
  } else {
    // TODO: unique threshold-per-field (via overrides) is unimplemented
    // should be done by processing each (refField + thresholdA-field1 + thresholdA-field2...)
    // as a separate nullInsertThreshold() dataset, then re-join into single dataset via join()
    return frame;
  }
}

export function nullInsertThreshold(
  refValues: number[],
  frameValues: any[][],
  threshold: number,
  insertMode: InsertMode
) {
  const getInsertValue = INSERT_MODES[insertMode];

  const len = refValues.length;
  let prevValue: number = refValues[0];
  const refValuesNew: number[] = [prevValue];

  for (let i = 1; i < len; i++) {
    const curValue = refValues[i];

    if (curValue - prevValue > threshold) {
      refValuesNew.push(getInsertValue(prevValue, curValue, threshold));
    }

    refValuesNew.push(curValue);

    prevValue = curValue;
  }

  const filledLen = refValuesNew.length;

  if (filledLen === len) {
    return frameValues;
  }

  const filledFieldValues: any[][] = [];

  for (let fieldValues of frameValues) {
    let filledValues;

    if (fieldValues !== refValues) {
      filledValues = Array(filledLen);

      for (let i = 0, j = 0; i < filledLen; i++) {
        filledValues[i] = refValues[j] === refValuesNew[i] ? fieldValues[j++] : null;
      }
    } else {
      filledValues = refValuesNew;
    }

    filledFieldValues.push(filledValues);
  }

  return filledFieldValues;
}
