'use strict'

/* eslint func-names: 0 */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

const Dataset = require('../../models/dataset')

describe('Dataset Model', function () {
  it('should not find the table foobarbaz', function () {
    let dataset = new Dataset('foobarbaz')
    let expectation = {statusCode: '404', message: 'Not found'}
    return expect(dataset.checkIfExists()).to.eventually.deep.equal(expectation)
  })

  it('should make a valid CREATE TABLE query', function () {
    let fields = [{name: 'bar', datatype: 'VARCHAR'},
      {name: 'baz', datatype: 'INTEGER', notNull: 'Yes'}
    ]
    let dataset = new Dataset('foo', 'SERIAL', fields)
    let createTableQuery = dataset.createTableQuery()
    let expectation = 'CREATE TABLE foo ( id SERIAL PRIMARY KEY, ' +
                      '"bar" VARCHAR, "baz" INTEGER NOT NULL );'
    expect(createTableQuery).to.equal(expectation)
  })

  it('should make a valid REGISTER DATASET query', function () {
    let fields = [{name: 'bar', datatype: 'VARCHAR'},
      {name: 'baz', datatype: 'INTEGER', notNull: 'Yes'}
    ]
    let dataset = new Dataset('foo', 'SERIAL', fields)
    let registerDatasetQuery = dataset.registerDatasetQuery()
    let expectation = {
      text: 'INSERT INTO datasets (name, idtype, fields) VALUES ($1, $2, $3)',
      values: ['foo', 'SERIAL', JSON.stringify([{name: 'bar', datatype: 'VARCHAR'},
        {name: 'baz', datatype: 'INTEGER', notNull: 'Yes'}
      ])],
    }
    expect(registerDatasetQuery).to.deep.equal(expectation)
  })

  it('should make a valid ALTER DATASET query', function () {
    let fields = [{name: 'baz', datatype: 'VARCHAR', notNull: 'Yes'}]
    let dataset = new Dataset('foo', 'SERIAL', fields)
    let registerDatasetQueryString = dataset.addPropertyQueryString()
    let expectation = 'ALTER TABLE IF EXISTS foo ADD COLUMN "baz" VARCHAR NOT NULL;'
    expect(registerDatasetQueryString).to.equal(expectation)
  })
})
