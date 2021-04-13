import { DataFrame, dateMath, LoadingState, PanelData } from '@grafana/data';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MultiQueryRunner } from './MultiQueryRunner';
import { GetDataOptions, QueryRunnerOptions } from '../../query/state/PanelQueryRunner';

describe('Multi query runner', () => {
  it('should emit list with values from each queryRunner', async () => {
    const dataA = createPanelData();
    const runnerA = new FakePanelQueryRunner(dataA);

    const dataB = createPanelData();
    const runnerB = new FakePanelQueryRunner(dataB);

    const createRunner = jest.fn();
    createRunner.mockReturnValueOnce(runnerA);
    createRunner.mockReturnValueOnce(runnerB);

    const multiRunner = new MultiQueryRunner(createRunner);

    await multiRunner.run({
      dataSource: { name: 'test' },
      queries: [
        {
          refId: 'A',
          timeRange: {
            from: dateMath.parse('now-6h')!,
            to: dateMath.parse('now-3h')!,
            raw: { from: 'now-6h', to: 'now-3h' },
          },
        },
        {
          refId: 'B',
          timeRange: {
            from: dateMath.parse('now-3h')!,
            to: dateMath.parse('now')!,
            raw: { from: 'now-3h', to: 'now' },
          },
        },
      ],
    });

    await expect(multiRunner.getData().pipe(first())).toEmitValuesWith((value) => {
      expect(value[0]).toEqual([dataA, dataB]);
    });
  });

  it('should emit list with latest values from each queryRunner', async () => {
    const dataA = createPanelData();
    const runnerA = new FakePanelQueryRunner(dataA);

    const dataB = createPanelData();
    const runnerB = new FakePanelQueryRunner(dataB);

    const createRunner = jest.fn();
    createRunner.mockReturnValueOnce(runnerA);
    createRunner.mockReturnValueOnce(runnerB);

    const multiRunner = new MultiQueryRunner(createRunner);

    await multiRunner.run({
      dataSource: { name: 'test' },
      queries: [
        {
          refId: 'A',
          timeRange: {
            from: dateMath.parse('now-6h')!,
            to: dateMath.parse('now-3h')!,
            raw: { from: 'now-6h', to: 'now-3h' },
          },
        },
        {
          refId: 'B',
          timeRange: {
            from: dateMath.parse('now-3h')!,
            to: dateMath.parse('now')!,
            raw: { from: 'now-3h', to: 'now' },
          },
        },
      ],
    });

    const nextDataA = createPanelData({ state: LoadingState.Loading });
    runnerA.setNextPanelData(nextDataA);

    await runnerA.run({
      datasource: 'test',
      queries: [
        {
          refId: 'A',
          timeRange: {
            from: dateMath.parse('now-6h')!,
            to: dateMath.parse('now-3h')!,
            raw: { from: 'now-6h', to: 'now-3h' },
          },
        },
      ],
      minInterval: null,
      maxDataPoints: 1000,
      timezone: 'browser',
      timeRange: {
        from: dateMath.parse('now-6h')!,
        to: dateMath.parse('now-3h')!,
        raw: { from: 'now-6h', to: 'now-3h' },
      },
    });

    await expect(multiRunner.getData().pipe(first())).toEmitValuesWith((value) => {
      expect(value[0]).toEqual([nextDataA, dataB]);
    });
  });
});

const createPanelData = (data: Partial<PanelData> = {}) => {
  return {
    series: [] as DataFrame[],
    state: LoadingState.Done,
    timeRange: {
      from: dateMath.parse('now-3h')!,
      to: dateMath.parse('now')!,
      raw: { from: 'now-3h', to: 'now' },
    },
    ...data,
  };
};
class FakePanelQueryRunner {
  private data: PanelData;
  private subject: Subject<PanelData>;

  constructor(data: PanelData) {
    this.data = data;
    this.subject = new ReplaySubject(1);
  }

  setNextPanelData(data: PanelData) {
    this.data = data;
  }

  async run(options: QueryRunnerOptions) {
    this.subject.next(this.data);
  }

  getData(options: GetDataOptions): Observable<PanelData> {
    return this.subject.asObservable();
  }

  destroy() {
    this.subject.complete();
    this.subject.unsubscribe();
  }
}
