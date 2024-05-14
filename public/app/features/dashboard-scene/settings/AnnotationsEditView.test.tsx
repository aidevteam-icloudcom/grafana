import { map, of } from 'rxjs';

import { AnnotationQuery, DataQueryRequest, DataSourceApi, LoadingState, PanelData } from '@grafana/data';
import { SceneGridLayout, SceneTimeRange, dataLayers } from '@grafana/scenes';

import { DashboardAnnotationsDataLayer } from '../scene/DashboardAnnotationsDataLayer';
import { DashboardDataLayerSet } from '../scene/DashboardDataLayerSet';
import { DashboardScene } from '../scene/DashboardScene';
import { dashboardSceneGraph } from '../utils/dashboardSceneGraph';
import { activateFullSceneTree } from '../utils/test-utils';

import { AnnotationsEditView, MoveDirection } from './AnnotationsEditView';
import { newAnnotationName } from './annotations/AnnotationSettingsEdit';

const runRequestMock = jest.fn().mockImplementation((ds: DataSourceApi, request: DataQueryRequest) => {
  const result: PanelData = {
    state: LoadingState.Loading,
    series: [],
    timeRange: request.range,
  };

  return of([]).pipe(
    map(() => {
      result.state = LoadingState.Done;
      result.series = [];

      return result;
    })
  );
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => {
    return {
      getInstanceSettings: jest.fn().mockResolvedValue({ uid: 'ds1' }),
    };
  },
  getRunRequest: () => (ds: DataSourceApi, request: DataQueryRequest) => {
    return runRequestMock(ds, request);
  },
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    publicDashboardAccessToken: 'ac123',
  },
}));

describe('AnnotationsEditView', () => {
  describe('Dashboard annotations state', () => {
    let annotationsView: AnnotationsEditView;

    beforeEach(async () => {
      const result = await buildTestScene();
      annotationsView = result.annotationsView;
    });

    it('should return the correct urlKey', () => {
      expect(annotationsView.getUrlKey()).toBe('annotations');
    });

    it('should add a new annotation and group it with the other annotations', () => {
      const dataLayers = dashboardSceneGraph.getDataLayers(annotationsView.getDashboard());

      expect(dataLayers?.state.annotationLayers.length).toBe(1);

      annotationsView.onNew();

      expect(dataLayers?.state.annotationLayers.length).toBe(2);
      expect(dataLayers?.state.annotationLayers[1].state.name).toBe(newAnnotationName);
      expect(dataLayers?.state.annotationLayers[1].isActive).toBe(true);
    });

    it('should move an annotation up one position', () => {
      const dataLayers = dashboardSceneGraph.getDataLayers(annotationsView.getDashboard());

      annotationsView.onNew();

      expect(dataLayers?.state.annotationLayers.length).toBe(2);
      expect(dataLayers?.state.annotationLayers[0].state.name).toBe('test');

      annotationsView.onMove(1, MoveDirection.UP);

      expect(dataLayers?.state.annotationLayers.length).toBe(2);
      expect(dataLayers?.state.annotationLayers[0].state.name).toBe(newAnnotationName);
    });

    it('should move an annotation down one position', () => {
      const dataLayers = dashboardSceneGraph.getDataLayers(annotationsView.getDashboard());

      annotationsView.onNew();

      expect(dataLayers?.state.annotationLayers.length).toBe(2);
      expect(dataLayers?.state.annotationLayers[0].state.name).toBe('test');

      annotationsView.onMove(0, MoveDirection.DOWN);

      expect(dataLayers?.state.annotationLayers.length).toBe(2);
      expect(dataLayers?.state.annotationLayers[0].state.name).toBe(newAnnotationName);
    });

    it('should delete annotation at index', () => {
      const dataLayers = dashboardSceneGraph.getDataLayers(annotationsView.getDashboard());

      expect(dataLayers?.state.annotationLayers.length).toBe(1);

      annotationsView.onDelete(0);

      expect(dataLayers?.state.annotationLayers.length).toBe(0);
    });

    it('should update an annotation at index', () => {
      const dataLayers = dashboardSceneGraph.getDataLayers(annotationsView.getDashboard());

      expect(dataLayers?.state.annotationLayers[0].state.name).toBe('test');

      const annotation: AnnotationQuery = {
        ...(dataLayers?.state.annotationLayers[0] as dataLayers.AnnotationsDataLayer).state.query,
      };

      annotation.name = 'new name';
      annotation.hide = true;
      annotation.enable = false;
      annotation.iconColor = 'blue';
      annotationsView.onUpdate(annotation, 0);

      expect(dataLayers?.state.annotationLayers.length).toBe(1);
      expect(dataLayers?.state.annotationLayers[0].state.name).toBe('new name');
      expect((dataLayers?.state.annotationLayers[0] as dataLayers.AnnotationsDataLayer).state.query.name).toBe(
        'new name'
      );
      expect((dataLayers?.state.annotationLayers[0] as dataLayers.AnnotationsDataLayer).state.query.hide).toBe(true);
      expect((dataLayers?.state.annotationLayers[0] as dataLayers.AnnotationsDataLayer).state.query.enable).toBe(false);
      expect((dataLayers?.state.annotationLayers[0] as dataLayers.AnnotationsDataLayer).state.query.iconColor).toBe(
        'blue'
      );
    });
  });
});

async function buildTestScene() {
  const annotationsView = new AnnotationsEditView({});
  const dashboard = new DashboardScene({
    $timeRange: new SceneTimeRange({}),
    title: 'hello',
    uid: 'dash-1',
    version: 4,
    meta: {
      canEdit: true,
    },
    $data: new DashboardDataLayerSet({
      annotationLayers: [
        new DashboardAnnotationsDataLayer({
          key: `annotations-test`,
          query: {
            enable: true,
            iconColor: 'red',
            name: 'test',
            datasource: {
              type: 'grafana',
              uid: '-- Grafana --',
            },
          },
          name: 'test',
          isEnabled: true,
          isHidden: false,
        }),
      ],
    }),
    body: new SceneGridLayout({
      children: [],
    }),
    editview: annotationsView,
  });

  activateFullSceneTree(dashboard);

  await new Promise((r) => setTimeout(r, 1));

  dashboard.onEnterEditMode();
  annotationsView.activate();

  return { dashboard, annotationsView };
}
