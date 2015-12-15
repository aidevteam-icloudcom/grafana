/* */ 
"format cjs";
import { APP_ID, APPLICATION_COMMON_PROVIDERS, AppViewManager, DirectiveResolver, DynamicComponentLoader, Injector, NgZone, Renderer, Provider, ViewResolver, provide } from 'angular2/core';
import { AnimationBuilder } from 'angular2/src/animate/animation_builder';
import { MockAnimationBuilder } from 'angular2/src/mock/animation_builder_mock';
import { ProtoViewFactory } from 'angular2/src/core/linker/proto_view_factory';
import { Reflector, reflector } from 'angular2/src/core/reflection/reflection';
import { IterableDiffers, defaultIterableDiffers, KeyValueDiffers, defaultKeyValueDiffers, ChangeDetectorGenConfig } from 'angular2/src/core/change_detection/change_detection';
import { ExceptionHandler } from 'angular2/src/facade/exceptions';
import { PipeResolver } from 'angular2/src/core/linker/pipe_resolver';
import { XHR } from 'angular2/src/compiler/xhr';
import { DOM } from 'angular2/src/platform/dom/dom_adapter';
import { MockDirectiveResolver } from 'angular2/src/mock/directive_resolver_mock';
import { MockViewResolver } from 'angular2/src/mock/view_resolver_mock';
import { MockLocationStrategy } from 'angular2/src/mock/mock_location_strategy';
import { LocationStrategy } from 'angular2/src/router/location_strategy';
import { MockNgZone } from 'angular2/src/mock/ng_zone_mock';
import { TestComponentBuilder } from './test_component_builder';
import { EventManager, EVENT_MANAGER_PLUGINS, ELEMENT_PROBE_PROVIDERS } from 'angular2/platform/common_dom';
import { ListWrapper } from 'angular2/src/facade/collection';
import { FunctionWrapper } from 'angular2/src/facade/lang';
import { AppViewPool, APP_VIEW_POOL_CAPACITY } from 'angular2/src/core/linker/view_pool';
import { AppViewManagerUtils } from 'angular2/src/core/linker/view_manager_utils';
import { DOCUMENT } from 'angular2/src/platform/dom/dom_tokens';
import { DomRenderer } from 'angular2/src/platform/dom/dom_renderer';
import { DomSharedStylesHost } from 'angular2/src/platform/dom/shared_styles_host';
import { SharedStylesHost } from 'angular2/src/platform/dom/shared_styles_host';
import { DomEventsPlugin } from 'angular2/src/platform/dom/events/dom_events';
import { Serializer } from "angular2/src/web_workers/shared/serializer";
import { Log } from './utils';
import { COMPILER_PROVIDERS } from 'angular2/src/compiler/compiler';
import { DomRenderer_ } from "angular2/src/platform/dom/dom_renderer";
import { DynamicComponentLoader_ } from "angular2/src/core/linker/dynamic_component_loader";
import { AppViewManager_ } from "angular2/src/core/linker/view_manager";
/**
 * Returns the root injector providers.
 *
 * This must be kept in sync with the _rootBindings in application.js
 *
 * @returns {any[]}
 */
function _getRootProviders() {
    return [provide(Reflector, { useValue: reflector })];
}
/**
 * Returns the application injector providers.
 *
 * This must be kept in sync with _injectorBindings() in application.js
 *
 * @returns {any[]}
 */
function _getAppBindings() {
    var appDoc;
    // The document is only available in browser environment
    try {
        appDoc = DOM.defaultDoc();
    }
    catch (e) {
        appDoc = null;
    }
    return [
        APPLICATION_COMMON_PROVIDERS,
        provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, true) }),
        provide(DOCUMENT, { useValue: appDoc }),
        provide(DomRenderer, { useClass: DomRenderer_ }),
        provide(Renderer, { useExisting: DomRenderer }),
        provide(APP_ID, { useValue: 'a' }),
        DomSharedStylesHost,
        provide(SharedStylesHost, { useExisting: DomSharedStylesHost }),
        AppViewPool,
        provide(AppViewManager, { useClass: AppViewManager_ }),
        AppViewManagerUtils,
        Serializer,
        ELEMENT_PROBE_PROVIDERS,
        provide(APP_VIEW_POOL_CAPACITY, { useValue: 500 }),
        ProtoViewFactory,
        provide(DirectiveResolver, { useClass: MockDirectiveResolver }),
        provide(ViewResolver, { useClass: MockViewResolver }),
        provide(IterableDiffers, { useValue: defaultIterableDiffers }),
        provide(KeyValueDiffers, { useValue: defaultKeyValueDiffers }),
        Log,
        provide(DynamicComponentLoader, { useClass: DynamicComponentLoader_ }),
        PipeResolver,
        provide(ExceptionHandler, { useValue: new ExceptionHandler(DOM) }),
        provide(LocationStrategy, { useClass: MockLocationStrategy }),
        provide(XHR, { useClass: DOM.getXHR() }),
        TestComponentBuilder,
        provide(NgZone, { useClass: MockNgZone }),
        provide(AnimationBuilder, { useClass: MockAnimationBuilder }),
        EventManager,
        new Provider(EVENT_MANAGER_PLUGINS, { useClass: DomEventsPlugin, multi: true })
    ];
}
function _runtimeCompilerBindings() {
    return [
        provide(XHR, { useClass: DOM.getXHR() }),
        COMPILER_PROVIDERS,
    ];
}
export function createTestInjector(providers) {
    var rootInjector = Injector.resolveAndCreate(_getRootProviders());
    return rootInjector.resolveAndCreateChild(ListWrapper.concat(_getAppBindings(), providers));
}
export function createTestInjectorWithRuntimeCompiler(providers) {
    return createTestInjector(ListWrapper.concat(_runtimeCompilerBindings(), providers));
}
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`.
 *
 * Example:
 *
 * ```
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * Notes:
 * - inject is currently a function because of some Traceur limitation the syntax should eventually
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 * @param {Array} tokens
 * @param {Function} fn
 * @return {FunctionWithParamTokens}
 */
export function inject(tokens, fn) {
    return new FunctionWithParamTokens(tokens, fn, false);
}
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`. The test must return
 * a promise which will resolve when all asynchronous activity is complete.
 *
 * Example:
 *
 * ```
 * it('...', injectAsync([AClass], (object) => {
 *   return object.doSomething().then(() => {
 *     expect(...);
 *   });
 * })
 * ```
 *
 * @param {Array} tokens
 * @param {Function} fn
 * @return {FunctionWithParamTokens}
 */
export function injectAsync(tokens, fn) {
    return new FunctionWithParamTokens(tokens, fn, true);
}
export class FunctionWithParamTokens {
    constructor(_tokens, _fn, isAsync) {
        this._tokens = _tokens;
        this._fn = _fn;
        this.isAsync = isAsync;
    }
    /**
     * Returns the value of the executed function.
     */
    execute(injector) {
        var params = this._tokens.map(t => injector.get(t));
        return FunctionWrapper.apply(this._fn, params);
    }
    hasToken(token) { return this._tokens.indexOf(token) > -1; }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFuZ3VsYXIyL3NyYy90ZXN0aW5nL3Rlc3RfaW5qZWN0b3IudHMiXSwibmFtZXMiOlsiX2dldFJvb3RQcm92aWRlcnMiLCJfZ2V0QXBwQmluZGluZ3MiLCJfcnVudGltZUNvbXBpbGVyQmluZGluZ3MiLCJjcmVhdGVUZXN0SW5qZWN0b3IiLCJjcmVhdGVUZXN0SW5qZWN0b3JXaXRoUnVudGltZUNvbXBpbGVyIiwiaW5qZWN0IiwiaW5qZWN0QXN5bmMiLCJGdW5jdGlvbldpdGhQYXJhbVRva2VucyIsIkZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zLmNvbnN0cnVjdG9yIiwiRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnMuZXhlY3V0ZSIsIkZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zLmhhc1Rva2VuIl0sIm1hcHBpbmdzIjoiT0FBTyxFQUNMLE1BQU0sRUFDTiw0QkFBNEIsRUFDNUIsY0FBYyxFQUNkLGlCQUFpQixFQUNqQixzQkFBc0IsRUFDdEIsUUFBUSxFQUNSLE1BQU0sRUFDTixRQUFRLEVBQ1IsUUFBUSxFQUNSLFlBQVksRUFDWixPQUFPLEVBQ1IsTUFBTSxlQUFlO09BQ2YsRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHdDQUF3QztPQUNoRSxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMENBQTBDO09BRXRFLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2Q0FBNkM7T0FDckUsRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0seUNBQXlDO09BQ3JFLEVBQ0wsZUFBZSxFQUNmLHNCQUFzQixFQUN0QixlQUFlLEVBQ2Ysc0JBQXNCLEVBQ3RCLHVCQUF1QixFQUN4QixNQUFNLHFEQUFxRDtPQUNyRCxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZ0NBQWdDO09BQ3hELEVBQUMsWUFBWSxFQUFDLE1BQU0sd0NBQXdDO09BQzVELEVBQUMsR0FBRyxFQUFDLE1BQU0sMkJBQTJCO09BRXRDLEVBQUMsR0FBRyxFQUFD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LEVBQVVBLEdBQWFBLEVBQVNBLE9BQWdCQTtRQUE5REMsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBT0E7UUFBVUEsUUFBR0EsR0FBSEEsR0FBR0EsQ0FBVUE7UUFBU0EsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBU0E7SUFBR0EsQ0FBQ0E7SUFFdEZEOztPQUVHQTtJQUNIQSxPQUFPQSxDQUFDQSxRQUFrQkE7UUFDeEJFLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ3BEQSxNQUFNQSxDQUFDQSxlQUFlQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtJQUNqREEsQ0FBQ0E7SUFFREYsUUFBUUEsQ0FBQ0EsS0FBVUEsSUFBYUcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7QUFDNUVILENBQUNBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBUFBfSUQsXG4gIEFQUExJQ0FUSU9OX0NPTU1PTl9QUk9WSURFUlMsXG4gIEFwcFZpZXdNYW5hZ2VyLFxuICBEaXJlY3RpdmVSZXNvbHZlcixcbiAgRHluYW1pY0NvbXBvbmVudExvYWRlcixcbiAgSW5qZWN0b3IsXG4gIE5nWm9uZSxcbiAgUmVuZGVyZXIsXG4gIFByb3ZpZGVyLFxuICBWaWV3UmVzb2x2ZXIsXG4gIHByb3ZpZGVcbn0gZnJvbSAnYW5ndWxhcjIvY29yZSc7XG5pbXBvcnQge0FuaW1hdGlvbkJ1aWxkZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9hbmltYXRlL2FuaW1hdGlvbl9idWlsZGVyJztcbmltcG9ydCB7TW9ja0FuaW1hdGlvbkJ1aWxkZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9tb2NrL2FuaW1hdGlvbl9idWlsZGVyX21vY2snO1xuXG5pbXBvcnQge1Byb3RvVmlld0ZhY3Rvcnl9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9wcm90b192aWV3X2ZhY3RvcnknO1xuaW1wb3J0IHtSZWZsZWN0b3IsIHJlZmxlY3Rvcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvcmVmbGVjdGlvbi9yZWZsZWN0aW9uJztcbmltcG9ydCB7XG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgZGVmYXVsdEl0ZXJhYmxlRGlmZmVycyxcbiAgS2V5VmFsdWVEaWZmZXJzLFxuICBkZWZhdWx0S2V5VmFsdWVEaWZmZXJzLFxuICBDaGFuZ2VEZXRlY3RvckdlbkNvbmZpZ1xufSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtFeGNlcHRpb25IYW5kbGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtQaXBlUmVzb2x2ZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9waXBlX3Jlc29sdmVyJztcbmltcG9ydCB7WEhSfSBmcm9tICdhbmd1bGFyMi9zcmMvY29tcGlsZXIveGhyJztcblxuaW1wb3J0IHtET019IGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS9kb20vZG9tX2FkYXB0ZXInO1xuXG5pbXBvcnQge01vY2tEaXJlY3RpdmVSZXNvbHZlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL21vY2svZGlyZWN0aXZlX3Jlc29sdmVyX21vY2snO1xuaW1wb3J0IHtNb2NrVmlld1Jlc29sdmVyfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay92aWV3X3Jlc29sdmVyX21vY2snO1xuaW1wb3J0IHtNb2NrTG9jYXRpb25TdHJhdGVneX0gZnJvbSAnYW5ndWxhcjIvc3JjL21vY2svbW9ja19sb2NhdGlvbl9zdHJhdGVneSc7XG5pbXBvcnQge0xvY2F0aW9uU3RyYXRlZ3l9IGZyb20gJ2FuZ3VsYXIyL3NyYy9yb3V0ZXIvbG9jYXRpb25fc3RyYXRlZ3knO1xuaW1wb3J0IHtNb2NrTmdab25lfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9uZ196b25lX21vY2snO1xuXG5pbXBvcnQge1Rlc3RDb21wb25lbnRCdWlsZGVyfSBmcm9tICcuL3Rlc3RfY29tcG9uZW50X2J1aWxkZXInO1xuXG5pbXBvcnQge1xuICBFdmVudE1hbmFnZXIsXG4gIEVWRU5UX01BTkFHRVJfUExVR0lOUyxcbiAgRUxFTUVOVF9QUk9CRV9QUk9WSURFUlNcbn0gZnJvbSAnYW5ndWxhcjIvcGxhdGZvcm0vY29tbW9uX2RvbSc7XG5cbmltcG9ydCB7TGlzdFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge0Z1bmN0aW9uV3JhcHBlciwgVHlwZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcblxuaW1wb3J0IHtBcHBWaWV3UG9vbCwgQVBQX1ZJRVdfUE9PTF9DQVBBQ0lUWX0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbGlua2VyL3ZpZXdfcG9vbCc7XG5pbXBvcnQge0FwcFZpZXdNYW5hZ2VyVXRpbHN9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci92aWV3X21hbmFnZXJfdXRpbHMnO1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL2RvbV90b2tlbnMnO1xuaW1wb3J0IHtEb21SZW5kZXJlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fcmVuZGVyZXInO1xuaW1wb3J0IHtEb21TaGFyZWRTdHlsZXNIb3N0fSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL3NoYXJlZF9zdHlsZXNfaG9zdCc7XG5pbXBvcnQge1NoYXJlZFN0eWxlc0hvc3R9IGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS9kb20vc2hhcmVkX3N0eWxlc19ob3N0JztcbmltcG9ydCB7RG9tRXZlbnRzUGx1Z2lufSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL2V2ZW50cy9kb21fZXZlbnRzJztcblxuaW1wb3J0IHtTZXJpYWxpemVyfSBmcm9tIFwiYW5ndWxhcjIvc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9zZXJpYWxpemVyXCI7XG5pbXBvcnQge0xvZ30gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge0NPTVBJTEVSX1BST1ZJREVSU30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvbXBpbGVyL2NvbXBpbGVyJztcbmltcG9ydCB7RG9tUmVuZGVyZXJffSBmcm9tIFwiYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fcmVuZGVyZXJcIjtcbmltcG9ydCB7RHluYW1pY0NvbXBvbmVudExvYWRlcl99IGZyb20gXCJhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvZHluYW1pY19jb21wb25lbnRfbG9hZGVyXCI7XG5pbXBvcnQge0FwcFZpZXdNYW5hZ2VyX30gZnJvbSBcImFuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci92aWV3X21hbmFnZXJcIjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IGluamVjdG9yIHByb3ZpZGVycy5cbiAqXG4gKiBUaGlzIG11c3QgYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIF9yb290QmluZGluZ3MgaW4gYXBwbGljYXRpb24uanNcbiAqXG4gKiBAcmV0dXJucyB7YW55W119XG4gKi9cbmZ1bmN0aW9uIF9nZXRSb290UHJvdmlkZXJzKCkge1xuICByZXR1cm4gW3Byb3ZpZGUoUmVmbGVjdG9yLCB7dXNlVmFsdWU6IHJlZmxlY3Rvcn0pXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhcHBsaWNhdGlvbiBpbmplY3RvciBwcm92aWRlcnMuXG4gKlxuICogVGhpcyBtdXN0IGJlIGtlcHQgaW4gc3luYyB3aXRoIF9pbmplY3RvckJpbmRpbmdzKCkgaW4gYXBwbGljYXRpb24uanNcbiAqXG4gKiBAcmV0dXJucyB7YW55W119XG4gKi9cbmZ1bmN0aW9uIF9nZXRBcHBCaW5kaW5ncygpIHtcbiAgdmFyIGFwcERvYztcblxuICAvLyBUaGUgZG9jdW1lbnQgaXMgb25seSBhdmFpbGFibGUgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICB0cnkge1xuICAgIGFwcERvYyA9IERPTS5kZWZhdWx0RG9jKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhcHBEb2MgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBBUFBMSUNBVElPTl9DT01NT05fUFJPVklERVJTLFxuICAgIHByb3ZpZGUoQ2hhbmdlRGV0ZWN0b3JHZW5Db25maWcsIHt1c2VWYWx1ZTogbmV3IENoYW5nZURldGVjdG9yR2VuQ29uZmlnKHRydWUsIGZhbHNlLCB0cnVlKX0pLFxuICAgIHByb3ZpZGUoRE9DVU1FTlQsIHt1c2VWYWx1ZTogYXBwRG9jfSksXG4gICAgcHJvdmlkZShEb21SZW5kZXJlciwge3VzZUNsYXNzOiBEb21SZW5kZXJlcl99KSxcbiAgICBwcm92aWRlKFJlbmRlcmVyLCB7dXNlRXhpc3Rpbmc6IERvbVJlbmRlcmVyfSksXG4gICAgcHJvdmlkZShBUFBfSUQsIHt1c2VWYWx1ZTogJ2EnfSksXG4gICAgRG9tU2hhcmVkU3R5bGVzSG9zdCxcbiAgICBwcm92aWRlKFNoYXJlZFN0eWxlc0hvc3QsIHt1c2VFeGlzdGluZzogRG9tU2hhcmVkU3R5bGVzSG9zdH0pLFxuICAgIEFwcFZpZXdQb29sLFxuICAgIHByb3ZpZGUoQXBwVmlld01hbmFnZXIsIHt1c2VDbGFzczogQXBwVmlld01hbmFnZXJffSksXG4gICAgQXBwVmlld01hbmFnZXJVdGlscyxcbiAgICBTZXJpYWxpemVyLFxuICAgIEVMRU1FTlRfUFJPQkVfUFJPVklERVJTLFxuICAgIHByb3ZpZGUoQVBQX1ZJRVdfUE9PTF9DQVBBQ0lUWSwge3VzZVZhbHVlOiA1MDB9KSxcbiAgICBQcm90b1ZpZXdGYWN0b3J5LFxuICAgIHByb3ZpZGUoRGlyZWN0aXZlUmVzb2x2ZXIsIHt1c2VDbGFzczogTW9ja0RpcmVjdGl2ZVJlc29sdmVyfSksXG4gICAgcHJvdmlkZShWaWV3UmVzb2x2ZXIsIHt1c2VDbGFzczogTW9ja1ZpZXdSZXNvbHZlcn0pLFxuICAgIHByb3ZpZGUoSXRlcmFibGVEaWZmZXJzLCB7dXNlVmFsdWU6IGRlZmF1bHRJdGVyYWJsZURpZmZlcnN9KSxcbiAgICBwcm92aWRlKEtleVZhbHVlRGlmZmVycywge3VzZVZhbHVlOiBkZWZhdWx0S2V5VmFsdWVEaWZmZXJzfSksXG4gICAgTG9nLFxuICAgIHByb3ZpZGUoRHluYW1pY0NvbXBvbmVudExvYWRlciwge3VzZUNsYXNzOiBEeW5hbWljQ29tcG9uZW50TG9hZGVyX30pLFxuICAgIFBpcGVSZXNvbHZlcixcbiAgICBwcm92aWRlKEV4Y2VwdGlvbkhhbmRsZXIsIHt1c2VWYWx1ZTogbmV3IEV4Y2VwdGlvbkhhbmRsZXIoRE9NKX0pLFxuICAgIHByb3ZpZGUoTG9jYXRpb25TdHJhdGVneSwge3VzZUNsYXNzOiBNb2NrTG9jYXRpb25TdHJhdGVneX0pLFxuICAgIHByb3ZpZGUoWEhSLCB7dXNlQ2xhc3M6IERPTS5nZXRYSFIoKX0pLFxuICAgIFRlc3RDb21wb25lbnRCdWlsZGVyLFxuICAgIHByb3ZpZGUoTmdab25lLCB7dXNlQ2xhc3M6IE1vY2tOZ1pvbmV9KSxcbiAgICBwcm92aWRlKEFuaW1hdGlvbkJ1aWxkZXIsIHt1c2VDbGFzczogTW9ja0FuaW1hdGlvbkJ1aWxkZXJ9KSxcbiAgICBFdmVudE1hbmFnZXIsXG4gICAgbmV3IFByb3ZpZGVyKEVWRU5UX01BTkFHRVJfUExVR0lOUywge3VzZUNsYXNzOiBEb21FdmVudHNQbHVnaW4sIG11bHRpOiB0cnVlfSlcbiAgXTtcbn1cblxuZnVuY3Rpb24gX3J1bnRpbWVDb21waWxlckJpbmRpbmdzKCkge1xuICByZXR1cm4gW1xuICAgIHByb3ZpZGUoWEhSLCB7dXNlQ2xhc3M6IERPTS5nZXRYSFIoKX0pLFxuICAgIENPTVBJTEVSX1BST1ZJREVSUyxcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlc3RJbmplY3Rvcihwcm92aWRlcnM6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IEluamVjdG9yIHtcbiAgdmFyIHJvb3RJbmplY3RvciA9IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoX2dldFJvb3RQcm92aWRlcnMoKSk7XG4gIHJldHVybiByb290SW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKExpc3RXcmFwcGVyLmNvbmNhdChfZ2V0QXBwQmluZGluZ3MoKSwgcHJvdmlkZXJzKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXN0SW5qZWN0b3JXaXRoUnVudGltZUNvbXBpbGVyKFxuICAgIHByb3ZpZGVyczogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KTogSW5qZWN0b3Ige1xuICByZXR1cm4gY3JlYXRlVGVzdEluamVjdG9yKExpc3RXcmFwcGVyLmNvbmNhdChfcnVudGltZUNvbXBpbGVyQmluZGluZ3MoKSwgcHJvdmlkZXJzKSk7XG59XG5cbi8qKlxuICogQWxsb3dzIGluamVjdGluZyBkZXBlbmRlbmNpZXMgaW4gYGJlZm9yZUVhY2goKWAgYW5kIGBpdCgpYC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogYmVmb3JlRWFjaChpbmplY3QoW0RlcGVuZGVuY3ksIEFDbGFzc10sIChkZXAsIG9iamVjdCkgPT4ge1xuICogICAvLyBzb21lIGNvZGUgdGhhdCB1c2VzIGBkZXBgIGFuZCBgb2JqZWN0YFxuICogICAvLyAuLi5cbiAqIH0pKTtcbiAqXG4gKiBpdCgnLi4uJywgaW5qZWN0KFtBQ2xhc3NdLCAob2JqZWN0KSA9PiB7XG4gKiAgIG9iamVjdC5kb1NvbWV0aGluZygpO1xuICogICBleHBlY3QoLi4uKTtcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBOb3RlczpcbiAqIC0gaW5qZWN0IGlzIGN1cnJlbnRseSBhIGZ1bmN0aW9uIGJlY2F1c2Ugb2Ygc29tZSBUcmFjZXVyIGxpbWl0YXRpb24gdGhlIHN5bnRheCBzaG91bGQgZXZlbnR1YWxseVxuICogICBiZWNvbWVzIGBpdCgnLi4uJywgQEluamVjdCAob2JqZWN0OiBBQ2xhc3MsIGFzeW5jOiBBc3luY1Rlc3RDb21wbGV0ZXIpID0+IHsgLi4uIH0pO2BcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB0b2tlbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbldpdGhQYXJhbVRva2Vuc31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiBGdW5jdGlvbldpdGhQYXJhbVRva2VucyB7XG4gIHJldHVybiBuZXcgRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnModG9rZW5zLCBmbiwgZmFsc2UpO1xufVxuXG4vKipcbiAqIEFsbG93cyBpbmplY3RpbmcgZGVwZW5kZW5jaWVzIGluIGBiZWZvcmVFYWNoKClgIGFuZCBgaXQoKWAuIFRoZSB0ZXN0IG11c3QgcmV0dXJuXG4gKiBhIHByb21pc2Ugd2hpY2ggd2lsbCByZXNvbHZlIHdoZW4gYWxsIGFzeW5jaHJvbm91cyBhY3Rpdml0eSBpcyBjb21wbGV0ZS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogaXQoJy4uLicsIGluamVjdEFzeW5jKFtBQ2xhc3NdLCAob2JqZWN0KSA9PiB7XG4gKiAgIHJldHVybiBvYmplY3QuZG9Tb21ldGhpbmcoKS50aGVuKCgpID0+IHtcbiAqICAgICBleHBlY3QoLi4uKTtcbiAqICAgfSk7XG4gKiB9KVxuICogYGBgXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdG9rZW5zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBc3luYyh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiBGdW5jdGlvbldpdGhQYXJhbVRva2VucyB7XG4gIHJldHVybiBuZXcgRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnModG9rZW5zLCBmbiwgdHJ1ZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGdW5jdGlvbldpdGhQYXJhbVRva2VucyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3Rva2VuczogYW55W10sIHByaXZhdGUgX2ZuOiBGdW5jdGlvbiwgcHVibGljIGlzQXN5bmM6IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBleGVjdXRlZCBmdW5jdGlvbi5cbiAgICovXG4gIGV4ZWN1dGUoaW5qZWN0b3I6IEluamVjdG9yKTogYW55IHtcbiAgICB2YXIgcGFyYW1zID0gdGhpcy5fdG9rZW5zLm1hcCh0ID0+IGluamVjdG9yLmdldCh0KSk7XG4gICAgcmV0dXJuIEZ1bmN0aW9uV3JhcHBlci5hcHBseSh0aGlzLl9mbiwgcGFyYW1zKTtcbiAgfVxuXG4gIGhhc1Rva2VuKHRva2VuOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3Rva2Vucy5pbmRleE9mKHRva2VuKSA+IC0xOyB9XG59XG4iXX0=