import React, { PureComponent } from 'react';
import { Button, JSONFormatter, LoadingPlaceholder } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { AppEvents, PanelEvents, DataFrame, getFrameDisplayName } from '@grafana/data';

import appEvents from 'app/core/app_events';
import { CopyToClipboard } from 'app/core/components/CopyToClipboard/CopyToClipboard';
import { CoreEvents } from 'app/types';
import { PanelModel } from 'app/features/dashboard/state';
import { getPanelInspectorStyles } from './styles';
import { supportsDataQuery } from '../PanelEditor/utils';

interface DsQuery {
  isLoading: boolean;
  response: {};
}

interface ExecutedQueryInfo {
  refId: string;
  name: string;
  query: string;
}

interface Props {
  panel: PanelModel;
  data: DataFrame[];
}

interface State {
  allNodesExpanded: boolean;
  isMocking: boolean;
  mockedResponse: string;
  dsQuery: DsQuery;
  executedQueries: ExecutedQueryInfo[];
}

export class QueryInspector extends PureComponent<Props, State> {
  formattedJson: any;
  clipboard: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      executedQueries: [],
      allNodesExpanded: null,
      isMocking: false,
      mockedResponse: '',
      dsQuery: {
        isLoading: false,
        response: {},
      },
    };
  }

  componentDidMount() {
    appEvents.on(CoreEvents.dsRequestResponse, this.onDataSourceResponse);
    appEvents.on(CoreEvents.dsRequestError, this.onRequestError);
    this.props.panel.events.on(PanelEvents.refresh, this.onPanelRefresh);
    this.updateQueryList();
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.data !== oldProps.data) {
      this.updateQueryList();
    }
  }

  updateQueryList() {
    const { data } = this.props;
    const executedQueries: ExecutedQueryInfo[] = [];
    if (data?.length) {
      data.forEach((frame, idx) => {
        if (frame.meta?.executedQueryString) {
          executedQueries.push({
            refId: frame.refId || '?',
            name: getFrameDisplayName(frame, idx),
            query: frame.meta!.executedQueryString,
          });
        }
      });
    }
    this.setState({ executedQueries });
  }

  onIssueNewQuery = () => {
    this.props.panel.refresh();
  };

  componentWillUnmount() {
    const { panel } = this.props;

    appEvents.off(CoreEvents.dsRequestResponse, this.onDataSourceResponse);
    appEvents.on(CoreEvents.dsRequestError, this.onRequestError);

    panel.events.off(PanelEvents.refresh, this.onPanelRefresh);
  }

  handleMocking(response: any) {
    const { mockedResponse } = this.state;
    let mockedData;
    try {
      mockedData = JSON.parse(mockedResponse);
    } catch (err) {
      appEvents.emit(AppEvents.alertError, ['R: Failed to parse mocked response']);
      return;
    }

    response.data = mockedData;
  }

  onPanelRefresh = () => {
    this.setState(prevState => ({
      ...prevState,
      dsQuery: {
        isLoading: true,
        response: {},
      },
    }));
  };

  onRequestError = (err: any) => {
    this.onDataSourceResponse(err);
  };

  onDataSourceResponse = (response: any = {}) => {
    if (this.state.isMocking) {
      this.handleMocking(response);
      return;
    }

    response = { ...response }; // clone - dont modify the response

    if (response.headers) {
      delete response.headers;
    }

    if (response.config) {
      response.request = response.config;

      delete response.config;
      delete response.request.transformRequest;
      delete response.request.transformResponse;
      delete response.request.paramSerializer;
      delete response.request.jsonpCallbackParam;
      delete response.request.headers;
      delete response.request.requestId;
      delete response.request.inspect;
      delete response.request.retry;
      delete response.request.timeout;
    }

    if (response.data) {
      response.response = response.data;

      delete response.config;
      delete response.data;
      delete response.status;
      delete response.statusText;
      delete response.ok;
      delete response.url;
      delete response.redirected;
      delete response.type;
      delete response.$$config;
    }

    this.setState(prevState => ({
      ...prevState,
      dsQuery: {
        isLoading: false,
        response: response,
      },
    }));
  };

  setFormattedJson = (formattedJson: any) => {
    this.formattedJson = formattedJson;
  };

  getTextForClipboard = () => {
    return JSON.stringify(this.formattedJson, null, 2);
  };

  onClipboardSuccess = () => {
    appEvents.emit(AppEvents.alertSuccess, ['Content copied to clipboard']);
  };

  onToggleExpand = () => {
    this.setState(prevState => ({
      ...prevState,
      allNodesExpanded: !this.state.allNodesExpanded,
    }));
  };

  onToggleMocking = () => {
    this.setState(prevState => ({
      ...prevState,
      isMocking: !this.state.isMocking,
    }));
  };

  getNrOfOpenNodes = () => {
    if (this.state.allNodesExpanded === null) {
      return 3; // 3 is default, ie when state is null
    } else if (this.state.allNodesExpanded) {
      return 20;
    }
    return 1;
  };

  setMockedResponse = (evt: any) => {
    const mockedResponse = evt.target.value;
    this.setState(prevState => ({
      ...prevState,
      mockedResponse,
    }));
  };

  renderExecutedQueries(executedQueries: ExecutedQueryInfo[]) {
    if(!executedQueries.length) {
      return null;
    }
    return (
      <div>
        {executedQueries.map(info => {
          return (
            <div key={info.query}>
              <h3>{info.name}</h3>
              <pre>{info.query}</pre>
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const { allNodesExpanded, executedQueries } = this.state;
    const { response, isLoading } = this.state.dsQuery;
    const openNodes = this.getNrOfOpenNodes();
    const styles = getPanelInspectorStyles();
    const haveData = Object.keys(response).length > 0;

    if (!supportsDataQuery(this.props.panel.plugin)) {
      return null;
    }

    return (
      <>
        <div aria-label={selectors.components.PanelInspector.Query.content}>
          <h3 className="section-heading">Query inspector</h3>
          <p className="small muted">
            Query inspector allows you to view raw request and response. To collect this data Grafana needs to issue a
            new query. Hit refresh button below to trigger a new query.
          </p>
        </div>
        {this.renderExecutedQueries(executedQueries)}
        <div className={styles.toolbar}>
          <Button
            icon="sync"
            onClick={this.onIssueNewQuery}
            aria-label={selectors.components.PanelInspector.Query.refreshButton}
          >
            Refresh
          </Button>

          {haveData && allNodesExpanded && (
            <Button icon="minus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              Collapse all
            </Button>
          )}
          {haveData && !allNodesExpanded && (
            <Button icon="plus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              Expand all
            </Button>
          )}

          {haveData && (
            <CopyToClipboard
              text={this.getTextForClipboard}
              onSuccess={this.onClipboardSuccess}
              elType="div"
              className={styles.toolbarItem}
            >
              <Button icon="copy" variant="secondary">
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          )}
          <div className="flex-grow-1" />
        </div>
        <div className={styles.contentQueryInspector}>
          {isLoading && <LoadingPlaceholder text="Loading query inspector..." />}
          {!isLoading && haveData && (
            <JSONFormatter json={response} open={openNodes} onDidRender={this.setFormattedJson} />
          )}
          {!isLoading && !haveData && <p className="muted">No request & response collected yet. Hit refresh button</p>}
        </div>
      </>
    );
  }
}
