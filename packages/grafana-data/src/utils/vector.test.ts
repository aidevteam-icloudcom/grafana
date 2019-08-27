import { ConstantVector, ScaledVector, ArrayVector, CircularVector, AppendedVectors } from './vector';

describe('Check Proxy Vector', () => {
  it('should support constant values', () => {
    const value = 3.5;
    const v = new ConstantVector(value, 7);
    expect(v.length).toEqual(7);

    expect(v.get(0)).toEqual(value);
    expect(v.get(1)).toEqual(value);

    // Now check all of them
    for (let i = 0; i < 10; i++) {
      expect(v.get(i)).toEqual(value);
    }
  });

  it('should support multiply operations', () => {
    const source = new ArrayVector([1, 2, 3, 4]);
    const scale = 2.456;
    const v = new ScaledVector(source, scale);
    expect(v.length).toEqual(source.length);
    //  expect(v.push(10)).toEqual(source.length); // not implemented
    for (let i = 0; i < 10; i++) {
      expect(v.get(i)).toEqual(source.get(i) * scale);
    }
  });
});

describe('Check Circular Vector', () => {
  it('should append values', () => {
    const buffer = [1, 2, 3];
    const v = new CircularVector({ buffer }); // tail is default option
    expect(v.toArray()).toEqual([1, 2, 3]);

    v.add(4);
    expect(v.toArray()).toEqual([2, 3, 4]);

    v.add(5);
    expect(v.toArray()).toEqual([3, 4, 5]);

    v.add(6);
    expect(v.toArray()).toEqual([4, 5, 6]);

    v.add(7);
    expect(v.toArray()).toEqual([5, 6, 7]);

    v.add(8);
    expect(v.toArray()).toEqual([6, 7, 8]);
  });

  it('should grow buffer until it hits capacity (append)', () => {
    const v = new CircularVector({ capacity: 3 }); // tail is default option
    expect(v.toArray()).toEqual([]);

    v.add(1);
    expect(v.toArray()).toEqual([1]);

    v.add(2);
    expect(v.toArray()).toEqual([1, 2]);

    v.add(3);
    expect(v.toArray()).toEqual([1, 2, 3]);

    v.add(4);
    expect(v.toArray()).toEqual([2, 3, 4]);

    v.add(5);
    expect(v.toArray()).toEqual([3, 4, 5]);
  });

  it('should prepend values', () => {
    const buffer = [3, 2, 1];
    const v = new CircularVector({ buffer, append: 'head' });
    expect(v.toArray()).toEqual([3, 2, 1]);

    v.add(4);
    expect(v.toArray()).toEqual([4, 3, 2]);

    v.add(5);
    expect(v.toArray()).toEqual([5, 4, 3]);

    v.add(6);
    expect(v.toArray()).toEqual([6, 5, 4]);

    v.add(7);
    expect(v.toArray()).toEqual([7, 6, 5]);

    v.add(8);
    expect(v.toArray()).toEqual([8, 7, 6]);
  });

  it('should expand buffer and then prepend', () => {
    const v = new CircularVector({ capacity: 3, append: 'head' });
    expect(v.toArray()).toEqual([]);

    v.add(1);
    expect(v.toArray()).toEqual([1]);

    v.add(2);
    expect(v.toArray()).toEqual([2, 1]);

    v.add(3);
    expect(v.toArray()).toEqual([3, 2, 1]);

    v.add(4);
    expect(v.toArray()).toEqual([4, 3, 2]);

    v.add(5);
    expect(v.toArray()).toEqual([5, 4, 3]);
  });

  it('should reduce size and keep working (tail)', () => {
    const buffer = [1, 2, 3, 4, 5];
    const v = new CircularVector({ buffer });
    expect(v.toArray()).toEqual([1, 2, 3, 4, 5]);

    v.setCapacity(3);
    expect(v.toArray()).toEqual([3, 4, 5]);

    v.add(6);
    expect(v.toArray()).toEqual([4, 5, 6]);

    v.add(7);
    expect(v.toArray()).toEqual([5, 6, 7]);
  });

  it('should reduce size and keep working (head)', () => {
    const buffer = [5, 4, 3, 2, 1];
    const v = new CircularVector({ buffer, append: 'head' });
    expect(v.toArray()).toEqual([5, 4, 3, 2, 1]);

    v.setCapacity(3);
    expect(v.toArray()).toEqual([5, 4, 3]);

    v.add(6);
    expect(v.toArray()).toEqual([6, 5, 4]);

    v.add(7);
    expect(v.toArray()).toEqual([7, 6, 5]);
  });

  it('change buffer direction', () => {
    const buffer = [1, 2, 3];
    const v = new CircularVector({ buffer });
    expect(v.toArray()).toEqual([1, 2, 3]);

    v.setAppendMode('head');
    expect(v.toArray()).toEqual([3, 2, 1]);

    v.add(4);
    expect(v.toArray()).toEqual([4, 3, 2]);

    v.setAppendMode('tail');
    v.add(5);
    expect(v.toArray()).toEqual([3, 4, 5]);
  });
});

describe('Check Appending Vector', () => {
  it('should transparently join them', () => {
    const appended = new AppendedVectors();
    appended.append(new ArrayVector([1, 2, 3]));
    appended.append(new ArrayVector([4, 5, 6]));
    appended.append(new ArrayVector([7, 8, 9]));
    expect(appended.length).toEqual(9);

    appended.setLength(5);
    expect(appended.length).toEqual(5);
    appended.append(new ArrayVector(['a', 'b', 'c']));
    expect(appended.length).toEqual(8);
    expect(appended.toArray()).toEqual([1, 2, 3, 4, 5, 'a', 'b', 'c']);

    appended.setLength(2);
    appended.setLength(6);
    appended.append(new ArrayVector(['x', 'y', 'z']));
    expect(appended.toArray()).toEqual([1, 2, undefined, undefined, undefined, undefined, 'x', 'y', 'z']);
  });
});
