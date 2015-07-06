'use strict';

var utils = require('./pouch-utils');
var datascript = require('../datascript/release-js/datascript.js');

exports.dataquery = utils.toPromise(function (query, dataquery_callback) {
  var self = this;
  var searchPouchIndex = function (db, index) {
    return function (startkey, endkey, index_callback) {
      var view = index + "/" + index;
      if (index === "eav") {
        startkey = [startkey.e, startkey.a, startkey.v];
        endkey = [endkey.e, endkey.a, endkey.v];
      } else if (index === "ave") {
        startkey = [startkey.a, startkey.v, startkey.e];
        endkey = [endkey.a, endkey.v, endkey.e];
      }
      endkey = endkey.map(function (el) {
        if (el === null) {
          return {};
        }
        return el;
      });
      return db.query(view, {
        startkey: startkey,
        endkey: endkey
      }).then(function (data) {
        var result = data.rows.map(function (el) {
          return el.value;
        });
        index_callback(result);
      }).catch(function (error) {
        console.error("An error occured.", error);
      });
    };
  };

  var db = datascript.set_indexes(searchPouchIndex(self, "eav"), searchPouchIndex(self, "ave"));

  return datascript.q(function (err, data) {
    if (err) {
      return err;
    }
    return dataquery_callback(null, data);
  }, query, db);
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
