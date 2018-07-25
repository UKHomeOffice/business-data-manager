'use strict'

/* eslint func-names: 0 */

const chai = require('chai')
const expect = chai.expect

const config = require('../config/core')

describe('The config set up', function () {
  it('should have set the 7 config values', function (done) {
    expect(config).to.have.property('env')
    expect(config).to.have.property('logLevel')
    expect(config).to.have.property('name')
    expect(config).to.have.property('pg')
    expect(config).to.have.property('port')
    expect(config).to.have.property('sessionSecret')
    expect(config).to.have.property('title')
    done()
  })
})
