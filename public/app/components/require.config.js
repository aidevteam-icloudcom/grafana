require.config({
  urlArgs: 'bust=' + (new Date().getTime()),
<<<<<<< c2c5414f721c2b21b957173f2def0a4367a70051
<<<<<<< dda08978836d7bcaa3f0bf6cde71161a86895386
  baseUrl: 'public',
=======
  baseUrl: 'public/app',
>>>>>>> tech(typescript): its looking good

  paths: {
<<<<<<< 13db6cebceeffaef68d4e1cd288cc7d116261413
<<<<<<< d2990b60ec74138d9a51007b47efbcb10200a2cf
=======
  baseUrl: 'public',

  paths: {
>>>>>>> feat() started work on more feature rich time picker
=======
<<<<<<< 495ed87f9b7044005f3eae13c809c753acf41b30
>>>>>>> [OWL-52] Add servers distribution map among provinces
    config:                   'app/components/config',
    settings:                 'app/components/settings',
    kbn:                      'app/components/kbn',
    store:                    'app/components/store',
    'extend-jquery':          'app/components/extend-jquery',
    lodash:                   'app/components/lodash.extended',

    text:                     'vendor/requirejs-text/text',
    moment:                   'vendor/moment',
    filesaver:                'vendor/filesaver',
    ZeroClipboard:            'vendor/ZeroClipboard',
    angular:                  'vendor/angular/angular',
    'angular-route':          'vendor/angular-route/angular-route',
    'angular-sanitize':       'vendor/angular-sanitize/angular-sanitize',
    'angular-dragdrop':       'vendor/angular-native-dragdrop/draganddrop',
    'angular-strap':          'vendor/angular-other/angular-strap',
<<<<<<< c2c5414f721c2b21b957173f2def0a4367a70051
    'angular-ui':             'vendor/angular-ui/ui-bootstrap-tpls',
=======
    'angular-ui':             'vendor/angular-ui/tabs',
>>>>>>> feat() started work on more feature rich time picker
    timepicker:               'vendor/angular-other/timepicker',
    datepicker:               'vendor/angular-other/datepicker',
    bindonce:                 'vendor/angular-bindonce/bindonce',
    crypto:                   'vendor/crypto.min',
    spectrum:                 'vendor/spectrum',

    'lodash-src':             'vendor/lodash',
    bootstrap:                'vendor/bootstrap/bootstrap',

    jquery:                   'vendor/jquery/dist/jquery',

    'jquery.flot':             'vendor/flot/jquery.flot',
    'jquery.flot.pie':         'vendor/flot/jquery.flot.pie',
    'jquery.flot.events':      'vendor/flot/jquery.flot.events',
    'jquery.flot.selection':   'vendor/flot/jquery.flot.selection',
    'jquery.flot.stack':       'vendor/flot/jquery.flot.stack',
    'jquery.flot.stackpercent':'vendor/flot/jquery.flot.stackpercent',
    'jquery.flot.time':        'vendor/flot/jquery.flot.time',
    'jquery.flot.crosshair':   'vendor/flot/jquery.flot.crosshair',
    'jquery.flot.fillbelow':   'vendor/flot/jquery.flot.fillbelow',

<<<<<<< 13db6cebceeffaef68d4e1cd288cc7d116261413
<<<<<<< 69731ad64d6739e64bddf8f0ed4807f151d3c0c8
<<<<<<< c2c5414f721c2b21b957173f2def0a4367a70051
    echarts:                   'vendor/echarts/echarts',
    zrender:                   'vendor/zrender',

=======
>>>>>>> feat() started work on more feature rich time picker
=======
    echarts:                   'vendor/echarts',
=======
    echarts:                   'vendor/echarts/echarts',
>>>>>>> [OWL-52] Add servers distribution map among provinces
    zrender:                   'vendor/zrender',

>>>>>>> [OWL-30] Add Echarts map to Grafana
    modernizr:                 'vendor/modernizr-2.6.1',

    'bootstrap-tagsinput':    'vendor/tagsinput/bootstrap-tagsinput',
    'aws-sdk':                'vendor/aws-sdk/dist/aws-sdk.min',
<<<<<<< c2c5414f721c2b21b957173f2def0a4367a70051
=======
    config:                   'components/config',
    settings:                 'components/settings',
    kbn:                      'components/kbn',
    store:                    'components/store',

    text:                     '../vendor/requirejs-text/text',
    moment:                   '../vendor/moment',
    filesaver:                '../vendor/filesaver',
    ZeroClipboard:            '../vendor/ZeroClipboard',
    angular:                  '../vendor/angular/angular',
    'angular-route':          '../vendor/angular-route/angular-route',
    'angular-sanitize':       '../vendor/angular-sanitize/angular-sanitize',
    'angular-dragdrop':       '../vendor/angular-native-dragdrop/draganddrop',
    'angular-strap':          '../vendor/angular-other/angular-strap',
    timepicker:               '../vendor/angular-other/timepicker',
    datepicker:               '../vendor/angular-other/datepicker',
    bindonce:                 '../vendor/angular-bindonce/bindonce',
    crypto:                   '../vendor/crypto.min',
    spectrum:                 '../vendor/spectrum',

    lodash:                   'components/lodash.extended',
    'lodash-src':             '../vendor/lodash',
    bootstrap:                '../vendor/bootstrap/bootstrap',

    jquery:                   '../vendor/jquery/dist/jquery',

    'extend-jquery':          'components/extend-jquery',

    'jquery.flot':             '../vendor/flot/jquery.flot',
    'jquery.flot.pie':         '../vendor/flot/jquery.flot.pie',
    'jquery.flot.events':      '../vendor/flot/jquery.flot.events',
    'jquery.flot.selection':   '../vendor/flot/jquery.flot.selection',
    'jquery.flot.stack':       '../vendor/flot/jquery.flot.stack',
    'jquery.flot.stackpercent':'../vendor/flot/jquery.flot.stackpercent',
    'jquery.flot.time':        '../vendor/flot/jquery.flot.time',
    'jquery.flot.crosshair':   '../vendor/flot/jquery.flot.crosshair',
    'jquery.flot.fillbelow':   '../vendor/flot/jquery.flot.fillbelow',

    echarts:   '../vendor/echarts/echarts',
    zrender:   '../vendor/zrender',
    // zrender:   '../vendor/zrender/zrender',
    modernizr:                '../vendor/modernizr-2.6.1',

    'bootstrap-tagsinput':    '../vendor/tagsinput/bootstrap-tagsinput',
>>>>>>> [OWL-30] Add Echarts map to Grafana
=======
>>>>>>> feat() started work on more feature rich time picker
  },
  shim: {

    spectrum: {
      deps: ['jquery']
    },

    crypto: {
      exports: 'Crypto'
    },

    ZeroClipboard: {
      exports: 'ZeroClipboard'
    },

    angular: {
      deps: ['jquery','config'],
      exports: 'angular'
    },

    bootstrap: {
      deps: ['jquery']
    },

    modernizr: {
      exports: 'Modernizr'
    },

    jquery: {
      exports: 'jQuery'
    },

    // simple dependency declaration
    'jquery.flot':          ['jquery'],
    'jquery.flot.pie':      ['jquery', 'jquery.flot'],
    'jquery.flot.events':   ['jquery', 'jquery.flot'],
    'jquery.flot.selection':['jquery', 'jquery.flot'],
    'jquery.flot.stack':    ['jquery', 'jquery.flot'],
    'jquery.flot.stackpercent':['jquery', 'jquery.flot'],
    'jquery.flot.time':     ['jquery', 'jquery.flot'],
    'jquery.flot.crosshair':['jquery', 'jquery.flot'],
    'jquery.flot.fillbelow':['jquery', 'jquery.flot'],
    'angular-dragdrop':     ['jquery', 'angular'],
    'angular-mocks':        ['angular'],
    'angular-sanitize':     ['angular'],
    'angular-ui':           ['angular'],
    'angular-route':        ['angular'],
    'angular-strap':        ['angular', 'bootstrap','timepicker', 'datepicker'],
    'bindonce':             ['angular'],

    timepicker:             ['jquery', 'bootstrap'],
    datepicker:             ['jquery', 'bootstrap'],

    'bootstrap-tagsinput':  ['jquery'],
  },
});
