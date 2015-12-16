import { global, isFunction, stringify } from 'angular2/src/facade/lang';
function extractAnnotation(annotation) {
    if (isFunction(annotation) && annotation.hasOwnProperty('annotation')) {
        // it is a decorator, extract annotation
        annotation = annotation.annotation;
    }
    return annotation;
}
function applyParams(fnOrArray, key) {
    if (fnOrArray === Object || fnOrArray === String || fnOrArray === Function ||
        fnOrArray === Number || fnOrArray === Array) {
        throw new Error(`Can not use native ${stringify(fnOrArray)} as constructor`);
    }
    if (isFunction(fnOrArray)) {
        return fnOrArray;
    }
    else if (fnOrArray instanceof Array) {
        var annotations = fnOrArray;
        var fn = fnOrArray[fnOrArray.length - 1];
        if (!isFunction(fn)) {
            throw new Error(`Last position of Class method array must be Function in key ${key} was '${stringify(fn)}'`);
        }
        var annoLength = annotations.length - 1;
        if (annoLength != fn.length) {
            throw new Error(`Number of annotations (${annoLength}) does not match number of arguments (${fn.length}) in the function: ${stringify(fn)}`);
        }
        var paramsAnnotations = [];
        for (var i = 0, ii = annotations.length - 1; i < ii; i++) {
            var paramAnnotations = [];
            paramsAnnotations.push(paramAnnotations);
            var annotation = annotations[i];
            if (annotation instanceof Array) {
                for (var j = 0; j < annotation.length; j++) {
                    paramAnnotations.push(extractAnnotation(annotation[j]));
                }
            }
            else if (isFunction(annotation)) {
                paramAnnotations.push(extractAnnotation(annotation));
            }
            else {
                paramAnnotations.push(annotation);
            }
        }
        Reflect.defineMetadata('parameters', paramsAnnotations, fn);
        return fn;
    }
    else {
        throw new Error(`Only Function or Array is supported in Class definition for key '${key}' is '${stringify(fnOrArray)}'`);
    }
}
/**
 * Provides a way for expressing ES6 classes with parameter annotations in ES5.
 *
 * ## Basic Example
 *
 * ```
 * var Greeter = ng.Class({
 *   constructor: function(name) {
 *     this.name = name;
 *   },
 *
 *   greet: function() {
 *     alert('Hello ' + this.name + '!');
 *   }
 * });
 * ```
 *
 * is equivalent to ES6:
 *
 * ```
 * class Greeter {
 *   constructor(name) {
 *     this.name = name;
 *   }
 *
 *   greet() {
 *     alert('Hello ' + this.name + '!');
 *   }
 * }
 * ```
 *
 * or equivalent to ES5:
 *
 * ```
 * var Greeter = function (name) {
 *   this.name = name;
 * }
 *
 * Greeter.prototype.greet = function () {
 *   alert('Hello ' + this.name + '!');
 * }
 * ```
 *
 * ### Example with parameter annotations
 *
 * ```
 * var MyService = ng.Class({
 *   constructor: [String, [new Query(), QueryList], function(name, queryList) {
 *     ...
 *   }]
 * });
 * ```
 *
 * is equivalent to ES6:
 *
 * ```
 * class MyService {
 *   constructor(name: string, @Query() queryList: QueryList) {
 *     ...
 *   }
 * }
 * ```
 *
 * ### Example with inheritance
 *
 * ```
 * var Shape = ng.Class({
 *   constructor: (color) {
 *     this.color = color;
 *   }
 * });
 *
 * var Square = ng.Class({
 *   extends: Shape,
 *   constructor: function(color, size) {
 *     Shape.call(this, color);
 *     this.size = size;
 *   }
 * });
 * ```
 */
export function Class(clsDef) {
    var constructor = applyParams(clsDef.hasOwnProperty('constructor') ? clsDef.constructor : undefined, 'constructor');
    var proto = constructor.prototype;
    if (clsDef.hasOwnProperty('extends')) {
        if (isFunction(clsDef.extends)) {
            constructor.prototype = proto =
                Object.create(clsDef.extends.prototype);
        }
        else {
            throw new Error(`Class definition 'extends' property must be a constructor function was: ${stringify(clsDef.extends)}`);
        }
    }
    for (var key in clsDef) {
        if (key != 'extends' && key != 'prototype' && clsDef.hasOwnProperty(key)) {
            proto[key] = applyParams(clsDef[key], key);
        }
    }
    if (this && this.annotations instanceof Array) {
        Reflect.defineMetadata('annotations', this.annotations, constructor);
    }
    return constructor;
}
var Reflect = global.Reflect;
if (!(Reflect && Reflect.getMetadata)) {
    throw 'reflect-metadata shim is required when using class decorators';
}
export function makeDecorator(annotationCls, chainFn = null) {
    function DecoratorFactory(objOrType) {
        var annotationInstance = new annotationCls(objOrType);
        if (this instanceof annotationCls) {
            return annotationInstance;
        }
        else {
            var chainAnnotation = isFunction(this) && this.annotations instanceof Array ? this.annotations : [];
            chainAnnotation.push(annotationInstance);
            var TypeDecorator = function TypeDecorator(cls) {
                var annotations = Reflect.getOwnMetadata('annotations', cls);
                annotations = annotations || [];
                annotations.push(annotationInstance);
                Reflect.defineMetadata('annotations', annotations, cls);
                return cls;
            };
            TypeDecorator.annotations = chainAnnotation;
            TypeDecorator.Class = Class;
            if (chainFn)
                chainFn(TypeDecorator);
            return TypeDecorator;
        }
    }
    DecoratorFactory.prototype = Object.create(annotationCls.prototype);
    return DecoratorFactory;
}
export function makeParamDecorator(annotationCls) {
    function ParamDecoratorFactory(...args) {
        var annotationInstance = Object.create(annotationCls.prototype);
        annotationCls.apply(annotationInstance, args);
        if (this instanceof annotationCls) {
            return annotationInstance;
        }
        else {
            ParamDecorator.annotation = annotationInstance;
            return ParamDecorator;
        }
        function ParamDecorator(cls, unusedKey, index) {
            var parameters = Reflect.getMetadata('parameters', cls);
            parameters = parameters || [];
            // there might be gaps if some in between parameters do not have annotations.
            // we pad with nulls.
            while (parameters.length <= index) {
                parameters.push(null);
            }
            parameters[index] = parameters[index] || [];
            var annotationsForParam = parameters[index];
            annotationsForParam.push(annotationInstance);
            Reflect.defineMetadata('parameters', parameters, cls);
            return cls;
        }
    }
    ParamDecoratorFactory.prototype = Object.create(annotationCls.prototype);
    return ParamDecoratorFactory;
}
export function makePropDecorator(decoratorCls) {
    function PropDecoratorFactory(...args) {
        var decoratorInstance = Object.create(decoratorCls.prototype);
        decoratorCls.apply(decoratorInstance, args);
        if (this instanceof decoratorCls) {
            return decoratorInstance;
        }
        else {
            return function PropDecorator(target, name) {
                var meta = Reflect.getOwnMetadata('propMetadata', target.constructor);
                meta = meta || {};
                meta[name] = meta[name] || [];
                meta[name].unshift(decoratorInstance);
                Reflect.defineMetadata('propMetadata', meta, target.constructor);
            };
        }
    }
    PropDecoratorFactory.prototype = Object.create(decoratorCls.prototype);
    return PropDecoratorFactory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFuZ3VsYXIyL3NyYy9jb3JlL3V0aWwvZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6WyJleHRyYWN0QW5ub3RhdGlvbiIsImFwcGx5UGFyYW1zIiwiQ2xhc3MiLCJtYWtlRGVjb3JhdG9yIiwibWFrZURlY29yYXRvci5EZWNvcmF0b3JGYWN0b3J5IiwibWFrZURlY29yYXRvci5EZWNvcmF0b3JGYWN0b3J5LlR5cGVEZWNvcmF0b3IiLCJtYWtlUGFyYW1EZWNvcmF0b3IiLCJtYWtlUGFyYW1EZWNvcmF0b3IuUGFyYW1EZWNvcmF0b3JGYWN0b3J5IiwibWFrZVBhcmFtRGVjb3JhdG9yLlBhcmFtRGVjb3JhdG9yRmFjdG9yeS5QYXJhbURlY29yYXRvciIsIm1ha2VQcm9wRGVjb3JhdG9yIiwibWFrZVByb3BEZWNvcmF0b3IuUHJvcERlY29yYXRvckZhY3RvcnkiLCJtYWtlUHJvcERlY29yYXRvci5Qcm9wRGVjb3JhdG9yRmFjdG9yeS5Qcm9wRGVjb3JhdG9yIl0sIm1hcHBpbmdzIjoiT0FBTyxFQUFlLE1BQU0sRUFBUSxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sMEJBQTBCO0FBNEUxRiwyQkFBMkIsVUFBZTtJQUN4Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsVUFBVUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdEVBLHdDQUF3Q0E7UUFDeENBLFVBQVVBLEdBQUdBLFVBQVVBLENBQUNBLFVBQVVBLENBQUNBO0lBQ3JDQSxDQUFDQTtJQUNEQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQTtBQUNwQkEsQ0FBQ0E7QUFFRCxxQkFBcUIsU0FBNkIsRUFBRSxHQUFXO0lBQzdEQyxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxLQUFLQSxNQUFNQSxJQUFJQSxTQUFTQSxLQUFLQSxNQUFNQSxJQUFJQSxTQUFTQSxLQUFLQSxRQUFRQTtRQUN0RUEsU0FBU0EsS0FBS0EsTUFBTUEsSUFBSUEsU0FBU0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaERBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLHNCQUFzQkEsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtJQUMvRUEsQ0FBQ0E7SUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQVdBLFNBQVNBLENBQUNBO0lBQzdCQSxDQUFDQTtJQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxZQUFZQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN0Q0EsSUFBSUEsV0FBV0EsR0FBVUEsU0FBU0EsQ0FBQ0E7UUFDbkNBLElBQUlBLEVBQUVBLEdBQWFBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1FBQ25EQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNwQkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FDWEEsK0RBQStEQSxHQUFHQSxTQUFTQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNuR0EsQ0FBQ0E7UUFDREEsSUFBSUEsVUFBVUEsR0FBR0EsV0FBV0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDeENBLEVBQUVBLENBQUNBLENBQUNBLFVBQVVBLElBQUlBLEVBQUVBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO1lBQzVCQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUNYQSwwQkFBMEJBLFVBQVVBLHlDQUF5Q0EsRUFBRUEsQ0FBQ0EsTUFBTUEsc0JBQXNCQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNuSUEsQ0FBQ0E7UUFDREEsSUFBSUEsaUJBQWlCQSxHQUFZQSxFQUFFQSxDQUFDQTtRQUNwQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsV0FBV0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDekRBLElBQUlBLGdCQUFnQkEsR0FBVUEsRUFBRUEsQ0FBQ0E7WUFDakNBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTtZQUN6Q0EsSUFBSUEsVUFBVUEsR0FBR0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLEVBQUVBLENBQUNBLENBQUNBLFVBQVVBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO2dCQUNoQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7b0JBQzNDQSxnQkFBZ0JBLENBQUNBLElBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFEQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbENBLGdCQUFnQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2REEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ05BLGdCQUFnQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDcENBLENBQUNBO1FBQ0hBLENBQUNBO1FBQ0RBLE9BQU9BLENBQUNBLGNBQWNBLENBQUNBLFlBQVlBLEVBQUVBLGlCQUFpQkEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDNURBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBO0lBQ1pBLENBQUNBO0lBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ05BLE1BQU1BLElBQUlBLEtBQUtBLENBQ1hBLG9FQUFvRUEsR0FBR0EsU0FBU0EsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDL0dBLENBQUNBO0FBQ0hBLENBQUNBO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBZ0ZHO0FBQ0gsc0JBQXNCLE1BQXVCO0lBQzNDQyxJQUFJQSxXQUFXQSxHQUFHQSxXQUFXQSxDQUN6QkEsTUFBTUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0EsV0FBV0EsR0FBR0EsU0FBU0EsRUFBRUEsYUFBYUEsQ0FBQ0EsQ0FBQ0E7SUFDMUZBLElBQUlBLEtBQUtBLEdBQUdBLFdBQVdBLENBQUNBLFNBQVNBLENBQUNBO0lBQ2xDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxjQUFjQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNyQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcEJBLFdBQVlBLENBQUNBLFNBQVNBLEdBQUdBLEtBQUtBO2dCQUNyQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBWUEsTUFBTUEsQ0FBQ0EsT0FBUUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDMURBLENBQUNBO1FBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ05BLE1BQU1BLElBQUlBLEtBQUtBLENBQ1hBLDJFQUEyRUEsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDOUdBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0RBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZCQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFXQSxJQUFJQSxNQUFNQSxDQUFDQSxjQUFjQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN6RUEsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDN0NBLENBQUNBO0lBQ0hBLENBQUNBO0lBRURBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLFdBQVdBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxPQUFPQSxDQUFDQSxjQUFjQSxDQUFDQSxhQUFhQSxFQUFFQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxXQUFXQSxDQUFDQSxDQUFDQTtJQUN2RUEsQ0FBQ0E7SUFFREEsTUFBTUEsQ0FBZUEsV0FBV0EsQ0FBQ0E7QUFDbkNBLENBQUNBO0FBRUQsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUM3QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEMsTUFBTSwrREFBK0QsQ0FBQztBQUN4RSxDQUFDO0FBRUQsOEJBQ0ksYUFBYSxFQUFFLE9BQU8sR0FBMkIsSUFBSTtJQUN2REMsMEJBQTBCQSxTQUFTQTtRQUNqQ0MsSUFBSUEsa0JBQWtCQSxHQUFHQSxJQUFVQSxhQUFjQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUM3REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsWUFBWUEsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbENBLE1BQU1BLENBQUNBLGtCQUFrQkEsQ0FBQ0E7UUFDNUJBLENBQUNBO1FBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ05BLElBQUlBLGVBQWVBLEdBQ2ZBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLFdBQVdBLFlBQVlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1lBQ2xGQSxlQUFlQSxDQUFDQSxJQUFJQSxDQUFDQSxrQkFBa0JBLENBQUNBLENBQUNBO1lBQ3pDQSxJQUFJQSxhQUFhQSxHQUFpQ0EsdUJBQXVCQSxHQUFHQTtnQkFDMUVDLElBQUlBLFdBQVdBLEdBQUdBLE9BQU9BLENBQUNBLGNBQWNBLENBQUNBLGFBQWFBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO2dCQUM3REEsV0FBV0EsR0FBR0EsV0FBV0EsSUFBSUEsRUFBRUEsQ0FBQ0E7Z0JBQ2hDQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxrQkFBa0JBLENBQUNBLENBQUNBO2dCQUNyQ0EsT0FBT0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsYUFBYUEsRUFBRUEsV0FBV0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hEQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUNiQSxDQUFDQSxDQUFDRDtZQUNGQSxhQUFhQSxDQUFDQSxXQUFXQSxHQUFHQSxlQUFlQSxDQUFDQTtZQUM1Q0EsYUFBYUEsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDNUJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO2dCQUFDQSxPQUFPQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQTtZQUNwQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0E7UUFDdkJBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0RELGdCQUFnQkEsQ0FBQ0EsU0FBU0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDcEVBLE1BQU1BLENBQUNBLGdCQUFnQkEsQ0FBQ0E7QUFDMUJBLENBQUNBO0FBRUQsbUNBQW1DLGFBQWE7SUFDOUNHLCtCQUErQkEsR0FBR0EsSUFBSUE7UUFDcENDLElBQUlBLGtCQUFrQkEsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDaEVBLGFBQWFBLENBQUNBLEtBQUtBLENBQUNBLGtCQUFrQkEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLFlBQVlBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxrQkFBa0JBLENBQUNBO1FBQzVCQSxDQUFDQTtRQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNBQSxjQUFlQSxDQUFDQSxVQUFVQSxHQUFHQSxrQkFBa0JBLENBQUNBO1lBQ3REQSxNQUFNQSxDQUFDQSxjQUFjQSxDQUFDQTtRQUN4QkEsQ0FBQ0E7UUFHREEsd0JBQXdCQSxHQUFHQSxFQUFFQSxTQUFTQSxFQUFFQSxLQUFLQTtZQUMzQ0MsSUFBSUEsVUFBVUEsR0FBWUEsT0FBT0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsWUFBWUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDakVBLFVBQVVBLEdBQUdBLFVBQVVBLElBQUlBLEVBQUVBLENBQUNBO1lBRTlCQSw2RUFBNkVBO1lBQzdFQSxxQkFBcUJBO1lBQ3JCQSxPQUFPQSxVQUFVQSxDQUFDQSxNQUFNQSxJQUFJQSxLQUFLQSxFQUFFQSxDQUFDQTtnQkFDbENBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3hCQSxDQUFDQTtZQUVEQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUM1Q0EsSUFBSUEsbUJBQW1CQSxHQUFVQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUNuREEsbUJBQW1CQSxDQUFDQSxJQUFJQSxDQUFDQSxrQkFBa0JBLENBQUNBLENBQUNBO1lBRTdDQSxPQUFPQSxDQUFDQSxjQUFjQSxDQUFDQSxZQUFZQSxFQUFFQSxVQUFVQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUN0REEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFDYkEsQ0FBQ0E7SUFDSEQsQ0FBQ0E7SUFDREQscUJBQXFCQSxDQUFDQSxTQUFTQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUN6RUEsTUFBTUEsQ0FBQ0EscUJBQXFCQSxDQUFDQTtBQUMvQkEsQ0FBQ0E7QUFFRCxrQ0FBa0MsWUFBWTtJQUM1Q0csOEJBQThCQSxHQUFHQSxJQUFJQTtRQUNuQ0MsSUFBSUEsaUJBQWlCQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUM5REEsWUFBWUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU1Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsWUFBWUEsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakNBLE1BQU1BLENBQUNBLGlCQUFpQkEsQ0FBQ0E7UUFDM0JBLENBQUNBO1FBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ05BLE1BQU1BLENBQUNBLHVCQUF1QkEsTUFBV0EsRUFBRUEsSUFBWUE7Z0JBQ3JEQyxJQUFJQSxJQUFJQSxHQUFHQSxPQUFPQSxDQUFDQSxjQUFjQSxDQUFDQSxjQUFjQSxFQUFFQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtnQkFDdEVBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLEVBQUVBLENBQUNBO2dCQUNsQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7Z0JBQzlCQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxpQkFBaUJBLENBQUNBLENBQUNBO2dCQUN0Q0EsT0FBT0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsY0FBY0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDbkVBLENBQUNBLENBQUNEO1FBQ0pBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0RELG9CQUFvQkEsQ0FBQ0EsU0FBU0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDdkVBLE1BQU1BLENBQUNBLG9CQUFvQkEsQ0FBQ0E7QUFDOUJBLENBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb25jcmV0ZVR5cGUsIGdsb2JhbCwgVHlwZSwgaXNGdW5jdGlvbiwgc3RyaW5naWZ5fSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuXG4vKipcbiAqIERlY2xhcmVzIHRoZSBpbnRlcmZhY2UgdG8gYmUgdXNlZCB3aXRoIHtAbGluayBDbGFzc30uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NEZWZpbml0aW9uIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsIGFyZ3VtZW50IGZvciBzcGVjaWZ5aW5nIHRoZSBzdXBlcmNsYXNzLlxuICAgKi9cbiAgZXh0ZW5kcz86IFR5cGU7XG5cbiAgLyoqXG4gICAqIFJlcXVpcmVkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBhIGNsYXNzLlxuICAgKlxuICAgKiBUaGUgZnVuY3Rpb24gbWF5IGJlIG9wdGlvbmFsbHkgd3JhcHBlZCBpbiBhbiBgQXJyYXlgLCBpbiB3aGljaCBjYXNlIGFkZGl0aW9uYWwgcGFyYW1ldGVyXG4gICAqIGFubm90YXRpb25zIG1heSBiZSBzcGVjaWZpZWQuXG4gICAqIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIGFuZCB0aGUgbnVtYmVyIG9mIHBhcmFtZXRlciBhbm5vdGF0aW9ucyBtdXN0IG1hdGNoLlxuICAgKlxuICAgKiBTZWUge0BsaW5rIENsYXNzfSBmb3IgZXhhbXBsZSBvZiB1c2FnZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yOiBGdW5jdGlvbiB8IGFueVtdO1xuXG4gIC8qKlxuICAgKiBPdGhlciBtZXRob2RzIG9uIHRoZSBjbGFzcy4gTm90ZSB0aGF0IHZhbHVlcyBzaG91bGQgaGF2ZSB0eXBlICdGdW5jdGlvbicgYnV0IFRTIHJlcXVpcmVzXG4gICAqIGFsbCBwcm9wZXJ0aWVzIHRvIGhhdmUgYSBuYXJyb3dlciB0eXBlIHRoYW4gdGhlIGluZGV4IHNpZ25hdHVyZS5cbiAgICovXG4gIFt4OiBzdHJpbmddOiBUeXBlIHwgRnVuY3Rpb24gfCBhbnlbXTtcbn1cblxuLyoqXG4gKiBBbiBpbnRlcmZhY2UgaW1wbGVtZW50ZWQgYnkgYWxsIEFuZ3VsYXIgdHlwZSBkZWNvcmF0b3JzLCB3aGljaCBhbGxvd3MgdGhlbSB0byBiZSB1c2VkIGFzIEVTN1xuICogZGVjb3JhdG9ycyBhcyB3ZWxsIGFzXG4gKiBBbmd1bGFyIERTTCBzeW50YXguXG4gKlxuICogRFNMIHN5bnRheDpcbiAqXG4gKiBgYGBcbiAqIHZhciBNeUNsYXNzID0gbmdcbiAqICAgLkNvbXBvbmVudCh7Li4ufSlcbiAqICAgLlZpZXcoey4uLn0pXG4gKiAgIC5DbGFzcyh7Li4ufSk7XG4gKiBgYGBcbiAqXG4gKiBFUzcgc3ludGF4OlxuICpcbiAqIGBgYFxuICogQG5nLkNvbXBvbmVudCh7Li4ufSlcbiAqIEBuZy5WaWV3KHsuLi59KVxuICogY2xhc3MgTXlDbGFzcyB7Li4ufVxuICogYGBgXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHlwZURlY29yYXRvciB7XG4gIC8qKlxuICAgKiBJbnZva2UgYXMgRVM3IGRlY29yYXRvci5cbiAgICovXG4gIDxUIGV4dGVuZHMgVHlwZT4odHlwZTogVCk6IFQ7XG5cbiAgLy8gTWFrZSBUeXBlRGVjb3JhdG9yIGFzc2lnbmFibGUgdG8gYnVpbHQtaW4gUGFyYW1ldGVyRGVjb3JhdG9yIHR5cGUuXG4gIC8vIFBhcmFtZXRlckRlY29yYXRvciBpcyBkZWNsYXJlZCBpbiBsaWIuZC50cyBhcyBhIGBkZWNsYXJlIHR5cGVgXG4gIC8vIHNvIHdlIGNhbm5vdCBkZWNsYXJlIHRoaXMgaW50ZXJmYWNlIGFzIGEgc3VidHlwZS5cbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzMzNzkjaXNzdWVjb21tZW50LTEyNjE2OTQxN1xuICAodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5Pzogc3RyaW5nIHwgc3ltYm9sLCBwYXJhbWV0ZXJJbmRleD86IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JhZ2UgZm9yIHRoZSBhY2N1bXVsYXRlZCBhbm5vdGF0aW9ucyBzbyBmYXIgdXNlZCBieSB0aGUgRFNMIHN5bnRheC5cbiAgICpcbiAgICogVXNlZCBieSB7QGxpbmsgQ2xhc3N9IHRvIGFubm90YXRlIHRoZSBnZW5lcmF0ZWQgY2xhc3MuXG4gICAqL1xuICBhbm5vdGF0aW9uczogYW55W107XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgY2xhc3MgZnJvbSB0aGUgZGVmaW5pdGlvbiBhbmQgYW5ub3RhdGUgaXQgd2l0aCB7QGxpbmsgVHlwZURlY29yYXRvciNhbm5vdGF0aW9uc30uXG4gICAqL1xuICBDbGFzcyhvYmo6IENsYXNzRGVmaW5pdGlvbik6IENvbmNyZXRlVHlwZTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEFubm90YXRpb24oYW5ub3RhdGlvbjogYW55KTogYW55IHtcbiAgaWYgKGlzRnVuY3Rpb24oYW5ub3RhdGlvbikgJiYgYW5ub3RhdGlvbi5oYXNPd25Qcm9wZXJ0eSgnYW5ub3RhdGlvbicpKSB7XG4gICAgLy8gaXQgaXMgYSBkZWNvcmF0b3IsIGV4dHJhY3QgYW5ub3RhdGlvblxuICAgIGFubm90YXRpb24gPSBhbm5vdGF0aW9uLmFubm90YXRpb247XG4gIH1cbiAgcmV0dXJuIGFubm90YXRpb247XG59XG5cbmZ1bmN0aW9uIGFwcGx5UGFyYW1zKGZuT3JBcnJheTogKEZ1bmN0aW9uIHwgYW55W10pLCBrZXk6IHN0cmluZyk6IEZ1bmN0aW9uIHtcbiAgaWYgKGZuT3JBcnJheSA9PT0gT2JqZWN0IHx8IGZuT3JBcnJheSA9PT0gU3RyaW5nIHx8IGZuT3JBcnJheSA9PT0gRnVuY3Rpb24gfHxcbiAgICAgIGZuT3JBcnJheSA9PT0gTnVtYmVyIHx8IGZuT3JBcnJheSA9PT0gQXJyYXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgdXNlIG5hdGl2ZSAke3N0cmluZ2lmeShmbk9yQXJyYXkpfSBhcyBjb25zdHJ1Y3RvcmApO1xuICB9XG4gIGlmIChpc0Z1bmN0aW9uKGZuT3JBcnJheSkpIHtcbiAgICByZXR1cm4gPEZ1bmN0aW9uPmZuT3JBcnJheTtcbiAgfSBlbHNlIGlmIChmbk9yQXJyYXkgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHZhciBhbm5vdGF0aW9uczogYW55W10gPSBmbk9yQXJyYXk7XG4gICAgdmFyIGZuOiBGdW5jdGlvbiA9IGZuT3JBcnJheVtmbk9yQXJyYXkubGVuZ3RoIC0gMV07XG4gICAgaWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBMYXN0IHBvc2l0aW9uIG9mIENsYXNzIG1ldGhvZCBhcnJheSBtdXN0IGJlIEZ1bmN0aW9uIGluIGtleSAke2tleX0gd2FzICcke3N0cmluZ2lmeShmbil9J2ApO1xuICAgIH1cbiAgICB2YXIgYW5ub0xlbmd0aCA9IGFubm90YXRpb25zLmxlbmd0aCAtIDE7XG4gICAgaWYgKGFubm9MZW5ndGggIT0gZm4ubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYE51bWJlciBvZiBhbm5vdGF0aW9ucyAoJHthbm5vTGVuZ3RofSkgZG9lcyBub3QgbWF0Y2ggbnVtYmVyIG9mIGFyZ3VtZW50cyAoJHtmbi5sZW5ndGh9KSBpbiB0aGUgZnVuY3Rpb246ICR7c3RyaW5naWZ5KGZuKX1gKTtcbiAgICB9XG4gICAgdmFyIHBhcmFtc0Fubm90YXRpb25zOiBhbnlbXVtdID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYW5ub3RhdGlvbnMubGVuZ3RoIC0gMTsgaSA8IGlpOyBpKyspIHtcbiAgICAgIHZhciBwYXJhbUFubm90YXRpb25zOiBhbnlbXSA9IFtdO1xuICAgICAgcGFyYW1zQW5ub3RhdGlvbnMucHVzaChwYXJhbUFubm90YXRpb25zKTtcbiAgICAgIHZhciBhbm5vdGF0aW9uID0gYW5ub3RhdGlvbnNbaV07XG4gICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5ub3RhdGlvbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHBhcmFtQW5ub3RhdGlvbnMucHVzaChleHRyYWN0QW5ub3RhdGlvbihhbm5vdGF0aW9uW2pdKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbihhbm5vdGF0aW9uKSkge1xuICAgICAgICBwYXJhbUFubm90YXRpb25zLnB1c2goZXh0cmFjdEFubm90YXRpb24oYW5ub3RhdGlvbikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1Bbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKCdwYXJhbWV0ZXJzJywgcGFyYW1zQW5ub3RhdGlvbnMsIGZuKTtcbiAgICByZXR1cm4gZm47XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgT25seSBGdW5jdGlvbiBvciBBcnJheSBpcyBzdXBwb3J0ZWQgaW4gQ2xhc3MgZGVmaW5pdGlvbiBmb3Iga2V5ICcke2tleX0nIGlzICcke3N0cmluZ2lmeShmbk9yQXJyYXkpfSdgKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgd2F5IGZvciBleHByZXNzaW5nIEVTNiBjbGFzc2VzIHdpdGggcGFyYW1ldGVyIGFubm90YXRpb25zIGluIEVTNS5cbiAqXG4gKiAjIyBCYXNpYyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiB2YXIgR3JlZXRlciA9IG5nLkNsYXNzKHtcbiAqICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG5hbWUpIHtcbiAqICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICogICB9LFxuICpcbiAqICAgZ3JlZXQ6IGZ1bmN0aW9uKCkge1xuICogICAgIGFsZXJ0KCdIZWxsbyAnICsgdGhpcy5uYW1lICsgJyEnKTtcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBpcyBlcXVpdmFsZW50IHRvIEVTNjpcbiAqXG4gKiBgYGBcbiAqIGNsYXNzIEdyZWV0ZXIge1xuICogICBjb25zdHJ1Y3RvcihuYW1lKSB7XG4gKiAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAqICAgfVxuICpcbiAqICAgZ3JlZXQoKSB7XG4gKiAgICAgYWxlcnQoJ0hlbGxvICcgKyB0aGlzLm5hbWUgKyAnIScpO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBvciBlcXVpdmFsZW50IHRvIEVTNTpcbiAqXG4gKiBgYGBcbiAqIHZhciBHcmVldGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAqICAgdGhpcy5uYW1lID0gbmFtZTtcbiAqIH1cbiAqXG4gKiBHcmVldGVyLnByb3RvdHlwZS5ncmVldCA9IGZ1bmN0aW9uICgpIHtcbiAqICAgYWxlcnQoJ0hlbGxvICcgKyB0aGlzLm5hbWUgKyAnIScpO1xuICogfVxuICogYGBgXG4gKlxuICogIyMjIEV4YW1wbGUgd2l0aCBwYXJhbWV0ZXIgYW5ub3RhdGlvbnNcbiAqXG4gKiBgYGBcbiAqIHZhciBNeVNlcnZpY2UgPSBuZy5DbGFzcyh7XG4gKiAgIGNvbnN0cnVjdG9yOiBbU3RyaW5nLCBbbmV3IFF1ZXJ5KCksIFF1ZXJ5TGlzdF0sIGZ1bmN0aW9uKG5hbWUsIHF1ZXJ5TGlzdCkge1xuICogICAgIC4uLlxuICogICB9XVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBpcyBlcXVpdmFsZW50IHRvIEVTNjpcbiAqXG4gKiBgYGBcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgQFF1ZXJ5KCkgcXVlcnlMaXN0OiBRdWVyeUxpc3QpIHtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogIyMjIEV4YW1wbGUgd2l0aCBpbmhlcml0YW5jZVxuICpcbiAqIGBgYFxuICogdmFyIFNoYXBlID0gbmcuQ2xhc3Moe1xuICogICBjb25zdHJ1Y3RvcjogKGNvbG9yKSB7XG4gKiAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICogICB9XG4gKiB9KTtcbiAqXG4gKiB2YXIgU3F1YXJlID0gbmcuQ2xhc3Moe1xuICogICBleHRlbmRzOiBTaGFwZSxcbiAqICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGNvbG9yLCBzaXplKSB7XG4gKiAgICAgU2hhcGUuY2FsbCh0aGlzLCBjb2xvcik7XG4gKiAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIENsYXNzKGNsc0RlZjogQ2xhc3NEZWZpbml0aW9uKTogQ29uY3JldGVUeXBlIHtcbiAgdmFyIGNvbnN0cnVjdG9yID0gYXBwbHlQYXJhbXMoXG4gICAgICBjbHNEZWYuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBjbHNEZWYuY29uc3RydWN0b3IgOiB1bmRlZmluZWQsICdjb25zdHJ1Y3RvcicpO1xuICB2YXIgcHJvdG8gPSBjb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gIGlmIChjbHNEZWYuaGFzT3duUHJvcGVydHkoJ2V4dGVuZHMnKSkge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNsc0RlZi5leHRlbmRzKSkge1xuICAgICAgKDxGdW5jdGlvbj5jb25zdHJ1Y3RvcikucHJvdG90eXBlID0gcHJvdG8gPVxuICAgICAgICAgIE9iamVjdC5jcmVhdGUoKDxGdW5jdGlvbj5jbHNEZWYuZXh0ZW5kcykucHJvdG90eXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDbGFzcyBkZWZpbml0aW9uICdleHRlbmRzJyBwcm9wZXJ0eSBtdXN0IGJlIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gd2FzOiAke3N0cmluZ2lmeShjbHNEZWYuZXh0ZW5kcyl9YCk7XG4gICAgfVxuICB9XG4gIGZvciAodmFyIGtleSBpbiBjbHNEZWYpIHtcbiAgICBpZiAoa2V5ICE9ICdleHRlbmRzJyAmJiBrZXkgIT0gJ3Byb3RvdHlwZScgJiYgY2xzRGVmLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHByb3RvW2tleV0gPSBhcHBseVBhcmFtcyhjbHNEZWZba2V5XSwga2V5KTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcyAmJiB0aGlzLmFubm90YXRpb25zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKCdhbm5vdGF0aW9ucycsIHRoaXMuYW5ub3RhdGlvbnMsIGNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIHJldHVybiA8Q29uY3JldGVUeXBlPmNvbnN0cnVjdG9yO1xufVxuXG52YXIgUmVmbGVjdCA9IGdsb2JhbC5SZWZsZWN0O1xuaWYgKCEoUmVmbGVjdCAmJiBSZWZsZWN0LmdldE1ldGFkYXRhKSkge1xuICB0aHJvdyAncmVmbGVjdC1tZXRhZGF0YSBzaGltIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgY2xhc3MgZGVjb3JhdG9ycyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRGVjb3JhdG9yKFxuICAgIGFubm90YXRpb25DbHMsIGNoYWluRm46IChmbjogRnVuY3Rpb24pID0+IHZvaWQgPSBudWxsKTogKC4uLmFyZ3M6IGFueVtdKSA9PiAoY2xzOiBhbnkpID0+IGFueSB7XG4gIGZ1bmN0aW9uIERlY29yYXRvckZhY3Rvcnkob2JqT3JUeXBlKTogKGNsczogYW55KSA9PiBhbnkge1xuICAgIHZhciBhbm5vdGF0aW9uSW5zdGFuY2UgPSBuZXcgKDxhbnk+YW5ub3RhdGlvbkNscykob2JqT3JUeXBlKTtcbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGFubm90YXRpb25DbHMpIHtcbiAgICAgIHJldHVybiBhbm5vdGF0aW9uSW5zdGFuY2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjaGFpbkFubm90YXRpb24gPVxuICAgICAgICAgIGlzRnVuY3Rpb24odGhpcykgJiYgdGhpcy5hbm5vdGF0aW9ucyBpbnN0YW5jZW9mIEFycmF5ID8gdGhpcy5hbm5vdGF0aW9ucyA6IFtdO1xuICAgICAgY2hhaW5Bbm5vdGF0aW9uLnB1c2goYW5ub3RhdGlvbkluc3RhbmNlKTtcbiAgICAgIHZhciBUeXBlRGVjb3JhdG9yOiBUeXBlRGVjb3JhdG9yID0gPFR5cGVEZWNvcmF0b3I+ZnVuY3Rpb24gVHlwZURlY29yYXRvcihjbHMpIHtcbiAgICAgICAgdmFyIGFubm90YXRpb25zID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YSgnYW5ub3RhdGlvbnMnLCBjbHMpO1xuICAgICAgICBhbm5vdGF0aW9ucyA9IGFubm90YXRpb25zIHx8IFtdO1xuICAgICAgICBhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb25JbnN0YW5jZSk7XG4gICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoJ2Fubm90YXRpb25zJywgYW5ub3RhdGlvbnMsIGNscyk7XG4gICAgICAgIHJldHVybiBjbHM7XG4gICAgICB9O1xuICAgICAgVHlwZURlY29yYXRvci5hbm5vdGF0aW9ucyA9IGNoYWluQW5ub3RhdGlvbjtcbiAgICAgIFR5cGVEZWNvcmF0b3IuQ2xhc3MgPSBDbGFzcztcbiAgICAgIGlmIChjaGFpbkZuKSBjaGFpbkZuKFR5cGVEZWNvcmF0b3IpO1xuICAgICAgcmV0dXJuIFR5cGVEZWNvcmF0b3I7XG4gICAgfVxuICB9XG4gIERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShhbm5vdGF0aW9uQ2xzLnByb3RvdHlwZSk7XG4gIHJldHVybiBEZWNvcmF0b3JGYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVBhcmFtRGVjb3JhdG9yKGFubm90YXRpb25DbHMpOiBhbnkge1xuICBmdW5jdGlvbiBQYXJhbURlY29yYXRvckZhY3RvcnkoLi4uYXJncyk6IGFueSB7XG4gICAgdmFyIGFubm90YXRpb25JbnN0YW5jZSA9IE9iamVjdC5jcmVhdGUoYW5ub3RhdGlvbkNscy5wcm90b3R5cGUpO1xuICAgIGFubm90YXRpb25DbHMuYXBwbHkoYW5ub3RhdGlvbkluc3RhbmNlLCBhcmdzKTtcbiAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGFubm90YXRpb25DbHMpIHtcbiAgICAgIHJldHVybiBhbm5vdGF0aW9uSW5zdGFuY2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICg8YW55PlBhcmFtRGVjb3JhdG9yKS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbkluc3RhbmNlO1xuICAgICAgcmV0dXJuIFBhcmFtRGVjb3JhdG9yO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gUGFyYW1EZWNvcmF0b3IoY2xzLCB1bnVzZWRLZXksIGluZGV4KTogYW55IHtcbiAgICAgIHZhciBwYXJhbWV0ZXJzOiBhbnlbXVtdID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgncGFyYW1ldGVycycsIGNscyk7XG4gICAgICBwYXJhbWV0ZXJzID0gcGFyYW1ldGVycyB8fCBbXTtcblxuICAgICAgLy8gdGhlcmUgbWlnaHQgYmUgZ2FwcyBpZiBzb21lIGluIGJldHdlZW4gcGFyYW1ldGVycyBkbyBub3QgaGF2ZSBhbm5vdGF0aW9ucy5cbiAgICAgIC8vIHdlIHBhZCB3aXRoIG51bGxzLlxuICAgICAgd2hpbGUgKHBhcmFtZXRlcnMubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgIHBhcmFtZXRlcnMucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgcGFyYW1ldGVyc1tpbmRleF0gPSBwYXJhbWV0ZXJzW2luZGV4XSB8fCBbXTtcbiAgICAgIHZhciBhbm5vdGF0aW9uc0ZvclBhcmFtOiBhbnlbXSA9IHBhcmFtZXRlcnNbaW5kZXhdO1xuICAgICAgYW5ub3RhdGlvbnNGb3JQYXJhbS5wdXNoKGFubm90YXRpb25JbnN0YW5jZSk7XG5cbiAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoJ3BhcmFtZXRlcnMnLCBwYXJhbWV0ZXJzLCBjbHMpO1xuICAgICAgcmV0dXJuIGNscztcbiAgICB9XG4gIH1cbiAgUGFyYW1EZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoYW5ub3RhdGlvbkNscy5wcm90b3R5cGUpO1xuICByZXR1cm4gUGFyYW1EZWNvcmF0b3JGYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByb3BEZWNvcmF0b3IoZGVjb3JhdG9yQ2xzKTogYW55IHtcbiAgZnVuY3Rpb24gUHJvcERlY29yYXRvckZhY3RvcnkoLi4uYXJncyk6IGFueSB7XG4gICAgdmFyIGRlY29yYXRvckluc3RhbmNlID0gT2JqZWN0LmNyZWF0ZShkZWNvcmF0b3JDbHMucHJvdG90eXBlKTtcbiAgICBkZWNvcmF0b3JDbHMuYXBwbHkoZGVjb3JhdG9ySW5zdGFuY2UsIGFyZ3MpO1xuXG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBkZWNvcmF0b3JDbHMpIHtcbiAgICAgIHJldHVybiBkZWNvcmF0b3JJbnN0YW5jZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIFByb3BEZWNvcmF0b3IodGFyZ2V0OiBhbnksIG5hbWU6IHN0cmluZykge1xuICAgICAgICB2YXIgbWV0YSA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoJ3Byb3BNZXRhZGF0YScsIHRhcmdldC5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIG1ldGEgPSBtZXRhIHx8IHt9O1xuICAgICAgICBtZXRhW25hbWVdID0gbWV0YVtuYW1lXSB8fCBbXTtcbiAgICAgICAgbWV0YVtuYW1lXS51bnNoaWZ0KGRlY29yYXRvckluc3RhbmNlKTtcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSgncHJvcE1ldGFkYXRhJywgbWV0YSwgdGFyZ2V0LmNvbnN0cnVjdG9yKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIFByb3BEZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZGVjb3JhdG9yQ2xzLnByb3RvdHlwZSk7XG4gIHJldHVybiBQcm9wRGVjb3JhdG9yRmFjdG9yeTtcbn1cbiJdfQ==