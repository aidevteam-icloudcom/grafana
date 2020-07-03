import { Observable } from 'rxjs';

/**
 * Used to initiate a remote call via the {@link BackendSrv}
 *
 * @public
 */
export type BackendSrvRequest = {
  url: string;
  /**
   * Number of times to retry the remote call if it fails.
   */
  retry?: number;

  /**
   * HTTP headers that should be passed along with the remote call.
   * Please have a look at {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | Fetch API}
   * for supported headers.
   */
  headers?: any;

  /**
   * HTTP verb to perform in the remote call GET, POST, PUT etc.
   */
  method?: string;

  /**
   * Set to false an success application alert box will not be shown for successful PUT, DELETE, POST requests
   */
  showSuccessAlert?: boolean;

  /**
   * Set to false to not show an application alert box for request errors
   */
  showErrorAlert?: boolean;

  /**
   * Provided by the initiator to identify a particular remote call. An example
   * of this is when a datasource plugin triggers a query. If the request id already
   * exist the backendSrv will try to cancel and replace the previous call with the
   * new one.
   */
  requestId?: string;

  /**
   * Set to to true to not include call in query inspector
   */
  silent?: boolean;

  /**
   * The data to send
   */
  data?: any;

  /**
   * Query params
   */
  params?: Record<string, any>;

  /**
   * Indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies, authorization headers or TLS client certificates. Setting withCredentials has no effect on same-site requests.
   * In addition, this flag is also used to indicate when cookies are to be ignored in the response.
   */
  withCredentials?: boolean;
};

/**
 * Response for fetch function in {@link BackendSrv}
 *
 * @public
 */
export interface FetchResponse<T = any> {
  data: T;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly url: string;
  readonly config: BackendSrvRequest;
}

/**
 * Error type for fetch function in {@link BackendSrv}
 *
 * @public
 */
export interface FetchErrorDataProps {
  message?: string;
  status?: string;
  error?: string | any;
}

/**
 * Error type for fetch function in {@link BackendSrv}
 *
 * @public
 */
export interface FetchError<T extends FetchErrorDataProps = any> {
  status: number;
  statusText?: string;
  data: T | string;
  cancelled?: boolean;
  config: BackendSrvRequest;
}

/**
 * Used to communicate via http(s) to a remote backend such as the Grafana backend,
 * a datasource etc. The BackendSrv is using the {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | Fetch API}
 * under the hood to handle all the communication.
 *
 * The request function can be used to perform a remote call by specifying a {@link BackendSrvRequest}.
 * To make the BackendSrv a bit easier to use we have added a couple of shorthand functions that will
 * use default values executing the request.
 *
 * @remarks
 * By default Grafana will display an error message alert if the remote call fails. If you want
 * to prevent this from happending you need to catch the error thrown by the BackendSrv and
 * set the `isHandled = true` on the incoming error.
 *
 * @public
 */
export interface BackendSrv {
  get(url: string, params?: any, requestId?: string): Promise<any>;
  delete(url: string): Promise<any>;
  post(url: string, data?: any): Promise<any>;
  patch(url: string, data?: any): Promise<any>;
  put(url: string, data?: any): Promise<any>;
  request(options: BackendSrvRequest): Promise<any>;

  /**
   * Special function used to communicate with datasources that will emit core
   * events that the Grafana QueryInspector and QueryEditor is listening for to be able
   * to display datasource query information. Can be skipped by adding `option.silent`
   * when initializing the request.
   */
  datasourceRequest(options: BackendSrvRequest): Promise<any>;
  fetch<T>(options: BackendSrvRequest): Observable<FetchResponse<T>>;
}

let singletonInstance: BackendSrv;

/**
 * Used during startup by Grafana to set the BackendSrv so it is available
 * via the the {@link getBackendSrv} to the rest of the application.
 *
 * @internal
 */
export const setBackendSrv = (instance: BackendSrv) => {
  singletonInstance = instance;
};

/**
 * Used to retrieve the {@link BackendSrv} that can be used to communicate
 * via http(s) to a remote backend such as the Grafana backend, a datasource etc.
 *
 * @public
 */
export const getBackendSrv = (): BackendSrv => singletonInstance;
