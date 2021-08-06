'use strict'

const db = require('../db')
const logger = require('../logger')

/**
 * Provides an interface to the collection of Dataset resources.
 *
 */
class Datasets {
  dbChecks () {
    return new Promise((resolve, reject) => {
      logger.info('Running database checks')
      this.checkSessionTable()
        .then(result => {
          if (result.statusCode === '200') {
            return resolve(this.checkDatasetsTable())
          }
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  checkSessionTable () {
    return new Promise((resolve, reject) => {
      logger.info('Checking for session table')
      const queryString = 'SELECT to_regclass(\'session\');'
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          if (result.rows[0].to_regclass === null) {
            return resolve(this.createSessionTable())
          }
          const msg = { statusCode: '200', message: 'OK' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  createSessionTable () {
    return new Promise((resolve, reject) => {
      const queryString = `CREATE TABLE "session" (
                          "sid" varchar NOT NULL COLLATE "default",
                          "sess" json NOT NULL,
                          "expire" timestamp(6) NOT NULL
                         )
                         WITH (OIDS=FALSE);
                         ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          if (result.command === 'CREATE') {
            logger.info('The sessions table has been created')
            const msg = { statusCode: '200', message: 'OK' }
            return resolve(msg)
          }
          return reject(result)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  checkDatasetsTable () {
    return new Promise((resolve, reject) => {
      logger.info('Checking for datasets table')
      const queryString = 'SELECT to_regclass(\'datasets\');'
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          if (result.rows[0].to_regclass === null) {
            return resolve(this.createDatasetsTable())
          }
          return resolve(this.alterDatasetTable())
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  alterDatasetTable () {
    return new Promise((resolve, reject) => {
      logger.info('Updating datasets table')
      let queryString = 'alter table datasets add column if not exists org varchar;'
      this.findAll().then(result => {
        result.data.forEach(dataset => {
          queryString += `
                alter table ${dataset.name} add column if not exists created_at timestamp default current_timestamp;
                alter table ${dataset.name} add column if not exists updated_at timestamp;
                alter table ${dataset.name} add column if not exists created_by varchar;
                alter table ${dataset.name} add column if not exists updated_by varchar;`
        })
        logger.debug(queryString)
        db.query(queryString)
          .then(result => {
            const msg = { statusCode: '200', message: 'OK' }
            return resolve(msg)
          })
          .catch(err => {
            logger.error(err)
            return reject(err)
          })
      })
    })
  }

  createDatasetsTable () {
    return new Promise((resolve, reject) => {
      const queryString = 'CREATE TABLE datasets ( ' +
                        'name varchar NOT NULL PRIMARY KEY, ' +
                        'idtype varchar NOT NULL, ' +
                        'fields jsonb NOT NULL, ' +
                        'org varchar );'
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          if (result.command === 'CREATE') {
            logger.info('The dataset table has been created')
            const msg = { statusCode: '200', message: 'OK' }
            return resolve(msg)
          }
          return reject(result)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  findAll () {
    return new Promise((resolve, reject) => {
      const queryString = 'SELECT * FROM datasets;'
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          const datasets = []
          if (result.rows.length > 0) {
            logger.info('Processing datasets')
            for (let i = 0; i < result.rows.length; i++) {
              const dataset = {
                name: result.rows[i].name,
                idType: result.rows[i].idtype,
                fields: result.rows[i].fields,
                org: result.rows[i].org
              }
              datasets.push(dataset)
            }
          }
          const msg = { statusCode: '200', message: 'OK', data: datasets }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }
}

module.exports = Datasets
