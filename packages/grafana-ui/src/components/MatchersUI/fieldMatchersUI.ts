import { Registry } from '@grafana/data';
import { fieldNameMatcherItem } from './FieldNameMatcherEditor';
import { FieldMatcherUIRegistryItem } from './types';
import { fieldNameByRegexMatcherItem } from './FieldNameByRegexMatcherEditor';

export const fieldMatchersUI = new Registry<FieldMatcherUIRegistryItem<any>>(() => {
  return [fieldNameMatcherItem, fieldNameByRegexMatcherItem, fieldTypeMatcherItem];
});
