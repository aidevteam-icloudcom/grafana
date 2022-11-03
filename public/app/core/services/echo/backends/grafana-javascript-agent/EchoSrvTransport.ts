import { BaseTransport, TransportItem } from '@grafana/faro-core';
import { getEchoSrv, EchoEventType } from '@grafana/runtime';
export class EchoSrvTransport extends BaseTransport {
  send(event: TransportItem) {
    getEchoSrv().addEvent({
      type: EchoEventType.GrafanaJavascriptAgent,
      payload: event,
    });
  }
  getIgnoreUrls() {
    return [];
  }
}
