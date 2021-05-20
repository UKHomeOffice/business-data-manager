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
  describe('INSERT', () => {
    it('should make a valid INSERT ITEM query object (for a dataset with SERIAL idType)', function () {
      const properties = { bar: 'abc', baz: 123 }
      const item = new Item('foo', null, properties)
      const result = item.insertItemQuery()
      const expectation = {
        text: 'INSERT INTO foo ("bar", "baz") VALUES ($1, $2) RETURNING id',
        values: ['abc', '123'],
      }
      expect(result).to.deep.equal(expectation)
    })
    it('should make a valid INSERT ITEM query object (for a dataset with VARCHAR idType)', function () {
      const properties = { id: 'xyz', bar: 'abc', baz: 123 }
      const item = new Item('foo', 'VARCHAR', properties)
      const result = item.insertItemQuery()
      const expectation = {
        text: 'INSERT INTO foo ("id", "bar", "baz") VALUES ($1, $2, $3) RETURNING id',
        values: ['xyz', 'abc', '123'],
      }
      expect(result).to.deep.equal(expectation)
    })
  })

  describe('UPDATE', () => {
    it('should generate a valid UPDATE query for a single field update', () => {
      const properties = { name: 'Asuka', surname: 'Langley' }
      const item = new Item('foo', null, properties)
      const query = item.updateItemQuery({ name: 'Oshino' })
      expect(query.text).to.equal('UPDATE foo SET "name" = $1 WHERE id = \'null\'')
      expect(query.values).to.include('Oshino')
    })
    it('should generate a valid UPDATE query for a multiple field update', () => {
      const properties = { name: 'Asuka', surname: 'Langley' }
      const item = new Item('foo', null, properties)
      const query = item.updateItemQuery({ name: 'Oshino', surname: 'Shinobu' })
      expect(query.text).to.equal('UPDATE foo SET "name" = $1, "surname" = $2 WHERE id = \'null\'')
      expect(query.values).to.include('Shinobu')
    })
    it('should return a 200 when an item successfully updates', (done) => {
      const properties = { name: 'Asuka', surname: 'Langley' }
      const item = new Item('foo', null, properties)
      item.update({ surname: 'Oshino' })
        .then((result) => {
          expect(result.statusCode).to.equal('200')
          done()
        })
    })
    it('should set empty fields to null when updating', () => {
      const properties = { name: 'Asuka', surname: '' }
      const item = new Item('foo', null, properties)
      const query = item.updateItemQuery({ name: '', surname: 'Shinobu' })
      expect(query.text).to.equal('UPDATE foo SET "name" = $1, "surname" = $2 WHERE id = \'null\'')
      expect(query.values).to.include(null)
    })
    it('should return a 404 when an item is not found', (done) => {
      const properties = { name: 'Asuka', surname: 'Langley' }
      const item = new Item('foo', null, properties)
      dbStub.query = sinon.stub().resolves({ rowCount: 0 })
      item.update({ surname: 'Oshino' })
        .then((result) => {
          expect(result.statusCode).to.equal('404')
          done()
        })
    })
    it('should reject a failed update query', (done) => {
      const properties = { name: 'Asuka', surname: 'Langley' }
      const item = new Item('foo', null, properties)
      dbStub.query = sinon.stub().rejects()
      item.update({})
        .catch(() => {
          done()
        })
    })
  })

  describe('DELETE', () => {
    it('should return a 200 on successful item deletion', (done) => {
      const item = new Item('foo', null, {})
      dbStub.query = sinon.stub().resolves({ rowCount: 1 })
      item.deleteItem()
        .then((result) => {
          expect(result.statusCode).to.equal('200')
          done()
        })
    })
    it('should return a 404 when attempting to delete a non-existant item', (done) => {
      const item = new Item('foo', null, {})
      dbStub.query = sinon.stub().resolves({ rowCount: 0 })
      item.deleteItem()
        .then((result) => {
          expect(result.statusCode).to.equal('404')
          done()
        })
    })
    it('should reject a failed delete query', (done) => {
      const item = new Item('foo', null, {})
      dbStub.query = sinon.stub().rejects()
      item.deleteItem()
        .catch(() => {
          done()
        })
    })
  })
})
