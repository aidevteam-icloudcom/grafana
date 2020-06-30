import { PanelModel } from 'app/features/dashboard/state';

export class ThresholdMapper {
  static alertToGraphThresholds(panel: PanelModel) {
    for (let i = 0; i < panel.alert.conditions.length; i++) {
      const condition = panel.alert.conditions[i];
      if (condition.type !== 'query') {
        continue;
      }

      const evaluator = condition.evaluator;
      const thresholds: any[] = (panel.thresholds = []);

      switch (evaluator.type) {
        case 'gt': {
          const value = evaluator.params[0];
          thresholds.push({ value: value, op: 'gt' });
          break;
        }
        case 'lt': {
          const value = evaluator.params[0];
          thresholds.push({ value: value, op: 'lt' });
          break;
        }
        case 'outside_range': {
          const value1 = evaluator.params[0];
          const value2 = evaluator.params[1];

          if (value1 > value2) {
            thresholds.push({ value: value1, op: 'gt' });
            thresholds.push({ value: value2, op: 'lt' });
          } else {
            thresholds.push({ value: value1, op: 'lt' });
            thresholds.push({ value: value2, op: 'gt' });
          }

          break;
        }
        case 'within_range': {
          const value1 = evaluator.params[0];
          const value2 = evaluator.params[1];

          if (value1 > value2) {
            thresholds.push({ value: value1, op: 'lt' });
            thresholds.push({ value: value2, op: 'gt' });
          } else {
            thresholds.push({ value: value1, op: 'gt' });
            thresholds.push({ value: value2, op: 'lt' });
          }
          break;
        }
      }
      break;
    }

    for (const t of panel.thresholds) {
      t.fill = panel.alertThreshold;
      t.line = panel.alertThreshold;
      t.colorMode = 'critical';
    }

    const updated = true;
    return updated;
  }
}
