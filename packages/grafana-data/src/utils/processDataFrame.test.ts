import {
  isDataFrame,
  toLegacyResponseData,
  isTableData,
  toDataFrame,
  guessFieldTypes,
  guessFieldTypeFromValue,
} from './processDataFrame';
import { FieldType, TimeSeries, DataFrame, TableData } from '../types/index';
import { dateTime } from './moment_wrapper';
import { ArrayVector } from './vector';

describe('toDataFrame', () => {
  it('converts timeseries to series', () => {
    const input1 = {
      target: 'Field Name',
      datapoints: [[100, 1], [200, 2]],
    };
    let series = toDataFrame(input1);
    expect(series.fields[0].name).toBe(input1.target);

    const v0 = series.fields[0].values;
    const v1 = series.fields[1].values;
    expect(v0.length).toEqual(2);
    expect(v1.length).toEqual(2);
    expect(v0.get(0)).toEqual(100);
    expect(v0.get(1)).toEqual(200);
    expect(v1.get(0)).toEqual(1);
    expect(v1.get(1)).toEqual(2);

    // Should fill a default name if target is empty
    const input2 = {
      // without target
      target: '',
      datapoints: [[100, 1], [200, 2]],
    };
    series = toDataFrame(input2);
    expect(series.fields[0].name).toEqual('Value');
  });

  it('keeps dataFrame unchanged', () => {
    const input = {
      fields: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
      rows: [[100, 'A', 1], [200, 'B', 2], [300, 'C', 3]],
    };
    const series = toDataFrame(input);
    expect(series).toBe(input);
  });

  it('Guess Colum Types from value', () => {
    expect(guessFieldTypeFromValue(1)).toBe(FieldType.number);
    expect(guessFieldTypeFromValue(1.234)).toBe(FieldType.number);
    expect(guessFieldTypeFromValue(3.125e7)).toBe(FieldType.number);
    expect(guessFieldTypeFromValue(true)).toBe(FieldType.boolean);
    expect(guessFieldTypeFromValue(false)).toBe(FieldType.boolean);
    expect(guessFieldTypeFromValue(new Date())).toBe(FieldType.time);
    expect(guessFieldTypeFromValue(dateTime())).toBe(FieldType.time);
  });

  it('Guess Colum Types from strings', () => {
    expect(guessFieldTypeFromValue('1')).toBe(FieldType.number);
    expect(guessFieldTypeFromValue('1.234')).toBe(FieldType.number);
    expect(guessFieldTypeFromValue('3.125e7')).toBe(FieldType.number);
    expect(guessFieldTypeFromValue('True')).toBe(FieldType.boolean);
    expect(guessFieldTypeFromValue('FALSE')).toBe(FieldType.boolean);
    expect(guessFieldTypeFromValue('true')).toBe(FieldType.boolean);
    expect(guessFieldTypeFromValue('xxxx')).toBe(FieldType.string);
  });

  it('Guess Colum Types from series', () => {
    const series: DataFrame = ({
      fields: [
        { name: 'A (number)', values: new ArrayVector([123, null]) },
        { name: 'B (strings)', values: new ArrayVector([null, 'Hello']) },
        { name: 'C (nulls)', values: new ArrayVector([null, null]) },
        { name: 'Time', values: new ArrayVector(['2000', 1967]) },
      ],
    } as unknown) as DataFrame; // missing schemas!
    const norm = guessFieldTypes(series);
    expect(norm.fields[0].schema.type).toBe(FieldType.number);
    expect(norm.fields[1].schema.type).toBe(FieldType.string);
    expect(norm.fields[2].schema.type).toBeUndefined();
    expect(norm.fields[3].schema.type).toBe(FieldType.time); // based on name
  });
});

describe('SerisData backwards compatibility', () => {
  it('converts TimeSeries to series and back again', () => {
    const timeseries = {
      target: 'Field Name',
      datapoints: [[100, 1], [200, 2]],
    };
    const series = toDataFrame(timeseries);
    expect(isDataFrame(timeseries)).toBeFalsy();
    expect(isDataFrame(series)).toBeTruthy();

    const roundtrip = toLegacyResponseData(series) as TimeSeries;
    expect(isDataFrame(roundtrip)).toBeFalsy();
    expect(roundtrip.target).toBe(timeseries.target);
  });

  it('converts TableData to series and back again', () => {
    const table = {
      columns: [{ text: 'a', unit: 'ms' }, { text: 'b', unit: 'zz' }, { text: 'c', unit: 'yy' }],
      rows: [[100, 1, 'a'], [200, 2, 'a']],
    };
    const series = toDataFrame(table);
    expect(isTableData(table)).toBeTruthy();
    expect(isDataFrame(series)).toBeTruthy();

    const roundtrip = toLegacyResponseData(series) as TimeSeries;
    expect(isTableData(roundtrip)).toBeTruthy();
    expect(roundtrip).toMatchObject(table);
  });

  it('converts DataFrame to TableData to series and back again', () => {
    const series: DataFrame = {
      refId: 'Z',
      meta: {
        somethign: 8,
      },
      fields: [
        { name: 'T', schema: { type: FieldType.time }, values: new ArrayVector([1, 2, 3]) },
        { name: 'N', schema: { type: FieldType.number, filterable: true }, values: new ArrayVector([100, 200, 300]) },
        { name: 'S', schema: { type: FieldType.string, filterable: true }, values: new ArrayVector(['1', '2', '3']) },
      ],
    };
    const table = toLegacyResponseData(series) as TableData;
    expect(table.refId).toBe(series.refId);
    expect(table.meta).toEqual(series.meta);

    const names = table.columns.map(c => c.text);
    expect(names).toEqual(['T', 'N', 'S']);
  });
});
