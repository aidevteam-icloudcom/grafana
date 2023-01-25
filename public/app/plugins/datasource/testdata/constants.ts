import { CSVWave, TestData } from './dataquery.gen';

export const defaultPulseQuery: any = {
  timeStep: 60,
  onCount: 3,
  onValue: 2,
  offCount: 3,
  offValue: 1,
};

export const defaultCSVWaveQuery: CSVWave[] = [
  {
    timeStep: 60,
    valuesCSV: '0,0,2,2,1,1',
  },
];

export const defaultQuery: TestData = {
  scenarioId: 'random_walk',
  refId: '',
};
