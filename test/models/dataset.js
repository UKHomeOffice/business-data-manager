'use strict';

/* eslint func-names: 0*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const Dataset = require('../../models/dataset');

describe('Dataset Model', function() {
  it('should not find the table foobarbaz', function() {
    let dataset = new Dataset('foobarbaz');
    let expectation = {statusCode: '404', message: 'Not found'};
    return expect(dataset.checkIfExists()).to.eventually.deep.equal(expectation);
  });

  it('should make a valid CREATE TABLE query string', function() {
    let fields = [{name: 'bar', datatype: 'VARCHAR'},
                  {name: 'baz', datatype: 'INTEGER', notNull: 'Yes'}
                 ];
    let dataset = new Dataset('foo', 'SERIAL', fields);
    let createTableQuery = dataset.createTableQueryString();
    let expectation = 'CREATE TABLE foo ( id SERIAL PRIMARY KEY, ' +
                      '"bar" VARCHAR, "baz" INTEGER NOT NULL );';
    expect(createTableQuery).to.equal(expectation);
  });

  it('should make a valid REGISTER DATASET query string', function() {
    let fields = [{name: 'bar', datatype: 'VARCHAR'},
                  {name: 'baz', datatype: 'INTEGER', notNull: 'Yes'}
                 ];
    let dataset = new Dataset('foo', 'SERIAL', fields);
    let registerDatasetQueryString = dataset.registerDatasetQueryString();
    let expectation = 'INSERT INTO datasets (name, idtype, fields) VALUES ' +
                      '(\'foo\', \'SERIAL\', \'[' +
                      '{"name":"bar","datatype":"VARCHAR"},' +
                      '{"name":"baz","datatype":"INTEGER","notNull":"Yes"}]\');';
    expect(registerDatasetQueryString).to.equal(expectation);
  });

  it('should make a valid ALTER DATASET query string', function() {
    let fields = [{name: 'baz', datatype: 'VARCHAR', notNull: 'Yes'}];
    let dataset = new Dataset('foo', 'SERIAL', fields);
    let registerDatasetQueryString = dataset.addPropertyQueryString();
    let expectation = 'ALTER TABLE IF EXISTS foo ADD COLUMN "baz" VARCHAR NOT NULL;';
    expect(registerDatasetQueryString).to.equal(expectation);
  });

});
