import { ConstantVector } from './vector';

// interface MySpecialObject {
//   time: DateTime;
//   name: string;
//   value: number;
// }

describe('seriesDataFacade', () => {
  it('Constant iterator behaves like an array', () => {
    const data = [7, 7, 7];

    const v = new ConstantVector<number>(7, 3);
    expect(v.length).toEqual(3);

    const out: number[] = [];
    for (const num of v) {
      console.log('GOT:', num);
      out.push(num);
    }
    expect(out).toEqual(data);

    // Access by index
    expect(v.get(2)).toBe(data[2]);

    // Out of range
    // expect(v.get(10)).toBe(data[10]);
  });

  //   it('Pretend Object', () => {
  //     const names = ['a', 'b', 'c'];
  //     const frame: DataFrame = {
  //       fields: [
  //         { name: 'time', type: FieldType.time, values: [100, 200, 300] },
  //         { name: 'name', type: FieldType.string, values: names },
  //         { name: 'value', type: FieldType.number, values: [1, 2, 3] },
  //       ],
  //     };

  //     const cursor = new RowCursor<MySpecialObject>(frame.fields);

  //     const out: string[] = [];
  //     for (const row of cursor) {
  //       out.push(row.name);
  //     }
  //     // expect(out.length).toBe(3);
  //     // expect(out).toEqual([]);
  //   });
});
