/* */ 
"format cjs";
export { WORKER_SCRIPT, WORKER_RENDER_PLATFORM, initializeGenericWorkerRenderer, WORKER_RENDER_APP_COMMON } from 'angular2/src/platform/worker_render_common';
export * from 'angular2/src/platform/worker_render';
export { ClientMessageBroker, ClientMessageBrokerFactory, FnArg, UiArguments } from '../src/web_workers/shared/client_message_broker';
export { ReceivedMessage, ServiceMessageBroker, ServiceMessageBrokerFactory } from '../src/web_workers/shared/service_message_broker';
export { PRIMITIVE } from '../src/web_workers/shared/serializer';
export * from '../src/web_workers/shared/message_bus';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyX3JlbmRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFuZ3VsYXIyL3BsYXRmb3JtL3dvcmtlcl9yZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FDRSxhQUFhLEVBQ2Isc0JBQXNCLEVBQ3RCLCtCQUErQixFQUMvQix3QkFBd0IsUUFDbkIsNENBQTRDLENBQUM7QUFDcEQsY0FBYyxxQ0FBcUMsQ0FBQztBQUNwRCxTQUNFLG1CQUFtQixFQUNuQiwwQkFBMEIsRUFDMUIsS0FBSyxFQUNMLFdBQVcsUUFDTixpREFBaUQsQ0FBQztBQUN6RCxTQUNFLGVBQWUsRUFDZixvQkFBb0IsRUFDcEIsMkJBQTJCLFFBQ3RCLGtEQUFrRCxDQUFDO0FBQzFELFNBQVEsU0FBUyxRQUFPLHNDQUFzQyxDQUFDO0FBQy9ELGNBQWMsdUNBQXVDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQge1xuICBXT1JLRVJfU0NSSVBULFxuICBXT1JLRVJfUkVOREVSX1BMQVRGT1JNLFxuICBpbml0aWFsaXplR2VuZXJpY1dvcmtlclJlbmRlcmVyLFxuICBXT1JLRVJfUkVOREVSX0FQUF9DT01NT05cbn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL3dvcmtlcl9yZW5kZXJfY29tbW9uJztcbmV4cG9ydCAqIGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS93b3JrZXJfcmVuZGVyJztcbmV4cG9ydCB7XG4gIENsaWVudE1lc3NhZ2VCcm9rZXIsXG4gIENsaWVudE1lc3NhZ2VCcm9rZXJGYWN0b3J5LFxuICBGbkFyZyxcbiAgVWlBcmd1bWVudHNcbn0gZnJvbSAnLi4vc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9jbGllbnRfbWVzc2FnZV9icm9rZXInO1xuZXhwb3J0IHtcbiAgUmVjZWl2ZWRNZXNzYWdlLFxuICBTZXJ2aWNlTWVzc2FnZUJyb2tlcixcbiAgU2VydmljZU1lc3NhZ2VCcm9rZXJGYWN0b3J5XG59IGZyb20gJy4uL3NyYy93ZWJfd29ya2Vycy9zaGFyZWQvc2VydmljZV9tZXNzYWdlX2Jyb2tlcic7XG5leHBvcnQge1BSSU1JVElWRX0gZnJvbSAnLi4vc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9zZXJpYWxpemVyJztcbmV4cG9ydCAqIGZyb20gJy4uL3NyYy93ZWJfd29ya2Vycy9zaGFyZWQvbWVzc2FnZV9idXMnO1xuIl19