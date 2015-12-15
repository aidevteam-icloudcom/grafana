/* */ 
"format cjs";
import { unimplemented } from 'angular2/src/facade/exceptions';
/**
 * Represents an Angular ProtoView in the Rendering Context.
 *
 * When you implement a custom {@link Renderer}, `RenderProtoViewRef` specifies what Render View
 * your renderer should create.
 *
 * `RenderProtoViewRef` is a counterpart to {@link ProtoViewRef} available in the Application
 * Context. But unlike `ProtoViewRef`, `RenderProtoViewRef` contains all static nested Proto Views
 * that are recursively merged into a single Render Proto View.

 *
 * <!-- TODO: this is created by Renderer#createProtoView in the new compiler -->
 */
export class RenderProtoViewRef {
}
/**
 * Represents a list of sibling Nodes that can be moved by the {@link Renderer} independently of
 * other Render Fragments.
 *
 * Any {@link RenderViewRef} has one Render Fragment.
 *
 * Additionally any View with an Embedded View that contains a {@link NgContentAst View Projection}
 * results in additional Render Fragment.
 */
/*
  <div>foo</div>
  {{bar}}


  <div>foo</div> -> view 1 / fragment 1
  <ul>
    <template ngFor>
      <li>{{fg}}</li> -> view 2 / fragment 1
    </template>
  </ul>
  {{bar}}


  <div>foo</div> -> view 1 / fragment 1
  <ul>
    <template ngIf>
      <li><ng-content></></li> -> view 1 / fragment 2
    </template>
    <template ngFor>
      <li><ng-content></></li> ->
      <li></li>                -> view 1 / fragment 2 + view 2 / fragment 1..n-1
    </template>
  </ul>
  {{bar}}
 */
// TODO(i): refactor into an interface
export class RenderFragmentRef {
}
/**
 * Represents an Angular View in the Rendering Context.
 *
 * `RenderViewRef` specifies to the {@link Renderer} what View to update or destroy.
 *
 * Unlike a {@link ViewRef} available in the Application Context, Render View contains all the
 * static Component Views that have been recursively merged into a single Render View.
 *
 * Each `RenderViewRef` contains one or more {@link RenderFragmentRef Render Fragments}, these
 * Fragments are created, hydrated, dehydrated and destroyed as a single unit together with the
 * View.
 */
// TODO(i): refactor into an interface
export class RenderViewRef {
}
/**
 * Abstract base class for commands to the Angular renderer, using the visitor pattern.
 */
export class RenderTemplateCmd {
}
/**
 * Command to begin rendering.
 */
export class RenderBeginCmd extends RenderTemplateCmd {
    get ngContentIndex() { return unimplemented(); }
    ;
    get isBound() { return unimplemented(); }
    ;
}
/**
 * Command to render text.
 */
export class RenderTextCmd extends RenderBeginCmd {
    get value() { return unimplemented(); }
    ;
}
/**
 * Command to render projected content.
 */
export class RenderNgContentCmd extends RenderTemplateCmd {
    // The index of this NgContent element
    get index() { return unimplemented(); }
    ;
    // The index of the NgContent element into which this
    // NgContent element should be projected (if any)
    get ngContentIndex() { return unimplemented(); }
    ;
}
/**
 * Command to begin rendering an element.
 */
export class RenderBeginElementCmd extends RenderBeginCmd {
    get name() { return unimplemented(); }
    ;
    get attrNameAndValues() { return unimplemented(); }
    ;
    get eventTargetAndNames() { return unimplemented(); }
    ;
}
/**
 * Command to begin rendering a component.
 */
export class RenderBeginComponentCmd extends RenderBeginElementCmd {
    get templateId() { return unimplemented(); }
    ;
}
/**
 * Command to render a component's template.
 */
export class RenderEmbeddedTemplateCmd extends RenderBeginElementCmd {
    get isMerged() { return unimplemented(); }
    ;
    get children() { return unimplemented(); }
    ;
}
/**
 * Container class produced by a {@link Renderer} when creating a Render View.
 *
 * An instance of `RenderViewWithFragments` contains a {@link RenderViewRef} and an array of
 * {@link RenderFragmentRef}s belonging to this Render View.
 */
// TODO(i): refactor this by RenderViewWithFragments and adding fragments directly to RenderViewRef
export class RenderViewWithFragments {
    constructor(
        /**
         * Reference to the {@link RenderViewRef}.
         */
        viewRef, 
        /**
         * Array of {@link RenderFragmentRef}s ordered in the depth-first order.
         */
        fragmentRefs) {
        this.viewRef = viewRef;
        this.fragmentRefs = fragmentRefs;
    }
}
/**
 * Template for rendering a component, including commands and styles.
 */
export class RenderComponentTemplate {
    constructor(id, shortId, encapsulation, commands, styles) {
        this.id = id;
        this.shortId = shortId;
        this.encapsulation = encapsulation;
        this.commands = commands;
        this.styles = styles;
    }
}
/**
 * Injectable service that provides a low-level interface for modifying the UI.
 *
 * Use this service to bypass Angular's templating and make custom UI changes that can't be
 * expressed declaratively. For example if you need to set a property or an attribute whose name is
 * not statically known, use {@link #setElementProperty} or {@link #setElementAttribute}
 * respectively.
 *
 * If you are implementing a custom renderer, you must implement this interface.
 *
 * The default Renderer implementation is `DomRenderer`. Also available is `WebWorkerRenderer`.
 */
export class Renderer {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL2NvcmUvcmVuZGVyL2FwaS50cyJdLCJuYW1lcyI6WyJSZW5kZXJQcm90b1ZpZXdSZWYiLCJSZW5kZXJGcmFnbWVudFJlZiIsIlJlbmRlclZpZXdSZWYiLCJSZW5kZXJUZW1wbGF0ZUNtZCIsIlJlbmRlckJlZ2luQ21kIiwiUmVuZGVyQmVnaW5DbWQubmdDb250ZW50SW5kZXgiLCJSZW5kZXJCZWdpbkNtZC5pc0JvdW5kIiwiUmVuZGVyVGV4dENtZCIsIlJlbmRlclRleHRDbWQudmFsdWUiLCJSZW5kZXJOZ0NvbnRlbnRDbWQiLCJSZW5kZXJOZ0NvbnRlbnRDbWQuaW5kZXgiLCJSZW5kZXJOZ0NvbnRlbnRDbWQubmdDb250ZW50SW5kZXgiLCJSZW5kZXJCZWdpbkVsZW1lbnRDbWQiLCJSZW5kZXJCZWdpbkVsZW1lbnRDbWQubmFtZSIsIlJlbmRlckJlZ2luRWxlbWVudENtZC5hdHRyTmFtZUFuZFZhbHVlcyIsIlJlbmRlckJlZ2luRWxlbWVudENtZC5ldmVudFRhcmdldEFuZE5hbWVzIiwiUmVuZGVyQmVnaW5Db21wb25lbnRDbWQiLCJSZW5kZXJCZWdpbkNvbXBvbmVudENtZC50ZW1wbGF0ZUlkIiwiUmVuZGVyRW1iZWRkZWRUZW1wbGF0ZUNtZCIsIlJlbmRlckVtYmVkZGVkVGVtcGxhdGVDbWQuaXNNZXJnZWQiLCJSZW5kZXJFbWJlZGRlZFRlbXBsYXRlQ21kLmNoaWxkcmVuIiwiUmVuZGVyVmlld1dpdGhGcmFnbWVudHMiLCJSZW5kZXJWaWV3V2l0aEZyYWdtZW50cy5jb25zdHJ1Y3RvciIsIlJlbmRlckNvbXBvbmVudFRlbXBsYXRlIiwiUmVuZGVyQ29tcG9uZW50VGVtcGxhdGUuY29uc3RydWN0b3IiLCJSZW5kZXJlciJdLCJtYXBwaW5ncyI6Ik9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQ0FBZ0M7QUFJNUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0g7QUFBaUNBLENBQUNBO0FBRWxDOzs7Ozs7OztHQVFHO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Qkc7QUFDSCxzQ0FBc0M7QUFDdEM7QUFBZ0NDLENBQUNBO0FBR2pDOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsc0NBQXNDO0FBQ3RDO0FBQTRCQyxDQUFDQTtBQUU3Qjs7R0FFRztBQUNIO0FBRUFDLENBQUNBO0FBRUQ7O0dBRUc7QUFDSCxvQ0FBNkMsaUJBQWlCO0lBQzVEQyxJQUFJQSxjQUFjQSxLQUFhQyxNQUFNQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs7SUFDeERELElBQUlBLE9BQU9BLEtBQWNFLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztBQUNwREYsQ0FBQ0E7QUFFRDs7R0FFRztBQUNILG1DQUE0QyxjQUFjO0lBQ3hERyxJQUFJQSxLQUFLQSxLQUFhQyxNQUFNQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs7QUFDakRELENBQUNBO0FBRUQ7O0dBRUc7QUFDSCx3Q0FBaUQsaUJBQWlCO0lBQ2hFRSxzQ0FBc0NBO0lBQ3RDQSxJQUFJQSxLQUFLQSxLQUFhQyxNQUFNQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs7SUFDL0NELHFEQUFxREE7SUFDckRBLGlEQUFpREE7SUFDakRBLElBQUlBLGNBQWNBLEtBQWFFLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztBQUMxREYsQ0FBQ0E7QUFFRDs7R0FFRztBQUNILDJDQUFvRCxjQUFjO0lBQ2hFRyxJQUFJQSxJQUFJQSxLQUFhQyxNQUFNQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTs7SUFDOUNELElBQUlBLGlCQUFpQkEsS0FBZUUsTUFBTUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7O0lBQzdERixJQUFJQSxtQkFBbUJBLEtBQWVHLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztBQUNqRUgsQ0FBQ0E7QUFFRDs7R0FFRztBQUNILDZDQUFzRCxxQkFBcUI7SUFDekVJLElBQUlBLFVBQVVBLEtBQWFDLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztBQUN0REQsQ0FBQ0E7QUFFRDs7R0FFRztBQUNILCtDQUF3RCxxQkFBcUI7SUFDM0VFLElBQUlBLFFBQVFBLEtBQWNDLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztJQUNuREQsSUFBSUEsUUFBUUEsS0FBMEJFLE1BQU1BLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBOztBQUNqRUYsQ0FBQ0E7QUFnQkQ7Ozs7O0dBS0c7QUFDSCxtR0FBbUc7QUFDbkc7SUFDRUc7UUFDSUE7O1dBRUdBO1FBQ0lBLE9BQXNCQTtRQUM3QkE7O1dBRUdBO1FBQ0lBLFlBQWlDQTtRQUpqQ0MsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBZUE7UUFJdEJBLGlCQUFZQSxHQUFaQSxZQUFZQSxDQUFxQkE7SUFBR0EsQ0FBQ0E7QUFDbERELENBQUNBO0FBMEJEOztHQUVHO0FBQ0g7SUFDRUUsWUFBbUJBLEVBQVVBLEVBQVNBLE9BQWVBLEVBQVNBLGFBQWdDQSxFQUMzRUEsUUFBNkJBLEVBQVNBLE1BQWdCQTtRQUR0REMsT0FBRUEsR0FBRkEsRUFBRUEsQ0FBUUE7UUFBU0EsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBUUE7UUFBU0Esa0JBQWFBLEdBQWJBLGFBQWFBLENBQW1CQTtRQUMzRUEsYUFBUUEsR0FBUkEsUUFBUUEsQ0FBcUJBO1FBQVNBLFdBQU1BLEdBQU5BLE1BQU1BLENBQVVBO0lBQUdBLENBQUNBO0FBQy9FRCxDQUFDQTtBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0g7QUErSkFFLENBQUNBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3VuaW1wbGVtZW50ZWR9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge01hcH0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9jb2xsZWN0aW9uJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL21ldGFkYXRhJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEFuZ3VsYXIgUHJvdG9WaWV3IGluIHRoZSBSZW5kZXJpbmcgQ29udGV4dC5cbiAqXG4gKiBXaGVuIHlvdSBpbXBsZW1lbnQgYSBjdXN0b20ge0BsaW5rIFJlbmRlcmVyfSwgYFJlbmRlclByb3RvVmlld1JlZmAgc3BlY2lmaWVzIHdoYXQgUmVuZGVyIFZpZXdcbiAqIHlvdXIgcmVuZGVyZXIgc2hvdWxkIGNyZWF0ZS5cbiAqXG4gKiBgUmVuZGVyUHJvdG9WaWV3UmVmYCBpcyBhIGNvdW50ZXJwYXJ0IHRvIHtAbGluayBQcm90b1ZpZXdSZWZ9IGF2YWlsYWJsZSBpbiB0aGUgQXBwbGljYXRpb25cbiAqIENvbnRleHQuIEJ1dCB1bmxpa2UgYFByb3RvVmlld1JlZmAsIGBSZW5kZXJQcm90b1ZpZXdSZWZgIGNvbnRhaW5zIGFsbCBzdGF0aWMgbmVzdGVkIFByb3RvIFZpZXdzXG4gKiB0aGF0IGFyZSByZWN1cnNpdmVseSBtZXJnZWQgaW50byBhIHNpbmdsZSBSZW5kZXIgUHJvdG8gVmlldy5cblxuICpcbiAqIDwhLS0gVE9ETzogdGhpcyBpcyBjcmVhdGVkIGJ5IFJlbmRlcmVyI2NyZWF0ZVByb3RvVmlldyBpbiB0aGUgbmV3IGNvbXBpbGVyIC0tPlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyUHJvdG9WaWV3UmVmIHt9XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGxpc3Qgb2Ygc2libGluZyBOb2RlcyB0aGF0IGNhbiBiZSBtb3ZlZCBieSB0aGUge0BsaW5rIFJlbmRlcmVyfSBpbmRlcGVuZGVudGx5IG9mXG4gKiBvdGhlciBSZW5kZXIgRnJhZ21lbnRzLlxuICpcbiAqIEFueSB7QGxpbmsgUmVuZGVyVmlld1JlZn0gaGFzIG9uZSBSZW5kZXIgRnJhZ21lbnQuXG4gKlxuICogQWRkaXRpb25hbGx5IGFueSBWaWV3IHdpdGggYW4gRW1iZWRkZWQgVmlldyB0aGF0IGNvbnRhaW5zIGEge0BsaW5rIE5nQ29udGVudEFzdCBWaWV3IFByb2plY3Rpb259XG4gKiByZXN1bHRzIGluIGFkZGl0aW9uYWwgUmVuZGVyIEZyYWdtZW50LlxuICovXG4vKlxuICA8ZGl2PmZvbzwvZGl2PlxuICB7e2Jhcn19XG5cblxuICA8ZGl2PmZvbzwvZGl2PiAtPiB2aWV3IDEgLyBmcmFnbWVudCAxXG4gIDx1bD5cbiAgICA8dGVtcGxhdGUgbmdGb3I+XG4gICAgICA8bGk+e3tmZ319PC9saT4gLT4gdmlldyAyIC8gZnJhZ21lbnQgMVxuICAgIDwvdGVtcGxhdGU+XG4gIDwvdWw+XG4gIHt7YmFyfX1cblxuXG4gIDxkaXY+Zm9vPC9kaXY+IC0+IHZpZXcgMSAvIGZyYWdtZW50IDFcbiAgPHVsPlxuICAgIDx0ZW1wbGF0ZSBuZ0lmPlxuICAgICAgPGxpPjxuZy1jb250ZW50PjwvPjwvbGk+IC0+IHZpZXcgMSAvIGZyYWdtZW50IDJcbiAgICA8L3RlbXBsYXRlPlxuICAgIDx0ZW1wbGF0ZSBuZ0Zvcj5cbiAgICAgIDxsaT48bmctY29udGVudD48Lz48L2xpPiAtPlxuICAgICAgPGxpPjwvbGk+ICAgICAgICAgICAgICAgIC0+IHZpZXcgMSAvIGZyYWdtZW50IDIgKyB2aWV3IDIgLyBmcmFnbWVudCAxLi5uLTFcbiAgICA8L3RlbXBsYXRlPlxuICA8L3VsPlxuICB7e2Jhcn19XG4gKi9cbi8vIFRPRE8oaSk6IHJlZmFjdG9yIGludG8gYW4gaW50ZXJmYWNlXG5leHBvcnQgY2xhc3MgUmVuZGVyRnJhZ21lbnRSZWYge31cblxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW5ndWxhciBWaWV3IGluIHRoZSBSZW5kZXJpbmcgQ29udGV4dC5cbiAqXG4gKiBgUmVuZGVyVmlld1JlZmAgc3BlY2lmaWVzIHRvIHRoZSB7QGxpbmsgUmVuZGVyZXJ9IHdoYXQgVmlldyB0byB1cGRhdGUgb3IgZGVzdHJveS5cbiAqXG4gKiBVbmxpa2UgYSB7QGxpbmsgVmlld1JlZn0gYXZhaWxhYmxlIGluIHRoZSBBcHBsaWNhdGlvbiBDb250ZXh0LCBSZW5kZXIgVmlldyBjb250YWlucyBhbGwgdGhlXG4gKiBzdGF0aWMgQ29tcG9uZW50IFZpZXdzIHRoYXQgaGF2ZSBiZWVuIHJlY3Vyc2l2ZWx5IG1lcmdlZCBpbnRvIGEgc2luZ2xlIFJlbmRlciBWaWV3LlxuICpcbiAqIEVhY2ggYFJlbmRlclZpZXdSZWZgIGNvbnRhaW5zIG9uZSBvciBtb3JlIHtAbGluayBSZW5kZXJGcmFnbWVudFJlZiBSZW5kZXIgRnJhZ21lbnRzfSwgdGhlc2VcbiAqIEZyYWdtZW50cyBhcmUgY3JlYXRlZCwgaHlkcmF0ZWQsIGRlaHlkcmF0ZWQgYW5kIGRlc3Ryb3llZCBhcyBhIHNpbmdsZSB1bml0IHRvZ2V0aGVyIHdpdGggdGhlXG4gKiBWaWV3LlxuICovXG4vLyBUT0RPKGkpOiByZWZhY3RvciBpbnRvIGFuIGludGVyZmFjZVxuZXhwb3J0IGNsYXNzIFJlbmRlclZpZXdSZWYge31cblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBjb21tYW5kcyB0byB0aGUgQW5ndWxhciByZW5kZXJlciwgdXNpbmcgdGhlIHZpc2l0b3IgcGF0dGVybi5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlclRlbXBsYXRlQ21kIHtcbiAgYWJzdHJhY3QgdmlzaXQodmlzaXRvcjogUmVuZGVyQ29tbWFuZFZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueTtcbn1cblxuLyoqXG4gKiBDb21tYW5kIHRvIGJlZ2luIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlckJlZ2luQ21kIGV4dGVuZHMgUmVuZGVyVGVtcGxhdGVDbWQge1xuICBnZXQgbmdDb250ZW50SW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcbiAgZ2V0IGlzQm91bmQoKTogYm9vbGVhbiB7IHJldHVybiB1bmltcGxlbWVudGVkKCk7IH07XG59XG5cbi8qKlxuICogQ29tbWFuZCB0byByZW5kZXIgdGV4dC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlclRleHRDbWQgZXh0ZW5kcyBSZW5kZXJCZWdpbkNtZCB7XG4gIGdldCB2YWx1ZSgpOiBzdHJpbmcgeyByZXR1cm4gdW5pbXBsZW1lbnRlZCgpOyB9O1xufVxuXG4vKipcbiAqIENvbW1hbmQgdG8gcmVuZGVyIHByb2plY3RlZCBjb250ZW50LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyTmdDb250ZW50Q21kIGV4dGVuZHMgUmVuZGVyVGVtcGxhdGVDbWQge1xuICAvLyBUaGUgaW5kZXggb2YgdGhpcyBOZ0NvbnRlbnQgZWxlbWVudFxuICBnZXQgaW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcbiAgLy8gVGhlIGluZGV4IG9mIHRoZSBOZ0NvbnRlbnQgZWxlbWVudCBpbnRvIHdoaWNoIHRoaXNcbiAgLy8gTmdDb250ZW50IGVsZW1lbnQgc2hvdWxkIGJlIHByb2plY3RlZCAoaWYgYW55KVxuICBnZXQgbmdDb250ZW50SW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcbn1cblxuLyoqXG4gKiBDb21tYW5kIHRvIGJlZ2luIHJlbmRlcmluZyBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyQmVnaW5FbGVtZW50Q21kIGV4dGVuZHMgUmVuZGVyQmVnaW5DbWQge1xuICBnZXQgbmFtZSgpOiBzdHJpbmcgeyByZXR1cm4gdW5pbXBsZW1lbnRlZCgpOyB9O1xuICBnZXQgYXR0ck5hbWVBbmRWYWx1ZXMoKTogc3RyaW5nW10geyByZXR1cm4gdW5pbXBsZW1lbnRlZCgpOyB9O1xuICBnZXQgZXZlbnRUYXJnZXRBbmROYW1lcygpOiBzdHJpbmdbXSB7IHJldHVybiB1bmltcGxlbWVudGVkKCk7IH07XG59XG5cbi8qKlxuICogQ29tbWFuZCB0byBiZWdpbiByZW5kZXJpbmcgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJCZWdpbkNvbXBvbmVudENtZCBleHRlbmRzIFJlbmRlckJlZ2luRWxlbWVudENtZCB7XG4gIGdldCB0ZW1wbGF0ZUlkKCk6IHN0cmluZyB7IHJldHVybiB1bmltcGxlbWVudGVkKCk7IH07XG59XG5cbi8qKlxuICogQ29tbWFuZCB0byByZW5kZXIgYSBjb21wb25lbnQncyB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlckVtYmVkZGVkVGVtcGxhdGVDbWQgZXh0ZW5kcyBSZW5kZXJCZWdpbkVsZW1lbnRDbWQge1xuICBnZXQgaXNNZXJnZWQoKTogYm9vbGVhbiB7IHJldHVybiB1bmltcGxlbWVudGVkKCk7IH07XG4gIGdldCBjaGlsZHJlbigpOiBSZW5kZXJUZW1wbGF0ZUNtZFtdIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcbn1cblxuLyoqXG4gKiBWaXNpdG9yIGZvciBhIHtAbGluayBSZW5kZXJUZW1wbGF0ZUNtZH0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyQ29tbWFuZFZpc2l0b3Ige1xuICB2aXNpdFRleHQoY21kOiBSZW5kZXJUZXh0Q21kLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0TmdDb250ZW50KGNtZDogUmVuZGVyTmdDb250ZW50Q21kLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QmVnaW5FbGVtZW50KGNtZDogUmVuZGVyQmVnaW5FbGVtZW50Q21kLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RW5kRWxlbWVudChjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QmVnaW5Db21wb25lbnQoY21kOiBSZW5kZXJCZWdpbkNvbXBvbmVudENtZCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdEVuZENvbXBvbmVudChjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0RW1iZWRkZWRUZW1wbGF0ZShjbWQ6IFJlbmRlckVtYmVkZGVkVGVtcGxhdGVDbWQsIGNvbnRleHQ6IGFueSk6IGFueTtcbn1cblxuXG4vKipcbiAqIENvbnRhaW5lciBjbGFzcyBwcm9kdWNlZCBieSBhIHtAbGluayBSZW5kZXJlcn0gd2hlbiBjcmVhdGluZyBhIFJlbmRlciBWaWV3LlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIGBSZW5kZXJWaWV3V2l0aEZyYWdtZW50c2AgY29udGFpbnMgYSB7QGxpbmsgUmVuZGVyVmlld1JlZn0gYW5kIGFuIGFycmF5IG9mXG4gKiB7QGxpbmsgUmVuZGVyRnJhZ21lbnRSZWZ9cyBiZWxvbmdpbmcgdG8gdGhpcyBSZW5kZXIgVmlldy5cbiAqL1xuLy8gVE9ETyhpKTogcmVmYWN0b3IgdGhpcyBieSBSZW5kZXJWaWV3V2l0aEZyYWdtZW50cyBhbmQgYWRkaW5nIGZyYWdtZW50cyBkaXJlY3RseSB0byBSZW5kZXJWaWV3UmVmXG5leHBvcnQgY2xhc3MgUmVuZGVyVmlld1dpdGhGcmFnbWVudHMge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogUmVmZXJlbmNlIHRvIHRoZSB7QGxpbmsgUmVuZGVyVmlld1JlZn0uXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyB2aWV3UmVmOiBSZW5kZXJWaWV3UmVmLFxuICAgICAgLyoqXG4gICAgICAgKiBBcnJheSBvZiB7QGxpbmsgUmVuZGVyRnJhZ21lbnRSZWZ9cyBvcmRlcmVkIGluIHRoZSBkZXB0aC1maXJzdCBvcmRlci5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGZyYWdtZW50UmVmczogUmVuZGVyRnJhZ21lbnRSZWZbXSkge31cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEVsZW1lbnQgdGhhdCBpcyBwYXJ0IG9mIGEge0BsaW5rIFJlbmRlclZpZXdSZWYgUmVuZGVyIFZpZXd9LlxuICpcbiAqIGBSZW5kZXJFbGVtZW50UmVmYCBpcyBhIGNvdW50ZXJwYXJ0IHRvIHtAbGluayBFbGVtZW50UmVmfSBhdmFpbGFibGUgaW4gdGhlIEFwcGxpY2F0aW9uIENvbnRleHQuXG4gKlxuICogV2hlbiB1c2luZyBgUmVuZGVyZXJgIGZyb20gdGhlIEFwcGxpY2F0aW9uIENvbnRleHQsIGBFbGVtZW50UmVmYCBjYW4gYmUgdXNlZCBpbnN0ZWFkIG9mXG4gKiBgUmVuZGVyRWxlbWVudFJlZmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyRWxlbWVudFJlZiB7XG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIFJlbmRlciBWaWV3IHRoYXQgY29udGFpbnMgdGhpcyBFbGVtZW50LlxuICAgKi9cbiAgcmVuZGVyVmlldzogUmVuZGVyVmlld1JlZjtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqXG4gICAqIEluZGV4IG9mIHRoZSBFbGVtZW50IChpbiB0aGUgZGVwdGgtZmlyc3Qgb3JkZXIpIGluc2lkZSB0aGUgUmVuZGVyIFZpZXcuXG4gICAqXG4gICAqIFRoaXMgaW5kZXggaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IEFuZ3VsYXIgdG8gbG9jYXRlIGVsZW1lbnRzLlxuICAgKi9cbiAgYm91bmRFbGVtZW50SW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUZW1wbGF0ZSBmb3IgcmVuZGVyaW5nIGEgY29tcG9uZW50LCBpbmNsdWRpbmcgY29tbWFuZHMgYW5kIHN0eWxlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlckNvbXBvbmVudFRlbXBsYXRlIHtcbiAgY29uc3RydWN0b3IocHVibGljIGlkOiBzdHJpbmcsIHB1YmxpYyBzaG9ydElkOiBzdHJpbmcsIHB1YmxpYyBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICAgICAgICAgICAgcHVibGljIGNvbW1hbmRzOiBSZW5kZXJUZW1wbGF0ZUNtZFtdLCBwdWJsaWMgc3R5bGVzOiBzdHJpbmdbXSkge31cbn1cblxuLyoqXG4gKiBJbmplY3RhYmxlIHNlcnZpY2UgdGhhdCBwcm92aWRlcyBhIGxvdy1sZXZlbCBpbnRlcmZhY2UgZm9yIG1vZGlmeWluZyB0aGUgVUkuXG4gKlxuICogVXNlIHRoaXMgc2VydmljZSB0byBieXBhc3MgQW5ndWxhcidzIHRlbXBsYXRpbmcgYW5kIG1ha2UgY3VzdG9tIFVJIGNoYW5nZXMgdGhhdCBjYW4ndCBiZVxuICogZXhwcmVzc2VkIGRlY2xhcmF0aXZlbHkuIEZvciBleGFtcGxlIGlmIHlvdSBuZWVkIHRvIHNldCBhIHByb3BlcnR5IG9yIGFuIGF0dHJpYnV0ZSB3aG9zZSBuYW1lIGlzXG4gKiBub3Qgc3RhdGljYWxseSBrbm93biwgdXNlIHtAbGluayAjc2V0RWxlbWVudFByb3BlcnR5fSBvciB7QGxpbmsgI3NldEVsZW1lbnRBdHRyaWJ1dGV9XG4gKiByZXNwZWN0aXZlbHkuXG4gKlxuICogSWYgeW91IGFyZSBpbXBsZW1lbnRpbmcgYSBjdXN0b20gcmVuZGVyZXIsIHlvdSBtdXN0IGltcGxlbWVudCB0aGlzIGludGVyZmFjZS5cbiAqXG4gKiBUaGUgZGVmYXVsdCBSZW5kZXJlciBpbXBsZW1lbnRhdGlvbiBpcyBgRG9tUmVuZGVyZXJgLiBBbHNvIGF2YWlsYWJsZSBpcyBgV2ViV29ya2VyUmVuZGVyZXJgLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyZXIge1xuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY29tcG9uZW50IHRlbXBsYXRlIHJlcHJlc2VudGVkIGFzIGFycmF5cyBvZiB7QGxpbmsgUmVuZGVyVGVtcGxhdGVDbWR9cyBhbmQgc3R5bGVzXG4gICAqIHdpdGggdGhlIFJlbmRlcmVyLlxuICAgKlxuICAgKiBPbmNlIGEgdGVtcGxhdGUgaXMgcmVnaXN0ZXJlZCBpdCBjYW4gYmUgcmVmZXJlbmNlZCB2aWEge0BsaW5rIFJlbmRlckJlZ2luQ29tcG9uZW50Q21kfSB3aGVuXG4gICAqIHtAbGluayAjY3JlYXRlUHJvdG9WaWV3IGNyZWF0aW5nIFJlbmRlciBQcm90b1ZpZXd9LlxuICAgKi9cbiAgYWJzdHJhY3QgcmVnaXN0ZXJDb21wb25lbnRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVuZGVyQ29tcG9uZW50VGVtcGxhdGUpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEge0BsaW5rIFJlbmRlclByb3RvVmlld1JlZn0gZnJvbSBhbiBhcnJheSBvZiB7QGxpbmsgUmVuZGVyVGVtcGxhdGVDbWR9YHMuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVQcm90b1ZpZXcoY29tcG9uZW50VGVtcGxhdGVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kczogUmVuZGVyVGVtcGxhdGVDbWRbXSk6IFJlbmRlclByb3RvVmlld1JlZjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFJvb3QgSG9zdCBWaWV3IGJhc2VkIG9uIHRoZSBwcm92aWRlZCBgaG9zdFByb3RvVmlld1JlZmAuXG4gICAqXG4gICAqIGBmcmFnbWVudENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIG5lc3RlZCB7QGxpbmsgUmVuZGVyRnJhZ21lbnRSZWZ9cyBpbiB0aGlzIFZpZXcuIFRoaXMgcGFyYW1ldGVyXG4gICAqIGlzIG5vbi1vcHRpb25hbCBzbyB0aGF0IHRoZSByZW5kZXJlciBjYW4gY3JlYXRlIGEgcmVzdWx0IHN5bmNocm9ub3VzbHkgZXZlbiB3aGVuIGFwcGxpY2F0aW9uXG4gICAqIHJ1bnMgaW4gYSBkaWZmZXJlbnQgY29udGV4dCAoZS5nLiBpbiBhIFdlYiBXb3JrZXIpLlxuICAgKlxuICAgKiBgaG9zdEVsZW1lbnRTZWxlY3RvcmAgaXMgYSAoQ1NTKSBzZWxlY3RvciBmb3IgcXVlcnlpbmcgdGhlIG1haW4gZG9jdW1lbnQgdG8gZmluZCB0aGUgSG9zdFxuICAgKiBFbGVtZW50LiBUaGUgbmV3bHkgY3JlYXRlZCBSb290IEhvc3QgVmlldyBzaG91bGQgYmUgYXR0YWNoZWQgdG8gdGhpcyBlbGVtZW50LlxuICAgKlxuICAgKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIHtAbGluayBSZW5kZXJWaWV3V2l0aEZyYWdtZW50c30sIHJlcHJlc2VudGluZyB0aGUgUmVuZGVyIFZpZXcuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVSb290SG9zdFZpZXcoaG9zdFByb3RvVmlld1JlZjogUmVuZGVyUHJvdG9WaWV3UmVmLCBmcmFnbWVudENvdW50OiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0RWxlbWVudFNlbGVjdG9yOiBzdHJpbmcpOiBSZW5kZXJWaWV3V2l0aEZyYWdtZW50cztcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFJlbmRlciBWaWV3IGJhc2VkIG9uIHRoZSBwcm92aWRlZCBgcHJvdG9WaWV3UmVmYC5cbiAgICpcbiAgICogYGZyYWdtZW50Q291bnRgIGlzIHRoZSBudW1iZXIgb2YgbmVzdGVkIHtAbGluayBSZW5kZXJGcmFnbWVudFJlZn1zIGluIHRoaXMgVmlldy4gVGhpcyBwYXJhbWV0ZXJcbiAgICogaXMgbm9uLW9wdGlvbmFsIHNvIHRoYXQgdGhlIHJlbmRlcmVyIGNhbiBjcmVhdGUgYSByZXN1bHQgc3luY2hyb25vdXNseSBldmVuIHdoZW4gYXBwbGljYXRpb25cbiAgICogcnVucyBpbiBhIGRpZmZlcmVudCBjb250ZXh0IChlLmcuIGluIGEgV2ViIFdvcmtlcikuXG4gICAqXG4gICAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2Yge0BsaW5rIFJlbmRlclZpZXdXaXRoRnJhZ21lbnRzfSwgcmVwcmVzZW50aW5nIHRoZSBSZW5kZXIgVmlldy5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZVZpZXcocHJvdG9WaWV3UmVmOiBSZW5kZXJQcm90b1ZpZXdSZWYsXG4gICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRDb3VudDogbnVtYmVyKTogUmVuZGVyVmlld1dpdGhGcmFnbWVudHM7XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGEgUmVuZGVyIFZpZXcgc3BlY2lmaWVkIHZpYSBgdmlld1JlZmAuXG4gICAqXG4gICAqIFRoaXMgb3BlcmF0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb25seSBvbiBhIFZpZXcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGRlaHlkcmF0ZWQgYW5kXG4gICAqIGFsbCBvZiBpdHMgUmVuZGVyIEZyYWdtZW50cyBoYXZlIGJlZW4gZGV0YWNoZWQuXG4gICAqXG4gICAqIERlc3Ryb3lpbmcgYSBWaWV3IGluZGljYXRlcyB0byB0aGUgUmVuZGVyZXIgdGhhdCB0aGlzIFZpZXcgaXMgbm90IGdvaW5nIHRvIGJlIHJlZmVyZW5jZWQgaW4gYW55XG4gICAqIGZ1dHVyZSBvcGVyYXRpb25zLiBJZiB0aGUgUmVuZGVyZXIgY3JlYXRlZCBhbnkgcmVuZGVyZXItc3BlY2lmaWMgb2JqZWN0cyBmb3IgdGhpcyBWaWV3LCB0aGVzZVxuICAgKiBvYmplY3RzIHNob3VsZCBub3cgYmUgZGVzdHJveWVkIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzLlxuICAgKi9cbiAgYWJzdHJhY3QgZGVzdHJveVZpZXcodmlld1JlZjogUmVuZGVyVmlld1JlZik7XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIHRoZSBOb2RlcyBvZiBhIFJlbmRlciBGcmFnbWVudCBhZnRlciB0aGUgbGFzdCBOb2RlIG9mIGBwcmV2aW91c0ZyYWdtZW50UmVmYC5cbiAgICovXG4gIGFic3RyYWN0IGF0dGFjaEZyYWdtZW50QWZ0ZXJGcmFnbWVudChwcmV2aW91c0ZyYWdtZW50UmVmOiBSZW5kZXJGcmFnbWVudFJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50UmVmOiBSZW5kZXJGcmFnbWVudFJlZik7XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIHRoZSBOb2RlcyBvZiB0aGUgUmVuZGVyIEZyYWdtZW50IGFmdGVyIGFuIEVsZW1lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBhdHRhY2hGcmFnbWVudEFmdGVyRWxlbWVudChlbGVtZW50UmVmOiBSZW5kZXJFbGVtZW50UmVmLCBmcmFnbWVudFJlZjogUmVuZGVyRnJhZ21lbnRSZWYpO1xuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyB0aGUgTm9kZXMgb2YgYSBSZW5kZXIgRnJhZ21lbnQgZnJvbSB0aGVpciBwYXJlbnQuXG4gICAqXG4gICAqIFRoaXMgb3BlcmF0aW9ucyBzaG91bGQgYmUgY2FsbGVkIG9ubHkgb24gYSBWaWV3IHRoYXQgaGFzIGJlZW4gYWxyZWFkeVxuICAgKiB7QGxpbmsgI2RlaHlkcmF0ZVZpZXcgZGVoeWRyYXRlZH0uXG4gICAqL1xuICBhYnN0cmFjdCBkZXRhY2hGcmFnbWVudChmcmFnbWVudFJlZjogUmVuZGVyRnJhZ21lbnRSZWYpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyBhIGN1c3RvbSBSZW5kZXJlciB0byBpbml0aWFsaXplIGEgUmVuZGVyIFZpZXcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBieSBBbmd1bGFyIGFmdGVyIGEgUmVuZGVyIFZpZXcgaGFzIGJlZW4gY3JlYXRlZCwgb3Igd2hlbiBhIHByZXZpb3VzbHlcbiAgICogZGVoeWRyYXRlZCBSZW5kZXIgVmlldyBpcyBhYm91dCB0byBiZSByZXVzZWQuXG4gICAqL1xuICBhYnN0cmFjdCBoeWRyYXRlVmlldyh2aWV3UmVmOiBSZW5kZXJWaWV3UmVmKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgYSBjdXN0b20gUmVuZGVyZXIgdGhhdCBhIFJlbmRlciBWaWV3IGlzIG5vIGxvbmdlciBhY3RpdmUuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBieSBBbmd1bGFyIGJlZm9yZSBhIFJlbmRlciBWaWV3IHdpbGwgYmUgZGVzdHJveWVkLCBvciB3aGVuIGEgaHlkcmF0ZWRcbiAgICogUmVuZGVyIFZpZXcgaXMgYWJvdXQgdG8gYmUgcHV0IGludG8gYSBwb29sIGZvciBmdXR1cmUgcmV1c2UuXG4gICAqL1xuICBhYnN0cmFjdCBkZWh5ZHJhdGVWaWV3KHZpZXdSZWY6IFJlbmRlclZpZXdSZWYpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB1bmRlcmx5aW5nIG5hdGl2ZSBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgYGxvY2F0aW9uYCwgb3IgYG51bGxgIGlmIGRpcmVjdCBhY2Nlc3NcbiAgICogdG8gbmF0aXZlIGVsZW1lbnRzIGlzIG5vdCBzdXBwb3J0ZWQgKGUuZy4gd2hlbiB0aGUgYXBwbGljYXRpb24gcnVucyBpbiBhIHdlYiB3b3JrZXIpLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiY2FsbG91dCBpcy1jcml0aWNhbFwiPlxuICAgKiAgIDxoZWFkZXI+VXNlIHdpdGggY2F1dGlvbjwvaGVhZGVyPlxuICAgKiAgIDxwPlxuICAgKiAgICBVc2UgdGhpcyBhcGkgYXMgdGhlIGxhc3QgcmVzb3J0IHdoZW4gZGlyZWN0IGFjY2VzcyB0byBET00gaXMgbmVlZGVkLiBVc2UgdGVtcGxhdGluZyBhbmRcbiAgICogICAgZGF0YS1iaW5kaW5nLCBvciBvdGhlciB7QGxpbmsgUmVuZGVyZXJ9IG1ldGhvZHMgaW5zdGVhZC5cbiAgICogICA8L3A+XG4gICAqICAgPHA+XG4gICAqICAgIFJlbHlpbmcgb24gZGlyZWN0IERPTSBhY2Nlc3MgY3JlYXRlcyB0aWdodCBjb3VwbGluZyBiZXR3ZWVuIHlvdXIgYXBwbGljYXRpb24gYW5kIHJlbmRlcmluZ1xuICAgKiAgICBsYXllcnMgd2hpY2ggd2lsbCBtYWtlIGl0IGltcG9zc2libGUgdG8gc2VwYXJhdGUgdGhlIHR3byBhbmQgZGVwbG95IHlvdXIgYXBwbGljYXRpb24gaW50byBhXG4gICAqICAgIHdlYiB3b3JrZXIuXG4gICAqICAgPC9wPlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIGFic3RyYWN0IGdldE5hdGl2ZUVsZW1lbnRTeW5jKGxvY2F0aW9uOiBSZW5kZXJFbGVtZW50UmVmKTogYW55O1xuXG4gIC8qKlxuICAgKiBTZXRzIGEgcHJvcGVydHkgb24gdGhlIEVsZW1lbnQgc3BlY2lmaWVkIHZpYSBgbG9jYXRpb25gLlxuICAgKi9cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudFByb3BlcnR5KGxvY2F0aW9uOiBSZW5kZXJFbGVtZW50UmVmLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogYW55KTtcblxuICAvKipcbiAgICogU2V0cyBhbiBhdHRyaWJ1dGUgb24gdGhlIEVsZW1lbnQgc3BlY2lmaWVkIHZpYSBgbG9jYXRpb25gLlxuICAgKlxuICAgKiBJZiBgYXR0cmlidXRlVmFsdWVgIGlzIGBudWxsYCwgdGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkLlxuICAgKi9cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudEF0dHJpYnV0ZShsb2NhdGlvbjogUmVuZGVyRWxlbWVudFJlZiwgYXR0cmlidXRlTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlOiBzdHJpbmcpO1xuXG4gIGFic3RyYWN0IHNldEJpbmRpbmdEZWJ1Z0luZm8obG9jYXRpb246IFJlbmRlckVsZW1lbnRSZWYsIHByb3BlcnR5TmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWU6IHN0cmluZyk7XG5cbiAgLyoqXG4gICAqIFNldHMgYSAoQ1NTKSBjbGFzcyBvbiB0aGUgRWxlbWVudCBzcGVjaWZpZWQgdmlhIGBsb2NhdGlvbmAuXG4gICAqXG4gICAqIGBpc0FkZGAgc3BlY2lmaWVzIGlmIHRoZSBjbGFzcyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAgICovXG4gIGFic3RyYWN0IHNldEVsZW1lbnRDbGFzcyhsb2NhdGlvbjogUmVuZGVyRWxlbWVudFJlZiwgY2xhc3NOYW1lOiBzdHJpbmcsIGlzQWRkOiBib29sZWFuKTtcblxuICAvKipcbiAgICogU2V0cyBhIChDU1MpIGlubGluZSBzdHlsZSBvbiB0aGUgRWxlbWVudCBzcGVjaWZpZWQgdmlhIGBsb2NhdGlvbmAuXG4gICAqXG4gICAqIElmIGBzdHlsZVZhbHVlYCBpcyBgbnVsbGAsIHRoZSBzdHlsZSBpcyByZW1vdmVkLlxuICAgKi9cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudFN0eWxlKGxvY2F0aW9uOiBSZW5kZXJFbGVtZW50UmVmLCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZTogc3RyaW5nKTtcblxuICAvKipcbiAgICogQ2FsbHMgYSBtZXRob2Qgb24gdGhlIEVsZW1lbnQgc3BlY2lmaWVkIHZpYSBgbG9jYXRpb25gLlxuICAgKi9cbiAgYWJzdHJhY3QgaW52b2tlRWxlbWVudE1ldGhvZChsb2NhdGlvbjogUmVuZGVyRWxlbWVudFJlZiwgbWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIGFuIGludGVycG9sYXRlZCBUZXh0Tm9kZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IHRvIHRoZSBgdGV4dGAgdmFsdWUuXG4gICAqXG4gICAqIGB0ZXh0Tm9kZUluZGV4YCBpcyB0aGUgZGVwdGgtZmlyc3QgaW5kZXggb2YgdGhlIE5vZGUgYW1vbmcgaW50ZXJwb2xhdGVkIE5vZGVzIGluIHRoZSBSZW5kZXJcbiAgICogVmlldy5cbiAgICovXG4gIGFic3RyYWN0IHNldFRleHQodmlld1JlZjogUmVuZGVyVmlld1JlZiwgdGV4dE5vZGVJbmRleDogbnVtYmVyLCB0ZXh0OiBzdHJpbmcpO1xuXG4gIC8qKlxuICAgKiBTZXRzIGEgZGlzcGF0Y2hlciB0byByZWxheSBhbGwgZXZlbnRzIHRyaWdnZXJlZCBpbiB0aGUgZ2l2ZW4gUmVuZGVyIFZpZXcuXG4gICAqXG4gICAqIEVhY2ggUmVuZGVyIFZpZXcgY2FuIGhhdmUgb25seSBvbmUgRXZlbnQgRGlzcGF0Y2hlciwgaWYgdGhpcyBtZXRob2QgaXMgY2FsbGVkIG11bHRpcGxlIHRpbWVzLFxuICAgKiB0aGUgbGFzdCBwcm92aWRlZCBkaXNwYXRjaGVyIHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIGFic3RyYWN0IHNldEV2ZW50RGlzcGF0Y2hlcih2aWV3UmVmOiBSZW5kZXJWaWV3UmVmLCBkaXNwYXRjaGVyOiBSZW5kZXJFdmVudERpc3BhdGNoZXIpO1xufVxuXG4vKipcbiAqIEEgZGlzcGF0Y2hlciB0aGF0IHJlbGF5cyBhbGwgZXZlbnRzIHRoYXQgb2NjdXIgaW4gYSBSZW5kZXIgVmlldy5cbiAqXG4gKiBVc2Uge0BsaW5rIFJlbmRlcmVyI3NldEV2ZW50RGlzcGF0Y2hlcn0gdG8gcmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZvciBhIHBhcnRpY3VsYXIgUmVuZGVyIFZpZXcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyRXZlbnREaXNwYXRjaGVyIHtcbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIEV2ZW50IGNhbGxlZCBgZXZlbnROYW1lYCB3YXMgdHJpZ2dlcmVkIG9uIGFuIEVsZW1lbnQgd2l0aCBhbiBFdmVudCBCaW5kaW5nIGZvciB0aGlzXG4gICAqIEV2ZW50LlxuICAgKlxuICAgKiBgZWxlbWVudEluZGV4YCBzcGVjaWZpZXMgdGhlIGRlcHRoLWZpcnN0IGluZGV4IG9mIHRoZSBFbGVtZW50IGluIHRoZSBSZW5kZXIgVmlldy5cbiAgICpcbiAgICogYGxvY2Fsc2AgaXMgYSBtYXAgZm9yIGxvY2FsIHZhcmlhYmxlIHRvIHZhbHVlIG1hcHBpbmcgdGhhdCBzaG91bGQgYmUgdXNlZCB3aGVuIGV2YWx1YXRpbmcgdGhlXG4gICAqIEV2ZW50IEJpbmRpbmcgZXhwcmVzc2lvbi5cbiAgICpcbiAgICogUmV0dXJucyBgZmFsc2VgIGlmIGBwcmV2ZW50RGVmYXVsdGAgc2hvdWxkIGJlIGNhbGxlZCB0byBzdG9wIHRoZSBkZWZhdWx0IGJlaGF2aW9yIG9mIHRoZSBFdmVudFxuICAgKiBpbiB0aGUgUmVuZGVyaW5nIENvbnRleHQuXG4gICAqL1xuICBkaXNwYXRjaFJlbmRlckV2ZW50KGVsZW1lbnRJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgbG9jYWxzOiBNYXA8c3RyaW5nLCBhbnk+KTogYm9vbGVhbjtcbn1cbiJdfQ==