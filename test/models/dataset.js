'use strict'

/* eslint func-names: 0 */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

const Dataset = require('../../models/dataset')

describe('Dataset Model', function () {
  it('should not find the table foobarbaz', function () {
    const dataset = new Dataset('foobarbaz')
    const expectation = { statusCode: '404', message: 'Not found' }
    return expect(dataset.checkIfExists()).to.eventually.deep.equal(expectation)
  })

  it('should make a valid CREATE TABLE query', function () {
    const fields = [{ name: 'bar', datatype: 'VARCHAR' },
      { name: 'baz', datatype: 'INTEGER', notNull: 'Yes' }
    ]
    const dataset = new Dataset('foo', 'SERIAL', fields)
    const createTableQuery = dataset.createTableQuery()
    const expectation = 'CREATE TABLE foo ( id SERIAL PRIMARY KEY, ' +
                      '"bar" VARCHAR, "baz" INTEGER NOT NULL );'
    expect(createTableQuery).to.equal(expectation)
  })

  it('should make a valid REGISTER DATASET query', function () {
    const fields = [{ name: 'bar', datatype: 'VARCHAR' },
      { name: 'baz', datatype: 'INTEGER', notNull: 'Yes' }
    ]
    const dataset = new Dataset('foo', 'SERIAL', fields)
    const registerDatasetQuery = dataset.registerDatasetQuery()
    const expectation = {
      text: 'INSERT INTO datasets (name, idtype, fields) VALUES ($1, $2, $3)',
      values: ['foo', 'SERIAL', JSON.stringify([{ name: 'bar', datatype: 'VARCHAR' },
        { name: 'baz', datatype: 'INTEGER', notNull: 'Yes' }
      ])],
    }
    expect(registerDatasetQuery).to.deep.equal(expectation)
  })

  it('should make a valid ALTER DATASET query', function () {
    const fields = [{ name: 'baz', datatype: 'VARCHAR', notNull: 'Yes' }]
    const dataset = new Dataset('foo', 'SERIAL', fields)
    const registerDatasetQueryString = dataset.addPropertyQueryString()
    const expectation = 'ALTER TABLE IF EXISTS foo ADD COLUMN "baz" VARCHAR NOT NULL;'
    expect(registerDatasetQueryString).to.equal(expectation)
  })
})
