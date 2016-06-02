//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ReactMeteorData;

var require = meteorInstall({"node_modules":{"meteor":{"react-meteor-data":{"meteor-data-mixin.jsx":["babel-runtime/helpers/typeof","babel-runtime/helpers/classCallCheck",function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// packages/react-meteor-data/meteor-data-mixin.jsx                                               //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
var _typeof2 = require("babel-runtime/helpers/typeof");                                           //
                                                                                                  //
var _typeof3 = _interopRequireDefault(_typeof2);                                                  //
                                                                                                  //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                           //
                                                                                                  //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                  //
                                                                                                  //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
                                                                                                  //
ReactMeteorData = {                                                                               // 1
  componentWillMount: function componentWillMount() {                                             // 2
    this.data = {};                                                                               // 3
    this._meteorDataManager = new MeteorDataManager(this);                                        // 4
    var newData = this._meteorDataManager.calculateData();                                        // 5
    this._meteorDataManager.updateData(newData);                                                  // 6
  },                                                                                              //
  componentWillUpdate: function componentWillUpdate(nextProps, nextState) {                       // 8
    var saveProps = this.props;                                                                   // 9
    var saveState = this.state;                                                                   // 10
    var newData = void 0;                                                                         // 11
    try {                                                                                         // 12
      // Temporarily assign this.state and this.props,                                            //
      // so that they are seen by getMeteorData!                                                  //
      // This is a simulation of how the proposed Observe API                                     //
      // for React will work, which calls observe() after                                         //
      // componentWillUpdate and after props and state are                                        //
      // updated, but before render() is called.                                                  //
      // See https://github.com/facebook/react/issues/3398.                                       //
      this.props = nextProps;                                                                     // 20
      this.state = nextState;                                                                     // 21
      newData = this._meteorDataManager.calculateData();                                          // 22
    } finally {                                                                                   //
      this.props = saveProps;                                                                     // 24
      this.state = saveState;                                                                     // 25
    }                                                                                             //
                                                                                                  //
    this._meteorDataManager.updateData(newData);                                                  // 28
  },                                                                                              //
  componentWillUnmount: function componentWillUnmount() {                                         // 30
    this._meteorDataManager.dispose();                                                            // 31
  }                                                                                               //
};                                                                                                //
                                                                                                  //
// A class to keep the state and utility methods needed to manage                                 //
// the Meteor data for a component.                                                               //
                                                                                                  //
var MeteorDataManager = function () {                                                             //
  function MeteorDataManager(component) {                                                         // 38
    (0, _classCallCheck3["default"])(this, MeteorDataManager);                                    //
                                                                                                  //
    this.component = component;                                                                   // 39
    this.computation = null;                                                                      // 40
    this.oldData = null;                                                                          // 41
  }                                                                                               //
                                                                                                  //
  MeteorDataManager.prototype.dispose = function dispose() {                                      // 37
    if (this.computation) {                                                                       // 45
      this.computation.stop();                                                                    // 46
      this.computation = null;                                                                    // 47
    }                                                                                             //
  };                                                                                              //
                                                                                                  //
  MeteorDataManager.prototype.calculateData = function calculateData() {                          // 37
    var component = this.component;                                                               // 52
    var props = component.props;                                                                  //
    var state = component.state;                                                                  //
                                                                                                  //
                                                                                                  //
    if (!component.getMeteorData) {                                                               // 55
      return null;                                                                                // 56
    }                                                                                             //
                                                                                                  //
    // When rendering on the server, we don't want to use the Tracker.                            //
    // We only do the first rendering on the server so we can get the data right away             //
    if (Meteor.isServer) {                                                                        // 51
      return component.getMeteorData();                                                           // 62
    }                                                                                             //
                                                                                                  //
    if (this.computation) {                                                                       // 65
      this.computation.stop();                                                                    // 66
      this.computation = null;                                                                    // 67
    }                                                                                             //
                                                                                                  //
    var data = void 0;                                                                            // 70
    // Use Tracker.nonreactive in case we are inside a Tracker Computation.                       //
    // This can happen if someone calls `React.render` inside a Computation.                      //
    // In that case, we want to opt out of the normal behavior of nested                          //
    // Computations, where if the outer one is invalidated or stopped,                            //
    // it stops the inner one.                                                                    //
    this.computation = Tracker.nonreactive(function () {                                          // 51
      return Tracker.autorun(function (c) {                                                       // 77
        if (c.firstRun) {                                                                         // 78
          var savedSetState = component.setState;                                                 // 79
          try {                                                                                   // 80
            component.setState = function () {                                                    // 81
              throw new Error("Can't call `setState` inside `getMeteorData` as this could cause an endless" + " loop. To respond to Meteor data changing, consider making this component" + " a \"wrapper component\" that only fetches data and passes it in as props to" + " a child component. Then you can use `componentWillReceiveProps` in that" + " child component.");
            };                                                                                    //
                                                                                                  //
            data = component.getMeteorData();                                                     // 90
          } finally {                                                                             //
            component.setState = savedSetState;                                                   // 92
          }                                                                                       //
        } else {                                                                                  //
          // Stop this computation instead of using the re-run.                                   //
          // We use a brand-new autorun for each call to getMeteorData                            //
          // to capture dependencies on any reactive data sources that                            //
          // are accessed.  The reason we can't use a single autorun                              //
          // for the lifetime of the component is that Tracker only                               //
          // re-runs autoruns at flush time, while we need to be able to                          //
          // re-call getMeteorData synchronously whenever we want, e.g.                           //
          // from componentWillUpdate.                                                            //
          c.stop();                                                                               // 103
          // Calling forceUpdate() triggers componentWillUpdate which                             //
          // recalculates getMeteorData() and re-renders the component.                           //
          component.forceUpdate();                                                                // 94
        }                                                                                         //
      });                                                                                         //
    });                                                                                           //
                                                                                                  //
    if (Package.mongo && Package.mongo.Mongo) {                                                   // 111
      Object.keys(data).forEach(function (key) {                                                  // 112
        if (data[key] instanceof Package.mongo.Mongo.Cursor) {                                    // 113
          console.warn("Warning: you are returning a Mongo cursor from getMeteorData. This value " + "will not be reactive. You probably want to call `.fetch()` on the cursor " + "before returning it.");
        }                                                                                         //
      });                                                                                         //
    }                                                                                             //
                                                                                                  //
    return data;                                                                                  // 122
  };                                                                                              //
                                                                                                  //
  MeteorDataManager.prototype.updateData = function updateData(newData) {                         // 37
    var component = this.component;                                                               // 126
    var oldData = this.oldData;                                                                   // 127
                                                                                                  //
    if (!(newData && (typeof newData === "undefined" ? "undefined" : (0, _typeof3["default"])(newData)) === 'object')) {
      throw new Error("Expected object returned from getMeteorData");                             // 130
    }                                                                                             //
    // update componentData in place based on newData                                             //
    for (var key in newData) {                                                                    // 125
      component.data[key] = newData[key];                                                         // 134
    }                                                                                             //
    // if there is oldData (which is every time this method is called                             //
    // except the first), delete keys in newData that aren't in                                   //
    // oldData.  don't interfere with other keys, in case we are                                  //
    // co-existing with something else that writes to a component's                               //
    // this.data.                                                                                 //
    if (oldData) {                                                                                // 125
      for (var _key in oldData) {                                                                 // 142
        if (!(_key in newData)) {                                                                 // 143
          delete component.data[_key];                                                            // 144
        }                                                                                         //
      }                                                                                           //
    }                                                                                             //
    this.oldData = newData;                                                                       // 148
  };                                                                                              //
                                                                                                  //
  return MeteorDataManager;                                                                       //
}();                                                                                              //
////////////////////////////////////////////////////////////////////////////////////////////////////

}]}}}},{"extensions":[".js",".json",".jsx"]});
require("./node_modules/meteor/react-meteor-data/meteor-data-mixin.jsx");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['react-meteor-data'] = {}, {
  ReactMeteorData: ReactMeteorData
});

})();
