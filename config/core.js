'use strict'

/* eslint no-process-env: 0 */
/* eslint no-inline-comments: 0 */
/* eslint camelcase: 0 */

module.exports = {
  env: process.env.NODE_ENV || 'dev',
  logLevel: process.env.LOG_LEVEL || 'info',
  name: process.env.NAME || 'business-data-manager',
  pg: {
    user: process.env.PGUSER || 'bdm',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'bdm',
    password: process.env.PGPASSWORD || '',
    port: process.env.PGPORT || 5432
  },
  port: process.env.PORT || 8080,
  sessionSecret: process.env.SESSION_SECRET || 'anotverysecretsecretthing',
  title: process.env.TITLE || 'Business Data Manager',
}
