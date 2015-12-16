import { isPresent, isBlank, normalizeBool, serializeEnum, RegExpWrapper } from 'angular2/src/facade/lang';
import { StringMapWrapper } from 'angular2/src/facade/collection';
import { ChangeDetectionStrategy, CHANGE_DETECTION_STRATEGY_VALUES } from 'angular2/src/core/change_detection/change_detection';
import { ViewEncapsulation, VIEW_ENCAPSULATION_VALUES } from 'angular2/src/core/metadata/view';
import { CssSelector } from 'angular2/src/compiler/selector';
import { splitAtColon } from './util';
import { LIFECYCLE_HOOKS_VALUES } from 'angular2/src/core/linker/interfaces';
// group 1: "property" from "[property]"
// group 2: "event" from "(event)"
var HOST_REG_EXP = /^(?:(?:\[([^\]]+)\])|(?:\(([^\)]+)\)))$/g;
/**
 * Metadata regarding compilation of a type.
 */
export class CompileTypeMetadata {
    constructor({ runtime, name, moduleUrl, isHost } = {}) {
        this.runtime = runtime;
        this.name = name;
        this.moduleUrl = moduleUrl;
        this.isHost = normalizeBool(isHost);
    }
    static fromJson(data) {
        return new CompileTypeMetadata({ name: data['name'], moduleUrl: data['moduleUrl'], isHost: data['isHost'] });
    }
    toJson() {
        return {
            // Note: Runtime type can't be serialized...
            'name': this.name,
            'moduleUrl': this.moduleUrl,
            'isHost': this.isHost
        };
    }
}
/**
 * Metadata regarding compilation of a template.
 */
export class CompileTemplateMetadata {
    constructor({ encapsulation, template, templateUrl, styles, styleUrls, ngContentSelectors } = {}) {
        this.encapsulation = isPresent(encapsulation) ? encapsulation : ViewEncapsulation.Emulated;
        this.template = template;
        this.templateUrl = templateUrl;
        this.styles = isPresent(styles) ? styles : [];
        this.styleUrls = isPresent(styleUrls) ? styleUrls : [];
        this.ngContentSelectors = isPresent(ngContentSelectors) ? ngContentSelectors : [];
    }
    static fromJson(data) {
        return new CompileTemplateMetadata({
            encapsulation: isPresent(data['encapsulation']) ?
                VIEW_ENCAPSULATION_VALUES[data['encapsulation']] :
                data['encapsulation'],
            template: data['template'],
            templateUrl: data['templateUrl'],
            styles: data['styles'],
            styleUrls: data['styleUrls'],
            ngContentSelectors: data['ngContentSelectors']
        });
    }
    toJson() {
        return {
            'encapsulation': isPresent(this.encapsulation) ? serializeEnum(this.encapsulation) : this.encapsulation,
            'template': this.template,
            'templateUrl': this.templateUrl,
            'styles': this.styles,
            'styleUrls': this.styleUrls,
            'ngContentSelectors': this.ngContentSelectors
        };
    }
}
/**
 * Metadata regarding compilation of a directive.
 */
export class CompileDirectiveMetadata {
    constructor({ type, isComponent, dynamicLoadable, selector, exportAs, changeDetection, inputs, outputs, hostListeners, hostProperties, hostAttributes, lifecycleHooks, template } = {}) {
        this.type = type;
        this.isComponent = isComponent;
        this.dynamicLoadable = dynamicLoadable;
        this.selector = selector;
        this.exportAs = exportAs;
        this.changeDetection = changeDetection;
        this.inputs = inputs;
        this.outputs = outputs;
        this.hostListeners = hostListeners;
        this.hostProperties = hostProperties;
        this.hostAttributes = hostAttributes;
        this.lifecycleHooks = lifecycleHooks;
        this.template = template;
    }
    static create({ type, isComponent, dynamicLoadable, selector, exportAs, changeDetection, inputs, outputs, host, lifecycleHooks, template } = {}) {
        var hostListeners = {};
        var hostProperties = {};
        var hostAttributes = {};
        if (isPresent(host)) {
            StringMapWrapper.forEach(host, (value, key) => {
                var matches = RegExpWrapper.firstMatch(HOST_REG_EXP, key);
                if (isBlank(matches)) {
                    hostAttributes[key] = value;
                }
                else if (isPresent(matches[1])) {
                    hostProperties[matches[1]] = value;
                }
                else if (isPresent(matches[2])) {
                    hostListeners[matches[2]] = value;
                }
            });
        }
        var inputsMap = {};
        if (isPresent(inputs)) {
            inputs.forEach((bindConfig) => {
                // canonical syntax: `dirProp: elProp`
                // if there is no `:`, use dirProp = elProp
                var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
                inputsMap[parts[0]] = parts[1];
            });
        }
        var outputsMap = {};
        if (isPresent(outputs)) {
            outputs.forEach((bindConfig) => {
                // canonical syntax: `dirProp: elProp`
                // if there is no `:`, use dirProp = elProp
                var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
                outputsMap[parts[0]] = parts[1];
            });
        }
        return new CompileDirectiveMetadata({
            type: type,
            isComponent: normalizeBool(isComponent),
            dynamicLoadable: normalizeBool(dynamicLoadable),
            selector: selector,
            exportAs: exportAs,
            changeDetection: changeDetection,
            inputs: inputsMap,
            outputs: outputsMap,
            hostListeners: hostListeners,
            hostProperties: hostProperties,
            hostAttributes: hostAttributes,
            lifecycleHooks: isPresent(lifecycleHooks) ? lifecycleHooks : [],
            template: template
        });
    }
    static fromJson(data) {
        return new CompileDirectiveMetadata({
            isComponent: data['isComponent'],
            dynamicLoadable: data['dynamicLoadable'],
            selector: data['selector'],
            exportAs: data['exportAs'],
            type: isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
            changeDetection: isPresent(data['changeDetection']) ?
                CHANGE_DETECTION_STRATEGY_VALUES[data['changeDetection']] :
                data['changeDetection'],
            inputs: data['inputs'],
            outputs: data['outputs'],
            hostListeners: data['hostListeners'],
            hostProperties: data['hostProperties'],
            hostAttributes: data['hostAttributes'],
            lifecycleHooks: data['lifecycleHooks'].map(hookValue => LIFECYCLE_HOOKS_VALUES[hookValue]),
            template: isPresent(data['template']) ? CompileTemplateMetadata.fromJson(data['template']) :
                data['template']
        });
    }
    toJson() {
        return {
            'isComponent': this.isComponent,
            'dynamicLoadable': this.dynamicLoadable,
            'selector': this.selector,
            'exportAs': this.exportAs,
            'type': isPresent(this.type) ? this.type.toJson() : this.type,
            'changeDetection': isPresent(this.changeDetection) ? serializeEnum(this.changeDetection) :
                this.changeDetection,
            'inputs': this.inputs,
            'outputs': this.outputs,
            'hostListeners': this.hostListeners,
            'hostProperties': this.hostProperties,
            'hostAttributes': this.hostAttributes,
            'lifecycleHooks': this.lifecycleHooks.map(hook => serializeEnum(hook)),
            'template': isPresent(this.template) ? this.template.toJson() : this.template
        };
    }
}
/**
 * Construct {@link CompileDirectiveMetadata} from {@link ComponentTypeMetadata} and a selector.
 */
export function createHostComponentMeta(componentType, componentSelector) {
    var template = CssSelector.parse(componentSelector)[0].getMatchingElementTemplate();
    return CompileDirectiveMetadata.create({
        type: new CompileTypeMetadata({
            runtime: Object,
            name: `Host${componentType.name}`,
            moduleUrl: componentType.moduleUrl,
            isHost: true
        }),
        template: new CompileTemplateMetadata({ template: template, templateUrl: '', styles: [], styleUrls: [], ngContentSelectors: [] }),
        changeDetection: ChangeDetectionStrategy.Default,
        inputs: [],
        outputs: [],
        host: {},
        lifecycleHooks: [],
        isComponent: true,
        dynamicLoadable: false,
        selector: '*'
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aXZlX21ldGFkYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL2NvbXBpbGVyL2RpcmVjdGl2ZV9tZXRhZGF0YS50cyJdLCJuYW1lcyI6WyJDb21waWxlVHlwZU1ldGFkYXRhIiwiQ29tcGlsZVR5cGVNZXRhZGF0YS5jb25zdHJ1Y3RvciIsIkNvbXBpbGVUeXBlTWV0YWRhdGEuZnJvbUpzb24iLCJDb21waWxlVHlwZU1ldGFkYXRhLnRvSnNvbiIsIkNvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhIiwiQ29tcGlsZVRlbXBsYXRlTWV0YWRhdGEuY29uc3RydWN0b3IiLCJDb21waWxlVGVtcGxhdGVNZXRhZGF0YS5mcm9tSnNvbiIsIkNvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhLnRvSnNvbiIsIkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSIsIkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YS5jb25zdHJ1Y3RvciIsIkNvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YS5jcmVhdGUiLCJDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEuZnJvbUpzb24iLCJDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEudG9Kc29uIiwiY3JlYXRlSG9zdENvbXBvbmVudE1ldGEiXSwibWFwcGluZ3MiOiJPQUFPLEVBQ0wsU0FBUyxFQUNULE9BQU8sRUFDUCxhQUFhLEVBQ2IsYUFBYSxFQUViLGFBQWEsRUFFZCxNQUFNLDBCQUEwQjtPQUMxQixFQUFDLGdCQUFnQixFQUFDLE1BQU0sZ0NBQWdDO09BQ3hELEVBQ0wsdUJBQXVCLEVBQ3ZCLGdDQUFnQyxFQUNqQyxNQUFNLHFEQUFxRDtPQUNyRCxFQUFDLGlCQUFpQixFQUFFLHlCQUF5QixFQUFDLE1BQU0saUNBQWlDO09BQ3JGLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0NBQWdDO09BQ25ELEVBQUMsWUFBWSxFQUFDLE1BQU0sUUFBUTtPQUM1QixFQUFpQixzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQztBQUUxRix3Q0FBd0M7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QkFBaUJBLENBQUNBO1lBQ3hDQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQTtZQUMxQkEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7WUFDMUJBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLG1CQUFtQkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDekZBLGVBQWVBLEVBQUVBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0E7Z0JBQzlCQSxnQ0FBZ0NBLENBQUNBLElBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pEQSxJQUFJQSxDQUFDQSxpQkFBaUJBLENBQUNBO1lBQzVDQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUN0QkEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7WUFDeEJBLGFBQWFBLEVBQUVBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBO1lBQ3BDQSxjQUFjQSxFQUFFQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBO1lBQ3RDQSxjQUFjQSxFQUFFQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBO1lBQ3RDQSxjQUFjQSxFQUNGQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUVBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLElBQUlBLHNCQUFzQkEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDdkZBLFFBQVFBLEVBQUVBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLEdBQUdBLHVCQUF1QkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xEQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQTtTQUN6REEsQ0FBQ0EsQ0FBQ0E7SUFDTEEsQ0FBQ0E7SUFFREgsTUFBTUE7UUFDSkksTUFBTUEsQ0FBQ0E7WUFDTEEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsV0FBV0E7WUFDL0JBLGlCQUFpQkEsRUFBRUEsSUFBSUEsQ0FBQ0EsZUFBZUE7WUFDdkNBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBO1lBQ3pCQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxRQUFRQTtZQUN6QkEsTUFBTUEsRUFBRUEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUE7WUFDN0RBLGlCQUFpQkEsRUFBRUEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsR0FBR0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0E7Z0JBQ25DQSxJQUFJQSxDQUFDQSxlQUFlQTtZQUN6RUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsTUFBTUE7WUFDckJBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLE9BQU9BO1lBQ3ZCQSxlQUFlQSxFQUFFQSxJQUFJQSxDQUFDQSxhQUFhQTtZQUNuQ0EsZ0JBQWdCQSxFQUFFQSxJQUFJQSxDQUFDQSxjQUFjQTtZQUNyQ0EsZ0JBQWdCQSxFQUFFQSxJQUFJQSxDQUFDQSxjQUFjQTtZQUNyQ0EsZ0JBQWdCQSxFQUFFQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxhQUFhQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUN0RUEsVUFBVUEsRUFBRUEsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUE7U0FDOUVBLENBQUNBO0lBQ0pBLENBQUNBO0FBQ0hKLENBQUNBO0FBRUQ7O0dBRUc7QUFDSCx3Q0FBd0MsYUFBa0MsRUFDbEMsaUJBQXlCO0lBQy9ESyxJQUFJQSxRQUFRQSxHQUFHQSxXQUFXQSxDQUFDQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLDBCQUEwQkEsRUFBRUEsQ0FBQ0E7SUFDcEZBLE1BQU1BLENBQUNBLHdCQUF3QkEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFDckNBLElBQUlBLEVBQUVBLElBQUlBLG1CQUFtQkEsQ0FBQ0E7WUFDNUJBLE9BQU9BLEVBQUVBLE1BQU1BO1lBQ2ZBLElBQUlBLEVBQUVBLE9BQU9BLGFBQWFBLENBQUNBLElBQUlBLEVBQUVBO1lBQ2pDQSxTQUFTQSxFQUFFQSxhQUFhQSxDQUFDQSxTQUFTQTtZQUNsQ0EsTUFBTUEsRUFBRUEsSUFBSUE7U0FDYkEsQ0FBQ0E7UUFDRkEsUUFBUUEsRUFBRUEsSUFBSUEsdUJBQXVCQSxDQUNqQ0EsRUFBQ0EsUUFBUUEsRUFBRUEsUUFBUUEsRUFBRUEsV0FBV0EsRUFBRUEsRUFBRUEsRUFBRUEsTUFBTUEsRUFBRUEsRUFBRUEsRUFBRUEsU0FBU0EsRUFBRUEsRUFBRUEsRUFBRUEsa0JBQWtCQSxFQUFFQSxFQUFFQSxFQUFDQSxDQUFDQTtRQUM3RkEsZUFBZUEsRUFBRUEsdUJBQXVCQSxDQUFDQSxPQUFPQTtRQUNoREEsTUFBTUEsRUFBRUEsRUFBRUE7UUFDVkEsT0FBT0EsRUFBRUEsRUFBRUE7UUFDWEEsSUFBSUEsRUFBRUEsRUFBRUE7UUFDUkEsY0FBY0EsRUFBRUEsRUFBRUE7UUFDbEJBLFdBQVdBLEVBQUVBLElBQUlBO1FBQ2pCQSxlQUFlQSxFQUFFQSxLQUFLQTtRQUN0QkEsUUFBUUEsRUFBRUEsR0FBR0E7S0FDZEEsQ0FBQ0EsQ0FBQ0E7QUFDTEEsQ0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBpc1ByZXNlbnQsXG4gIGlzQmxhbmssXG4gIG5vcm1hbGl6ZUJvb2wsXG4gIHNlcmlhbGl6ZUVudW0sXG4gIFR5cGUsXG4gIFJlZ0V4cFdyYXBwZXIsXG4gIFN0cmluZ1dyYXBwZXJcbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7U3RyaW5nTWFwV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9jb2xsZWN0aW9uJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDSEFOR0VfREVURUNUSU9OX1NUUkFURUdZX1ZBTFVFU1xufSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbiwgVklFV19FTkNBUFNVTEFUSU9OX1ZBTFVFU30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yfSBmcm9tICdhbmd1bGFyMi9zcmMvY29tcGlsZXIvc2VsZWN0b3InO1xuaW1wb3J0IHtzcGxpdEF0Q29sb259IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzLCBMSUZFQ1lDTEVfSE9PS1NfVkFMVUVTfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvaW50ZXJmYWNlcyc7XG5cbi8vIGdyb3VwIDE6IFwicHJvcGVydHlcIiBmcm9tIFwiW3Byb3BlcnR5XVwiXG4vLyBncm91cCAyOiBcImV2ZW50XCIgZnJvbSBcIihldmVudClcIlxudmFyIEhPU1RfUkVHX0VYUCA9IC9eKD86KD86XFxbKFteXFxdXSspXFxdKXwoPzpcXCgoW15cXCldKylcXCkpKSQvZztcblxuLyoqXG4gKiBNZXRhZGF0YSByZWdhcmRpbmcgY29tcGlsYXRpb24gb2YgYSB0eXBlLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcGlsZVR5cGVNZXRhZGF0YSB7XG4gIHJ1bnRpbWU6IFR5cGU7XG4gIG5hbWU6IHN0cmluZztcbiAgbW9kdWxlVXJsOiBzdHJpbmc7XG4gIGlzSG9zdDogYm9vbGVhbjtcbiAgY29uc3RydWN0b3Ioe3J1bnRpbWUsIG5hbWUsIG1vZHVsZVVybCwgaXNIb3N0fTpcbiAgICAgICAgICAgICAgICAgIHtydW50aW1lPzogVHlwZSwgbmFtZT86IHN0cmluZywgbW9kdWxlVXJsPzogc3RyaW5nLCBpc0hvc3Q/OiBib29sZWFufSA9IHt9KSB7XG4gICAgdGhpcy5ydW50aW1lID0gcnVudGltZTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMubW9kdWxlVXJsID0gbW9kdWxlVXJsO1xuICAgIHRoaXMuaXNIb3N0ID0gbm9ybWFsaXplQm9vbChpc0hvc3QpO1xuICB9XG5cbiAgc3RhdGljIGZyb21Kc29uKGRhdGE6IHtba2V5OiBzdHJpbmddOiBhbnl9KTogQ29tcGlsZVR5cGVNZXRhZGF0YSB7XG4gICAgcmV0dXJuIG5ldyBDb21waWxlVHlwZU1ldGFkYXRhKFxuICAgICAgICB7bmFtZTogZGF0YVsnbmFtZSddLCBtb2R1bGVVcmw6IGRhdGFbJ21vZHVsZVVybCddLCBpc0hvc3Q6IGRhdGFbJ2lzSG9zdCddfSk7XG4gIH1cblxuICB0b0pzb24oKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBOb3RlOiBSdW50aW1lIHR5cGUgY2FuJ3QgYmUgc2VyaWFsaXplZC4uLlxuICAgICAgJ25hbWUnOiB0aGlzLm5hbWUsXG4gICAgICAnbW9kdWxlVXJsJzogdGhpcy5tb2R1bGVVcmwsXG4gICAgICAnaXNIb3N0JzogdGhpcy5pc0hvc3RcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogTWV0YWRhdGEgcmVnYXJkaW5nIGNvbXBpbGF0aW9uIG9mIGEgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21waWxlVGVtcGxhdGVNZXRhZGF0YSB7XG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uO1xuICB0ZW1wbGF0ZTogc3RyaW5nO1xuICB0ZW1wbGF0ZVVybDogc3RyaW5nO1xuICBzdHlsZXM6IHN0cmluZ1tdO1xuICBzdHlsZVVybHM6IHN0cmluZ1tdO1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBjb25zdHJ1Y3Rvcih7ZW5jYXBzdWxhdGlvbiwgdGVtcGxhdGUsIHRlbXBsYXRlVXJsLCBzdHlsZXMsIHN0eWxlVXJscywgbmdDb250ZW50U2VsZWN0b3JzfToge1xuICAgIGVuY2Fwc3VsYXRpb24/OiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICB0ZW1wbGF0ZT86IHN0cmluZyxcbiAgICB0ZW1wbGF0ZVVybD86IHN0cmluZyxcbiAgICBzdHlsZXM/OiBzdHJpbmdbXSxcbiAgICBzdHlsZVVybHM/OiBzdHJpbmdbXSxcbiAgICBuZ0NvbnRlbnRTZWxlY3RvcnM/OiBzdHJpbmdbXVxuICB9ID0ge30pIHtcbiAgICB0aGlzLmVuY2Fwc3VsYXRpb24gPSBpc1ByZXNlbnQoZW5jYXBzdWxhdGlvbikgPyBlbmNhcHN1bGF0aW9uIDogVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQ7XG4gICAgdGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIHRoaXMudGVtcGxhdGVVcmwgPSB0ZW1wbGF0ZVVybDtcbiAgICB0aGlzLnN0eWxlcyA9IGlzUHJlc2VudChzdHlsZXMpID8gc3R5bGVzIDogW107XG4gICAgdGhpcy5zdHlsZVVybHMgPSBpc1ByZXNlbnQoc3R5bGVVcmxzKSA/IHN0eWxlVXJscyA6IFtdO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gaXNQcmVzZW50KG5nQ29udGVudFNlbGVjdG9ycykgPyBuZ0NvbnRlbnRTZWxlY3RvcnMgOiBbXTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tSnNvbihkYXRhOiB7W2tleTogc3RyaW5nXTogYW55fSk6IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhIHtcbiAgICByZXR1cm4gbmV3IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhKHtcbiAgICAgIGVuY2Fwc3VsYXRpb246IGlzUHJlc2VudChkYXRhWydlbmNhcHN1bGF0aW9uJ10pID9cbiAgICAgICAgICAgICAgICAgICAgICAgICBWSUVXX0VOQ0FQU1VMQVRJT05fVkFMVUVTW2RhdGFbJ2VuY2Fwc3VsYXRpb24nXV0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbJ2VuY2Fwc3VsYXRpb24nXSxcbiAgICAgIHRlbXBsYXRlOiBkYXRhWyd0ZW1wbGF0ZSddLFxuICAgICAgdGVtcGxhdGVVcmw6IGRhdGFbJ3RlbXBsYXRlVXJsJ10sXG4gICAgICBzdHlsZXM6IGRhdGFbJ3N0eWxlcyddLFxuICAgICAgc3R5bGVVcmxzOiBkYXRhWydzdHlsZVVybHMnXSxcbiAgICAgIG5nQ29udGVudFNlbGVjdG9yczogZGF0YVsnbmdDb250ZW50U2VsZWN0b3JzJ11cbiAgICB9KTtcbiAgfVxuXG4gIHRvSnNvbigpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdlbmNhcHN1bGF0aW9uJzpcbiAgICAgICAgICBpc1ByZXNlbnQodGhpcy5lbmNhcHN1bGF0aW9uKSA/IHNlcmlhbGl6ZUVudW0odGhpcy5lbmNhcHN1bGF0aW9uKSA6IHRoaXMuZW5jYXBzdWxhdGlvbixcbiAgICAgICd0ZW1wbGF0ZSc6IHRoaXMudGVtcGxhdGUsXG4gICAgICAndGVtcGxhdGVVcmwnOiB0aGlzLnRlbXBsYXRlVXJsLFxuICAgICAgJ3N0eWxlcyc6IHRoaXMuc3R5bGVzLFxuICAgICAgJ3N0eWxlVXJscyc6IHRoaXMuc3R5bGVVcmxzLFxuICAgICAgJ25nQ29udGVudFNlbGVjdG9ycyc6IHRoaXMubmdDb250ZW50U2VsZWN0b3JzXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIE1ldGFkYXRhIHJlZ2FyZGluZyBjb21waWxhdGlvbiBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSB7XG4gIHN0YXRpYyBjcmVhdGUoe3R5cGUsIGlzQ29tcG9uZW50LCBkeW5hbWljTG9hZGFibGUsIHNlbGVjdG9yLCBleHBvcnRBcywgY2hhbmdlRGV0ZWN0aW9uLCBpbnB1dHMsXG4gICAgICAgICAgICAgICAgIG91dHB1dHMsIGhvc3QsIGxpZmVjeWNsZUhvb2tzLCB0ZW1wbGF0ZX06IHtcbiAgICB0eXBlPzogQ29tcGlsZVR5cGVNZXRhZGF0YSxcbiAgICBpc0NvbXBvbmVudD86IGJvb2xlYW4sXG4gICAgZHluYW1pY0xvYWRhYmxlPzogYm9vbGVhbixcbiAgICBzZWxlY3Rvcj86IHN0cmluZyxcbiAgICBleHBvcnRBcz86IHN0cmluZyxcbiAgICBjaGFuZ2VEZXRlY3Rpb24/OiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgICBpbnB1dHM/OiBzdHJpbmdbXSxcbiAgICBvdXRwdXRzPzogc3RyaW5nW10sXG4gICAgaG9zdD86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIGxpZmVjeWNsZUhvb2tzPzogTGlmZWN5Y2xlSG9va3NbXSxcbiAgICB0ZW1wbGF0ZT86IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhXG4gIH0gPSB7fSk6IENvbXBpbGVEaXJlY3RpdmVNZXRhZGF0YSB7XG4gICAgdmFyIGhvc3RMaXN0ZW5lcnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgdmFyIGhvc3RQcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgIHZhciBob3N0QXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICBpZiAoaXNQcmVzZW50KGhvc3QpKSB7XG4gICAgICBTdHJpbmdNYXBXcmFwcGVyLmZvckVhY2goaG9zdCwgKHZhbHVlOiBzdHJpbmcsIGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHZhciBtYXRjaGVzID0gUmVnRXhwV3JhcHBlci5maXJzdE1hdGNoKEhPU1RfUkVHX0VYUCwga2V5KTtcbiAgICAgICAgaWYgKGlzQmxhbmsobWF0Y2hlcykpIHtcbiAgICAgICAgICBob3N0QXR0cmlidXRlc1trZXldID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNQcmVzZW50KG1hdGNoZXNbMV0pKSB7XG4gICAgICAgICAgaG9zdFByb3BlcnRpZXNbbWF0Y2hlc1sxXV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1ByZXNlbnQobWF0Y2hlc1syXSkpIHtcbiAgICAgICAgICBob3N0TGlzdGVuZXJzW21hdGNoZXNbMl1dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgaW5wdXRzTWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgIGlmIChpc1ByZXNlbnQoaW5wdXRzKSkge1xuICAgICAgaW5wdXRzLmZvckVhY2goKGJpbmRDb25maWc6IHN0cmluZykgPT4ge1xuICAgICAgICAvLyBjYW5vbmljYWwgc3ludGF4OiBgZGlyUHJvcDogZWxQcm9wYFxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBgOmAsIHVzZSBkaXJQcm9wID0gZWxQcm9wXG4gICAgICAgIHZhciBwYXJ0cyA9IHNwbGl0QXRDb2xvbihiaW5kQ29uZmlnLCBbYmluZENvbmZpZywgYmluZENvbmZpZ10pO1xuICAgICAgICBpbnB1dHNNYXBbcGFydHNbMF1dID0gcGFydHNbMV07XG4gICAgICB9KTtcbiAgICB9XG4gICAgdmFyIG91dHB1dHNNYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgaWYgKGlzUHJlc2VudChvdXRwdXRzKSkge1xuICAgICAgb3V0cHV0cy5mb3JFYWNoKChiaW5kQ29uZmlnOiBzdHJpbmcpID0+IHtcbiAgICAgICAgLy8gY2Fub25pY2FsIHN5bnRheDogYGRpclByb3A6IGVsUHJvcGBcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gYDpgLCB1c2UgZGlyUHJvcCA9IGVsUHJvcFxuICAgICAgICB2YXIgcGFydHMgPSBzcGxpdEF0Q29sb24oYmluZENvbmZpZywgW2JpbmRDb25maWcsIGJpbmRDb25maWddKTtcbiAgICAgICAgb3V0cHV0c01hcFtwYXJ0c1swXV0gPSBwYXJ0c1sxXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBpc0NvbXBvbmVudDogbm9ybWFsaXplQm9vbChpc0NvbXBvbmVudCksXG4gICAgICBkeW5hbWljTG9hZGFibGU6IG5vcm1hbGl6ZUJvb2woZHluYW1pY0xvYWRhYmxlKSxcbiAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgIGV4cG9ydEFzOiBleHBvcnRBcyxcbiAgICAgIGNoYW5nZURldGVjdGlvbjogY2hhbmdlRGV0ZWN0aW9uLFxuICAgICAgaW5wdXRzOiBpbnB1dHNNYXAsXG4gICAgICBvdXRwdXRzOiBvdXRwdXRzTWFwLFxuICAgICAgaG9zdExpc3RlbmVyczogaG9zdExpc3RlbmVycyxcbiAgICAgIGhvc3RQcm9wZXJ0aWVzOiBob3N0UHJvcGVydGllcyxcbiAgICAgIGhvc3RBdHRyaWJ1dGVzOiBob3N0QXR0cmlidXRlcyxcbiAgICAgIGxpZmVjeWNsZUhvb2tzOiBpc1ByZXNlbnQobGlmZWN5Y2xlSG9va3MpID8gbGlmZWN5Y2xlSG9va3MgOiBbXSxcbiAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZVxuICAgIH0pO1xuICB9XG5cbiAgdHlwZTogQ29tcGlsZVR5cGVNZXRhZGF0YTtcbiAgaXNDb21wb25lbnQ6IGJvb2xlYW47XG4gIGR5bmFtaWNMb2FkYWJsZTogYm9vbGVhbjtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgZXhwb3J0QXM6IHN0cmluZztcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneTtcbiAgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcbiAgb3V0cHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ307XG4gIGhvc3RMaXN0ZW5lcnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xuICBob3N0UHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ307XG4gIGhvc3RBdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcbiAgbGlmZWN5Y2xlSG9va3M6IExpZmVjeWNsZUhvb2tzW107XG4gIHRlbXBsYXRlOiBDb21waWxlVGVtcGxhdGVNZXRhZGF0YTtcbiAgY29uc3RydWN0b3Ioe3R5cGUsIGlzQ29tcG9uZW50LCBkeW5hbWljTG9hZGFibGUsIHNlbGVjdG9yLCBleHBvcnRBcywgY2hhbmdlRGV0ZWN0aW9uLCBpbnB1dHMsXG4gICAgICAgICAgICAgICBvdXRwdXRzLCBob3N0TGlzdGVuZXJzLCBob3N0UHJvcGVydGllcywgaG9zdEF0dHJpYnV0ZXMsIGxpZmVjeWNsZUhvb2tzLCB0ZW1wbGF0ZX06IHtcbiAgICB0eXBlPzogQ29tcGlsZVR5cGVNZXRhZGF0YSxcbiAgICBpc0NvbXBvbmVudD86IGJvb2xlYW4sXG4gICAgZHluYW1pY0xvYWRhYmxlPzogYm9vbGVhbixcbiAgICBzZWxlY3Rvcj86IHN0cmluZyxcbiAgICBleHBvcnRBcz86IHN0cmluZyxcbiAgICBjaGFuZ2VEZXRlY3Rpb24/OiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgICBpbnB1dHM/OiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBvdXRwdXRzPzoge1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgaG9zdExpc3RlbmVycz86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICAgIGhvc3RQcm9wZXJ0aWVzPzoge1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICAgaG9zdEF0dHJpYnV0ZXM/OiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICBsaWZlY3ljbGVIb29rcz86IExpZmVjeWNsZUhvb2tzW10sXG4gICAgdGVtcGxhdGU/OiBDb21waWxlVGVtcGxhdGVNZXRhZGF0YVxuICB9ID0ge30pIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudDtcbiAgICB0aGlzLmR5bmFtaWNMb2FkYWJsZSA9IGR5bmFtaWNMb2FkYWJsZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgdGhpcy5leHBvcnRBcyA9IGV4cG9ydEFzO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0aW9uID0gY2hhbmdlRGV0ZWN0aW9uO1xuICAgIHRoaXMuaW5wdXRzID0gaW5wdXRzO1xuICAgIHRoaXMub3V0cHV0cyA9IG91dHB1dHM7XG4gICAgdGhpcy5ob3N0TGlzdGVuZXJzID0gaG9zdExpc3RlbmVycztcbiAgICB0aGlzLmhvc3RQcm9wZXJ0aWVzID0gaG9zdFByb3BlcnRpZXM7XG4gICAgdGhpcy5ob3N0QXR0cmlidXRlcyA9IGhvc3RBdHRyaWJ1dGVzO1xuICAgIHRoaXMubGlmZWN5Y2xlSG9va3MgPSBsaWZlY3ljbGVIb29rcztcbiAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gIH1cblxuICBzdGF0aWMgZnJvbUpzb24oZGF0YToge1trZXk6IHN0cmluZ106IGFueX0pOiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEge1xuICAgIHJldHVybiBuZXcgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhKHtcbiAgICAgIGlzQ29tcG9uZW50OiBkYXRhWydpc0NvbXBvbmVudCddLFxuICAgICAgZHluYW1pY0xvYWRhYmxlOiBkYXRhWydkeW5hbWljTG9hZGFibGUnXSxcbiAgICAgIHNlbGVjdG9yOiBkYXRhWydzZWxlY3RvciddLFxuICAgICAgZXhwb3J0QXM6IGRhdGFbJ2V4cG9ydEFzJ10sXG4gICAgICB0eXBlOiBpc1ByZXNlbnQoZGF0YVsndHlwZSddKSA/IENvbXBpbGVUeXBlTWV0YWRhdGEuZnJvbUpzb24oZGF0YVsndHlwZSddKSA6IGRhdGFbJ3R5cGUnXSxcbiAgICAgIGNoYW5nZURldGVjdGlvbjogaXNQcmVzZW50KGRhdGFbJ2NoYW5nZURldGVjdGlvbiddKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBDSEFOR0VfREVURUNUSU9OX1NUUkFURUdZX1ZBTFVFU1tkYXRhWydjaGFuZ2VEZXRlY3Rpb24nXV0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVsnY2hhbmdlRGV0ZWN0aW9uJ10sXG4gICAgICBpbnB1dHM6IGRhdGFbJ2lucHV0cyddLFxuICAgICAgb3V0cHV0czogZGF0YVsnb3V0cHV0cyddLFxuICAgICAgaG9zdExpc3RlbmVyczogZGF0YVsnaG9zdExpc3RlbmVycyddLFxuICAgICAgaG9zdFByb3BlcnRpZXM6IGRhdGFbJ2hvc3RQcm9wZXJ0aWVzJ10sXG4gICAgICBob3N0QXR0cmlidXRlczogZGF0YVsnaG9zdEF0dHJpYnV0ZXMnXSxcbiAgICAgIGxpZmVjeWNsZUhvb2tzOlxuICAgICAgICAgICg8YW55W10+ZGF0YVsnbGlmZWN5Y2xlSG9va3MnXSkubWFwKGhvb2tWYWx1ZSA9PiBMSUZFQ1lDTEVfSE9PS1NfVkFMVUVTW2hvb2tWYWx1ZV0pLFxuICAgICAgdGVtcGxhdGU6IGlzUHJlc2VudChkYXRhWyd0ZW1wbGF0ZSddKSA/IENvbXBpbGVUZW1wbGF0ZU1ldGFkYXRhLmZyb21Kc29uKGRhdGFbJ3RlbXBsYXRlJ10pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhWyd0ZW1wbGF0ZSddXG4gICAgfSk7XG4gIH1cblxuICB0b0pzb24oKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIHJldHVybiB7XG4gICAgICAnaXNDb21wb25lbnQnOiB0aGlzLmlzQ29tcG9uZW50LFxuICAgICAgJ2R5bmFtaWNMb2FkYWJsZSc6IHRoaXMuZHluYW1pY0xvYWRhYmxlLFxuICAgICAgJ3NlbGVjdG9yJzogdGhpcy5zZWxlY3RvcixcbiAgICAgICdleHBvcnRBcyc6IHRoaXMuZXhwb3J0QXMsXG4gICAgICAndHlwZSc6IGlzUHJlc2VudCh0aGlzLnR5cGUpID8gdGhpcy50eXBlLnRvSnNvbigpIDogdGhpcy50eXBlLFxuICAgICAgJ2NoYW5nZURldGVjdGlvbic6IGlzUHJlc2VudCh0aGlzLmNoYW5nZURldGVjdGlvbikgPyBzZXJpYWxpemVFbnVtKHRoaXMuY2hhbmdlRGV0ZWN0aW9uKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0aW9uLFxuICAgICAgJ2lucHV0cyc6IHRoaXMuaW5wdXRzLFxuICAgICAgJ291dHB1dHMnOiB0aGlzLm91dHB1dHMsXG4gICAgICAnaG9zdExpc3RlbmVycyc6IHRoaXMuaG9zdExpc3RlbmVycyxcbiAgICAgICdob3N0UHJvcGVydGllcyc6IHRoaXMuaG9zdFByb3BlcnRpZXMsXG4gICAgICAnaG9zdEF0dHJpYnV0ZXMnOiB0aGlzLmhvc3RBdHRyaWJ1dGVzLFxuICAgICAgJ2xpZmVjeWNsZUhvb2tzJzogdGhpcy5saWZlY3ljbGVIb29rcy5tYXAoaG9vayA9PiBzZXJpYWxpemVFbnVtKGhvb2spKSxcbiAgICAgICd0ZW1wbGF0ZSc6IGlzUHJlc2VudCh0aGlzLnRlbXBsYXRlKSA/IHRoaXMudGVtcGxhdGUudG9Kc29uKCkgOiB0aGlzLnRlbXBsYXRlXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdCB7QGxpbmsgQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhfSBmcm9tIHtAbGluayBDb21wb25lbnRUeXBlTWV0YWRhdGF9IGFuZCBhIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSG9zdENvbXBvbmVudE1ldGEoY29tcG9uZW50VHlwZTogQ29tcGlsZVR5cGVNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRTZWxlY3Rvcjogc3RyaW5nKTogQ29tcGlsZURpcmVjdGl2ZU1ldGFkYXRhIHtcbiAgdmFyIHRlbXBsYXRlID0gQ3NzU2VsZWN0b3IucGFyc2UoY29tcG9uZW50U2VsZWN0b3IpWzBdLmdldE1hdGNoaW5nRWxlbWVudFRlbXBsYXRlKCk7XG4gIHJldHVybiBDb21waWxlRGlyZWN0aXZlTWV0YWRhdGEuY3JlYXRlKHtcbiAgICB0eXBlOiBuZXcgQ29tcGlsZVR5cGVNZXRhZGF0YSh7XG4gICAgICBydW50aW1lOiBPYmplY3QsXG4gICAgICBuYW1lOiBgSG9zdCR7Y29tcG9uZW50VHlwZS5uYW1lfWAsXG4gICAgICBtb2R1bGVVcmw6IGNvbXBvbmVudFR5cGUubW9kdWxlVXJsLFxuICAgICAgaXNIb3N0OiB0cnVlXG4gICAgfSksXG4gICAgdGVtcGxhdGU6IG5ldyBDb21waWxlVGVtcGxhdGVNZXRhZGF0YShcbiAgICAgICAge3RlbXBsYXRlOiB0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6ICcnLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdLCBuZ0NvbnRlbnRTZWxlY3RvcnM6IFtdfSksXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICAgIGlucHV0czogW10sXG4gICAgb3V0cHV0czogW10sXG4gICAgaG9zdDoge30sXG4gICAgbGlmZWN5Y2xlSG9va3M6IFtdLFxuICAgIGlzQ29tcG9uZW50OiB0cnVlLFxuICAgIGR5bmFtaWNMb2FkYWJsZTogZmFsc2UsXG4gICAgc2VsZWN0b3I6ICcqJ1xuICB9KTtcbn1cbiJdfQ==