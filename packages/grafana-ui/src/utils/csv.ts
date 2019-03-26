// Libraries
import Papa, { ParseResult, ParseConfig, Parser } from 'papaparse';
import defaults from 'lodash/defaults';
import isNumber from 'lodash/isNumber';

// polyfil for TextEncoder/TextDecoder (node & IE)
import 'fast-text-encoding'; //'text-encoding';  // 'fast-text-encoding';

// Types
import { SeriesData, Field, FieldType } from '../types/index';
import { guessFieldTypeFromValue } from './processSeriesData';

export enum CSVHeaderStyle {
  full,
  name,
  none,
}

// Subset of all parse options
export interface CSVConfig {
  delimiter?: string; // default: ","
  newline?: string; // default: "\r\n"
  quoteChar?: string; // default: '"'
  encoding?: string; // default: "",
  headerStyle?: CSVHeaderStyle;
}

export interface CSVParseCallbacks {
  /**
   * Get a callback before any rows are processed
   * This can return a modified table to force any
   * Column configurations
   */
  onHeader: (table: SeriesData) => void;

  // Called after each row is read and
  onRow: (row: any[]) => void;
}

export interface CSVOptions {
  config?: CSVConfig;
  callback?: CSVParseCallbacks;
}

export function readCSV(csv: string, options?: CSVOptions): Promise<SeriesData[]> {
  // Wraps the string in a ReadableStreamReader
  return readCSVFromStream(
    {
      cancel: () => {
        return Promise.reject('unsupported');
      },
      read: () => {
        const uint8Array = new TextEncoder().encode(csv);
        return Promise.resolve({ done: true, value: uint8Array });
      },
      releaseLock: () => {},
    },
    options
  );
}

enum ParseState {
  Starting,
  InHeader,
  ReadingRows,
}

type FieldParser = (value: string) => any;

export function readCSVFromStream(
  reader: ReadableStreamReader<Uint8Array>,
  options?: CSVOptions
): Promise<SeriesData[]> {
  return new Promise((resolve, reject) => {
    const config = options ? options.config : {};
    const callback = options ? options.callback : null;

    const field: FieldParser[] = [];
    let state = ParseState.Starting;
    let table: SeriesData = {
      fields: [],
      rows: [],
    };
    const tables: SeriesData[] = [table];

    const step = (results: ParseResult, parser: Parser): void => {
      for (let i = 0; i < results.data.length; i++) {
        const line: string[] = results.data[i];
        if (line.length > 0) {
          const first = line[0]; // null or value, papaparse does not return ''
          if (first) {
            // Comment or header queue
            if (first.startsWith('#')) {
              // Look for special header column
              // #{columkey}#a,b,c
              const idx = first.indexOf('#', 2);
              if (idx > 0) {
                const k = first.substr(1, idx - 1);

                // Simple object used to check if headers match
                const headerKeys: Field = {
                  name: '#',
                  type: FieldType.number,
                  unit: '#',
                  dateFormat: '#',
                };

                // Check if it is a known/supported column
                if (headerKeys.hasOwnProperty(k)) {
                  // Starting a new table after reading rows
                  if (state === ParseState.ReadingRows) {
                    table = {
                      fields: [],
                      rows: [],
                    };
                    tables.push(table);
                  }

                  padColumnWidth(table.fields, line.length);
                  const fields: any[] = table.fields; // cast to any so we can lookup by key
                  const v = first.substr(idx + 1);
                  fields[0][k] = v;
                  for (let j = 1; j < fields.length; j++) {
                    fields[j][k] = line[j];
                  }
                  state = ParseState.InHeader;
                  continue;
                }
              } else if (state === ParseState.Starting) {
                table.fields = makeFieldsFor(line);
                state = ParseState.InHeader;
                continue;
              }
              // Ignore comment lines
              continue;
            }

            if (state === ParseState.Starting) {
              const type = guessFieldTypeFromValue(first);
              if (type === FieldType.string) {
                table.fields = makeFieldsFor(line);
                state = ParseState.InHeader;
                continue;
              }
              table.fields = makeFieldsFor(new Array(line.length));
              table.fields[0].type = type;
              state = ParseState.InHeader; // fall through to read rows
            }
          }

          if (state === ParseState.InHeader) {
            padColumnWidth(table.fields, line.length);
            state = ParseState.ReadingRows;
          }

          if (state === ParseState.ReadingRows) {
            // Make sure colum structure is valid
            if (line.length > table.fields.length) {
              padColumnWidth(table.fields, line.length);
              if (callback) {
                callback.onHeader(table);
              } else {
                // Expand all rows with nulls
                for (let x = 0; x < table.rows.length; x++) {
                  const row = table.rows[x];
                  while (row.length < line.length) {
                    row.push(null);
                  }
                }
              }
            }

            const row: any[] = [];
            for (let j = 0; j < line.length; j++) {
              const v = line[j];
              if (v) {
                if (!field[j]) {
                  field[j] = makeFieldParser(v, table.fields[j]);
                }
                row.push(field[j](v));
              } else {
                row.push(null);
              }
            }

            if (callback) {
              // Send the header after we guess the type
              if (table.rows.length === 0) {
                callback.onHeader(table);
                table.rows.push(row); // Only add the first row
              }
              callback.onRow(row);
            } else {
              table.rows.push(row);
            }
          }
        }
      }
    };

    const papacfg = {
      ...config,
      dynamicTyping: false,
      skipEmptyLines: true,
      comments: false, // Keep comment lines
      step,
    } as ParseConfig;

    const process = (value: ReadableStreamReadResult<Uint8Array>): any => {
      if (value.value) {
        const str = new TextDecoder().decode(value.value);
        Papa.parse(str, papacfg);
      }
      if (value.done) {
        resolve(tables);
        return;
      }
      return reader.read().then(process);
    };
    reader.read().then(process);
  });
}

function makeFieldParser(value: string, field: Field): FieldParser {
  if (!field.type) {
    if (field.name === 'time' || field.name === 'Time') {
      field.type = FieldType.time;
    } else {
      field.type = guessFieldTypeFromValue(value);
    }
  }

  if (field.type === FieldType.number) {
    return (value: string) => {
      return parseFloat(value);
    };
  }

  // Will convert anything that starts with "T" to true
  if (field.type === FieldType.boolean) {
    return (value: string) => {
      return !(value[0] === 'F' || value[0] === 'f' || value[0] === '0');
    };
  }

  // Just pass the string back
  return (value: string) => value;
}

/**
 * Creates a field object for each string in the list
 */
function makeFieldsFor(line: string[]): Field[] {
  const fields: Field[] = [];
  for (let i = 0; i < line.length; i++) {
    const v = line[i] ? line[i] : 'Column ' + (i + 1);
    fields.push({ name: v });
  }
  return fields;
}

/**
 * Makes sure the colum has valid entries up the the width
 */
function padColumnWidth(fields: Field[], width: number) {
  if (fields.length < width) {
    for (let i = fields.length; i < width; i++) {
      fields.push({
        name: 'Field ' + (i + 1),
      });
    }
  }
}

type FieldWriter = (value: any) => string;

function writeValue(value: any, config: CSVConfig): string {
  const str = value.toString();
  if (str.includes('"')) {
    // Escape the double quote characters
    return config.quoteChar + str.replace('"', '""') + config.quoteChar;
  }
  if (str.includes('\n') || str.includes(config.delimiter)) {
    return config.quoteChar + str + config.quoteChar;
  }
  return str;
}

function makeFieldWriter(field: Field, config: CSVConfig): FieldWriter {
  if (field.type) {
    if (field.type === FieldType.boolean) {
      return (value: any) => {
        return value ? 'true' : 'false';
      };
    }

    if (field.type === FieldType.number) {
      return (value: any) => {
        if (isNumber(value)) {
          return value.toString();
        }
        return writeValue(value, config);
      };
    }
  }

  return (value: any) => writeValue(value, config);
}

function getHeaderLine(key: string, fields: Field[], config: CSVConfig): string {
  for (const f of fields) {
    if (f.hasOwnProperty(key)) {
      let line = '#' + key + '#';
      for (let i = 0; i < fields.length; i++) {
        if (i > 0) {
          line = line + config.delimiter;
        }

        const v = (fields[i] as any)[key];
        if (v) {
          line = line + writeValue(v, config);
        }
      }
      return line + config.newline;
    }
  }
  return '';
}

export function toCSV(data: SeriesData[], config?: CSVConfig): string {
  let csv = '';
  config = defaults(config, {
    delimiter: ',',
    newline: '\r\n',
    quoteChar: '"',
    encoding: '',
    headerStyle: CSVHeaderStyle.name,
  });

  for (const series of data) {
    const { rows, fields } = series;
    if (config.headerStyle === CSVHeaderStyle.full) {
      csv =
        csv +
        getHeaderLine('name', fields, config) +
        getHeaderLine('type', fields, config) +
        getHeaderLine('unit', fields, config) +
        getHeaderLine('dateFormat', fields, config);
    } else if (config.headerStyle === CSVHeaderStyle.name) {
      for (let i = 0; i < fields.length; i++) {
        if (i > 0) {
          csv += config.delimiter;
        }
        csv += fields[i].name;
      }
      csv += config.newline;
    }
    const writers = fields.map(field => makeFieldWriter(field, config!));
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        if (j > 0) {
          csv = csv + config.delimiter;
        }

        const v = row[j];
        if (v !== null) {
          csv = csv + writers[j](v);
        }
      }
      csv = csv + config.newline;
    }
    csv = csv + config.newline;
  }

  return csv;
}
