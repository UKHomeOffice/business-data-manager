'use strict'

/* eslint func-names: 0 */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const queryStub = sinon.stub().resolves({ rowCount: 1 })

const dbStub = {
  query: queryStub,
}

const Items = proxyquire('../../models/items', { '../db': dbStub })

describe('Items Model', function () {
  const datasetTypeList = [
    { name: 'firstName', datatype: 'VARCHAR' },
    { name: 'age', datatype: 'INTEGER' },
  ]

  describe('Search', () => {
    it('should generate a valid search query with pagination params for a single varchar column search', () => {
      let items = new Items('foo')
      const query = items.searchQuery({ firstName: { searchParam: 'Shinobu', columnType: 'VARCHAR' } }, datasetTypeList, false, 5, 10)
      expect(query.text)
        .to
        .equal('SELECT * , count(*) OVER() AS _total_count FROM foo WHERE LOWER("firstName") LIKE LOWER($1) ORDER BY 1  LIMIT 10 OFFSET 5')
      expect(query.values).to.have.length(1)
    })

    it('should generate a valid search query with pagination params for a single integer column search', () => {
      let items = new Items('foo')
      const query = items.searchQuery({ age: { searchParam: 29, columnType: 'INTEGER' } }, datasetTypeList, false, 10, 5)
      expect(query.text)
        .to
        .equal('SELECT * , count(*) OVER() AS _total_count FROM foo WHERE "age" = $1 ORDER BY 1  LIMIT 5 OFFSET 10')
      expect(query.values).to.have.length(1)
    })

    it('should generate a valid search query with pagination params for a varchar and integer column search', () => {
      let items = new Items('foo')
      const query = items.searchQuery({
        age: { searchParam: 29, columnType: 'INTEGER' },
        firstName: { searchParam: 'Shinobu', columnType: 'VARCHAR' }
      }, datasetTypeList, false, 5, 5)
      expect(query.text)
        .to
        .equal('SELECT * , count(*) OVER() AS _total_count FROM foo WHERE "age" = $1 AND LOWER("firstName") LIKE LOWER($2) ORDER BY 1  LIMIT 5 OFFSET 5')
      expect(query.values).to.have.length(2)
    })

    it('should generate a valid search query without pagination params for a single integer column search', () => {
      let items = new Items('foo')
      const query = items.searchQuery({ age: { searchParam: 29, columnType: 'INTEGER' } }, datasetTypeList, true)
      expect(query.text)
        .to
        .equal('SELECT *  FROM foo WHERE "age" = $1 ORDER BY 1 ')
      expect(query.values).to.have.length(1)
    })
  })
})
