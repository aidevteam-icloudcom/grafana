"use strict";System.register([],function(_export){"use strict";var _createClass,NetCrunchConnectionCache;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError("Cannot call a class as a function")}return{setters:[],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,"value"in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();_export("NetCrunchConnectionCache",NetCrunchConnectionCache=function(){function NetCrunchConnectionCache(){_classCallCheck(this,NetCrunchConnectionCache),this.connectionCache=new Map}return _createClass(NetCrunchConnectionCache,[{key:"getConnectionKey",value:function(a){// eslint-disable-line
return a.serverUrl+":"+a.username}},{key:"addConnection",value:function(a,b){this.connectionCache.set(this.getConnectionKey(a),b)}},{key:"deleteConnection",value:function(a){this.connectionCache.delete(this.getConnectionKey(a))}},{key:"getConnection",value:function(a){return this.connectionCache.get(this.getConnectionKey(a))}},{key:"connectionExist",value:function(a){return null!=this.getConnection(a)}}]),NetCrunchConnectionCache}());_export("NetCrunchConnectionCache",NetCrunchConnectionCache)}}});
//# sourceMappingURL=connectionCache.js.map
