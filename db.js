'use strict'

const pg = require('pg')
const fs = require('fs')
const production = process.env.NODE_ENV === 'production'

const config = require('./config/core')

const pool = new pg.Pool({
  user: config.pg.user,
  host: config.pg.host,
  database: config.pg.database,
  password: config.pg.password,
  port: config.pg.port,
  ssl: {
    rejectUnauthorized: production,
    ca: fs.readFileSync('./config/certs/eu-west-2-bundle.pem')
      .toString()
  }
})

module.exports = pool
