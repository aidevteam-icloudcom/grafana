import { SelectableValue } from '@grafana/data';

import { Severity } from '../../AlertRuleTemplate/AlertRuleTemplate.types';
import { AlertRule, AlertRuleFilterType } from '../AlertRules.types';

export interface AddAlertRuleModalProps {
  isVisible: boolean;
  setVisible: (value: boolean) => void;
  alertRule?: AlertRule | null;
}
export interface AddAlertRuleFormValues {
  template: SelectableValue<string>;
  name: string;
  duration: number;
  filters: FiltersForm[];
  notificationChannels: Array<SelectableValue<string>>;
  severity: SelectableValue<Severity>;
  enabled: boolean;
  [field: string]: any;
}

export interface FiltersForm {
  label: string;
  value: string;
  operators: {
    label: string;
    value: AlertRuleFilterType;
  };
}
