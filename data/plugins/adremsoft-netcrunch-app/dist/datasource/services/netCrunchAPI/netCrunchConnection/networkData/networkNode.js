'use strict';System.register([],function(_export){'use strict';var _createClass,MAP_ICON_ID_UNKNOWN,ICON_SIZE,DEVICE_TYPES,PRIVATE_PROPERTIES,NetCrunchNetworkNode;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[],execute:function(){_createClass=function(){function defineProperties(target,props){for(var descriptor,i=0;i<props.length;i++)descriptor=props[i],descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();MAP_ICON_ID_UNKNOWN=100;ICON_SIZE=25;DEVICE_TYPES={WINDOWS:[1,[1,2]],"WINDOWS.SERVER":[1,[1]],"WINDOWS.WORKSTATION":[1,[2]],NOVELL:[1,[3]],LINUX:[1,[4]],UNIX:[1,[5]],SOLARIS:[1,[6]],BSD:[1,[7]],IBM:[1,[8]],MACOS:[1,[9]],ESX:[1,[10]],XENSERVER:[1,[11]]};PRIVATE_PROPERTIES={local:Symbol('local'),values:Symbol('values')};_export('NetCrunchNetworkNode',NetCrunchNetworkNode=function(){function NetCrunchNetworkNode(a,b){_classCallCheck(this,NetCrunchNetworkNode);var c=NetCrunchNetworkNode.parseDeviceType(a.getValues().DeviceType);this[PRIVATE_PROPERTIES.values]=a.getValues(),this[PRIVATE_PROPERTIES.local]=Object.assign({},c),this[PRIVATE_PROPERTIES.local].iconUrl=NetCrunchNetworkNode.getIconUrl(c.iconId,b)}return _createClass(NetCrunchNetworkNode,[{key:'checkDeviceType',value:function(a){var _this=this,b=DEVICE_TYPES[a.toUpperCase()];return null!=b&&2===b.length&&this[PRIVATE_PROPERTIES.local].classId===b[0]+''&&b[1].some(function(c){return _this[PRIVATE_PROPERTIES.local].categoryId===c+''})}},{key:'id',get:function(){return this[PRIVATE_PROPERTIES.values].Id}},{key:'name',get:function(){return this[PRIVATE_PROPERTIES.values].Name}},{key:'address',get:function(){return this[PRIVATE_PROPERTIES.values].Address}},{key:'globalDataNode',get:function(){return this[PRIVATE_PROPERTIES.values].GlobalDataNode}},{key:'iconUrl',get:function(){return this[PRIVATE_PROPERTIES.local].iconUrl}}],[{key:'parseXML',value:function(a){var b=void 0;if(!a||'string'!=typeof a)return null;try{b=new window.DOMParser().parseFromString(a,'text/xml')}catch(c){b=void 0}return b}},{key:'createDeviceType',value:function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:0,b=arguments[1],c=arguments[2],d=arguments[3],f=arguments[4];return{iconId:a,classId:b,categoryId:c,subCategoryId:d,manufacturerId:f}}},{key:'parseDeviceType',value:function(a){if(''!==a&&null!=a){var b=NetCrunchNetworkNode.parseXML(a),c=b.getElementsByTagName('devtype');return null==c[0]?NetCrunchNetworkNode.createDeviceType():NetCrunchNetworkNode.createDeviceType(c[0].getAttribute('iconid')||MAP_ICON_ID_UNKNOWN,c[0].getAttribute('classid'),c[0].getAttribute('CategoryId'),c[0].getAttribute('SubCategoryId'),c[0].getAttribute('ManufacturerId'))}return NetCrunchNetworkNode.createDeviceType()}},{key:'getIconUrl',value:function(a,b){var c=b.ncSrv.IMapIcons.GetIcon.asURL(a,ICON_SIZE,'ok');return b.Client.urlFilter(c)}}]),NetCrunchNetworkNode}());_export('NetCrunchNetworkNode',NetCrunchNetworkNode)}}});
//# sourceMappingURL=networkNode.js.map
