'use strict';

const pg = require('pg');

const config = require('./config');

const pool = new pg.Pool({
  user: config.pg.user,
  host: config.pg.host,
  database: config.pg.database,
  password: config.pg.password,
  port: config.pg.port,
});

module.exports = pool;
