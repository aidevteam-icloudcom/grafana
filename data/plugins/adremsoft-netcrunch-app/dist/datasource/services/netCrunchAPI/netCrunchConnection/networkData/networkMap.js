'use strict';System.register([],function(_export){'use strict';var _createClass,PRIVATE_PROPERTIES,NetCrunchNetworkMap;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();PRIVATE_PROPERTIES={local:Symbol('local'),values:Symbol('values')};_export('NetCrunchNetworkMap',NetCrunchNetworkMap=function(){function NetCrunchNetworkMap(a){/* eslint-disable no-param-reassign */function b(d,e){if(null!=e.HostMapData)for(var h,f=1,g=e.HostMapData[0];f<=g;f+=1)h=e.HostMapData[f],(0===h[0]||5===h[0])&&d.nodesId.push(parseInt(h[1],10))}/* eslint-enable no-param-reassign */_classCallCheck(this,NetCrunchNetworkMap),null==a?(this[PRIVATE_PROPERTIES.local]={},this[PRIVATE_PROPERTIES.values]={}):(this[PRIVATE_PROPERTIES.local]=a.local,this[PRIVATE_PROPERTIES.values]=a.getValues()),this[PRIVATE_PROPERTIES.local].nodesId=[],function(d,e){if(d.netId=e.NetIntId||'',d.parentId=null==e.NetworkData?'':parseInt(e.NetworkData[0],10),isNaN(d.parentId)&&(d.parentId=''),d.isFolder='dynfolder'===e.MapClassTag||null!=e.NetworkData&&Array.isArray(e.NetworkData[1]),d.isFolder){var f=null==e.NetworkData?[]:e.NetworkData[1];Array.isArray(f)&&(d.maps=f.map(function(g){return parseInt(g,10)})),'fnet'===e.MapClassTag&&b(d,e)}else b(d,e)}(this[PRIVATE_PROPERTIES.local],this[PRIVATE_PROPERTIES.values]),this[PRIVATE_PROPERTIES.local].children=[]}return _createClass(NetCrunchNetworkMap,[{key:'addChild',value:function(a){var b=this.children.every(function(c){return c.netId!==a.netId});!0===b&&this.children.push(a)}},{key:'getChildMapByDisplayName',value:function(a){var b=null;return this.children.some(function(c){return c.displayName.toUpperCase()===a.toUpperCase()&&(b=c,!0)}),b}},{key:'netId',get:function(){return this[PRIVATE_PROPERTIES.local].netId}},{key:'parentId',get:function(){return this[PRIVATE_PROPERTIES.local].parentId}},{key:'nodesId',get:function(){return this[PRIVATE_PROPERTIES.local].nodesId}},{key:'allNodesId',get:function(){function a(c,d){return c.forEach(function(e){return d.add(e)}),d}var b=new Set;return this.isFolder?('fnet'===this[PRIVATE_PROPERTIES.values].MapClassTag&&a(this.nodesId,b),this.children.forEach(function(c){a(c.allNodesId,b)})):a(this.nodesId,b),Array.from(b)}},{key:'isFolder',get:function(){return this[PRIVATE_PROPERTIES.local].isFolder}},{key:'children',get:function(){return this[PRIVATE_PROPERTIES.local].children}},{key:'displayName',get:function(){return this[PRIVATE_PROPERTIES.values].DisplayName||''}},{key:'allChildren',get:function(){function a(c,d){return c.displayName.localeCompare(d.displayName)}function b(c,d,e){var f=[];return c.children.sort(a).forEach(function(g){if(f.push({map:g,innerLevel:d,parentIndex:e}),c.isFolder&&2>=d){var h=isNaN(e)?f.length-1:e+f.length;f=f.concat(b(g,d+1,h))}}),f}return b(this,1,'root')}}]),NetCrunchNetworkMap}());_export('NetCrunchNetworkMap',NetCrunchNetworkMap)}}});
//# sourceMappingURL=networkMap.js.map
