'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

const Dataset = require('../../models/dataset')

describe('Datasets Model', () => {
  it('should find the table doesn\'t exist', (done) => {
    let dataset = new Dataset('idontexist')
    let result = dataset.checkIfExists()
    expect(result).to.eventually.equal(false)
    done()
  })

  it('should make a valid CREATE TABLE query string', (done) => {
    // todo: createTableQuery needs modification to handle a different primary key
    let fields = [{name: 'port_name', datatype: 'varchar', primaryKey: 'True'},
      {name: 'country', datatype: 'json', notNull: 'True'}
    ]
    let dataset = new Dataset('ports', 'SERIAL', fields)
    let createTableQueryString = dataset.createTableQuery()
    expect(createTableQueryString).to.equal('CREATE TABLE ports ( id SERIAL PRIMARY KEY, "port_name" varchar, "country" json );')
    done()
  })
})
