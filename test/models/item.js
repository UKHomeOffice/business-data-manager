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

const Item = proxyquire('../../models/item', { '../db': dbStub })

describe('Item Model', function () {
  it('should make a valid INSERT ITEM query object (for a dataset with SERIAL idType)', function () {
    let properties = {'bar': 'abc', 'baz': 123}
    let item = new Item('foo', null, properties)
    let result = item.insertItemQuery()
    let expectation = {
      text: 'INSERT INTO foo (bar, baz) VALUES ($1, $2) RETURNING id',
      values: ['abc', 123],
    }
    expect(result).to.deep.equal(expectation)
  })

  it('should make a valid INSERT ITEM query object (for a dataset with VARCHAR idType)', function () {
    let properties = {'id': 'xyz', 'bar': 'abc', 'baz': 123}
    let item = new Item('foo', 'VARCHAR', properties)
    let result = item.insertItemQuery()
    let expectation = {
      text: 'INSERT INTO foo (id, bar, baz) VALUES ($1, $2, $3) RETURNING id',
      values: ['xyz', 'abc', 123],
    }
    expect(result).to.deep.equal(expectation)
  })

  it('should generate a valid UPDATE query for a single field update', () => {
    let properties = { 'name': 'Asuka', 'surname': 'Langley' }
    let item = new Item('foo', null, properties)
    const query = item.updateItemQuery({ 'name': 'Oshino' })
    expect(query.text).to.equal('UPDATE foo SET name = $1 WHERE id = null')
    expect(query.values).to.include('Oshino')
  })

  it('should generate a valid UPDATE query for a multiple field update', () => {
    let properties = { 'name': 'Asuka', 'surname': 'Langley' }
    let item = new Item('foo', null, properties)
    const query = item.updateItemQuery({ 'name': 'Oshino', 'surname': 'Shinobu' })
    expect(query.text).to.equal('UPDATE foo SET name = $1, surname = $2 WHERE id = null')
    expect(query.values).to.include('Shinobu')
  })

  it('should return a 200 when an item successfully updates', (done) => {
    let properties = { 'name': 'Asuka', 'surname': 'Langley' }
    let item = new Item('foo', null, properties)
    item.update({ 'surname': 'Oshino' })
      .then((result) => {
        expect(result.statusCode).to.equal('200')
        done()
      })
  })

  it('should return a 404 when an item is not found', (done) => {
    let properties = { 'name': 'Asuka', 'surname': 'Langley' }
    let item = new Item('foo', null, properties)
    dbStub.query = sinon.stub().resolves({ rowCount: 0 })
    item.update({ 'surname': 'Oshino' })
      .then((result) => {
        expect(result.statusCode).to.equal('404')
        done()
      })
  })

  it('should reject a failed update query', (done) => {
    let properties = { 'name': 'Asuka', 'surname': 'Langley' }
    let item = new Item('foo', null, properties)
    dbStub.query = sinon.stub().rejects()
    item.update({})
      .catch(() => {
        done()
      })
  })
})

// `INSERT INTO ${datasetName} (id, [fields]) VALUES (DEFAULT, '${values go here}');`
// `INSERT INTO ${datasetName} ('${fields go here}') VALUES ('${values go here}');`
