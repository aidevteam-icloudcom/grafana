import { ANNOTATION_QUERY_STEP_DEFAULT } from './datasource';
import { plugin as PrometheusDatasourcePlugin } from './module';

describe('module', () => {
  it('should have metrics query field in panels and Explore', () => {
    expect(PrometheusDatasourcePlugin.components.QueryEditor).toBeDefined();
  });
  it('should have stepDefaultValuePlaceholder set in annotations ctrl', () => {
    expect(PrometheusDatasourcePlugin.components.AnnotationsQueryCtrl).toBeDefined();
    const annotationsCtrl = new PrometheusDatasourcePlugin.components.AnnotationsQueryCtrl();
    expect(annotationsCtrl.stepDefaultValuePlaceholder).toEqual(ANNOTATION_QUERY_STEP_DEFAULT);
  });
});
