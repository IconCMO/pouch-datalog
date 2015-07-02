/*jshint expr:true,multistr:true */
'use strict';

var Pouch = require('pouchdb');

//
// your plugin goes here
//
var dataqueryPlugin = require('../');
Pouch.plugin(dataqueryPlugin);

var chai = require('chai');
chai.use(require("chai-as-promised"));

//
// more variables you might want
//
chai.should(); // var should = chai.should();
require('bluebird'); // var Promise = require('bluebird');

var dbs;
if (process.browser) {
  dbs = 'testdb' + Math.random() +
    ',http://localhost:5984/testdb' + Math.round(Math.random() * 100000);
} else {
  dbs = process.env.TEST_DB;
}

dbs.split(',').forEach(function (db) {
  var dbType = /^http/.test(db) ? 'http' : 'local';
  tests(db, dbType);
});

function tests(dbName, dbType) {

  var db;

  beforeEach(function (done) {
    db = new Pouch(dbName);
    db.put({
      _id: "1",
      label: "last_name",
      value: "benson"
    }).then(function () {
      return db.put({
        _id: "_design/eav",
        language: "javascript",
        views: {
          eav: {
            map: "function(doc) {\n\
              emit([doc._id,doc.label,doc.value],[doc._id,doc.label,doc.value]);\n\
            }"
          }
        }
      });
    }).then(function () {
      return db.put({
        _id: "_design/ave",
        language: "javascript",
        views: {
          ave: {
            map: "function(doc) {\n\
              emit([doc.label,doc.value,doc._id],[doc._id,doc.label,doc.value]);\n\
            }"
          }
        }
      });
    }).then(function () {
      done();
    });
  });
  afterEach(function () {
    return Pouch.destroy(dbName);
  });
  describe(dbType + ': dataquery test suite', function () {
    it('should have a dataquery method', function (done) {
      db.dataquery('[:find ?id \
                            :in \
                            :where [?id "last_name" "benson"]]').then(function (response) {
        response.should.eql([['1']]);
        done();
      }).catch(function (err) {
        console.error(err);
      });
    });
  });
}
