/**
 * Creates a pretty bogus prom response. Definitely needs more work but right now we do not test the contents of the
 * messages anyway.
 */
function makePromResponse() {
  return {
    data: {
      data: {
        result: [
          {
            metric: {
              __name__: 'test_metric',
            },
            values: [[1568369640, 1]],
          },
        ],
        resultType: 'matrix',
      },
    },
  };
}

export const backendSrv = {
  get: jest.fn(),
  getDashboard: jest.fn(),
  getDashboardByUid: jest.fn(),
  getFolderByUid: jest.fn(),
  post: jest.fn(),
  resolveCancelerIfExists: jest.fn(),
  datasourceRequest: jest.fn(() => Promise.resolve(makePromResponse())),
};

export const getBackendSrv = jest.fn().mockReturnValue(backendSrv);
