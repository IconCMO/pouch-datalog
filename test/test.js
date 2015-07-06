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
    db.bulkDocs([
      {
        _id: "1",
        label: "last_name",
        value: "Benson"
      },
      {
        _id: "2",
        label: "first_name",
        value: "George"
      },
      {
        _id: "3",
        label: "last_name",
        value: "Henderson"
      },
      {
        _id: "4",
        label: "first_name",
        value: "george"
      }
    ]).then(function () {
      return db.put({
        _id: "_design/eav",
        language: "javascript",
        views: {
          eav: {
            map: "function(doc) { \
              emit([ \
                doc._id, doc.label.toLowerCase(), doc.value.toLowerCase() \
              ], [ \
                doc._id, doc.label, doc.value \
              ]); \
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
            map: "function(doc) { \
              emit([ \
                doc.label.toLowerCase(), doc.value.toLowerCase(), doc._id \
              ], [ \
                doc._id, doc.label, doc.value \
              ]); \
            }"
          }
        }
      });
    }).then(function () {
      done();
    });
  });
  afterEach(function () {
    return db.destroy();
  });
  describe(dbType + ': dataquery test suite', function () {
    it('should have a dataquery method that works', function (done) {
      db.dataquery('[:find ?id \
                            :in \
                            :where [?id "last_name" "Benson"]]').then(function (response) {
        response.should.eql([['1']]);
        done();
      }).catch(function (err) {
        console.error(err);
      });
    });
    it('case insensitivity works (if views are set up with lowercasing as above)', function (done) {
      db.dataquery('[:find ?id ?first_name \
                            :in \
                            :where [?id "first_name" "george"] \
                                   [?id "first_name" ?first_name]]').then(function (response) {
        response.should.eql([['2', 'George'], ['4', 'george']]);
        done();
      }).catch(function (err) {
        console.error(err);
      });
    });
  });
}
