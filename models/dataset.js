'use strict'

const db = require('../db')
const logger = require('../logger')

/**
 * Provides an interface to singular Dataset resources.
 *
 * @param {String} name - name of the dataset, used to name the table
 * @param {String} idType - the datatype for the Id field must be one of ['SERIAL', 'VARCHAR', 'INTEGER']
 * @param {Array} fields - (optional) array of {key: value} pairs that can represent
 *                         the following properties: name, datatype, primaryKey, notNull, unique
 *
 */
class Dataset {
  /**
   * The constructor only creates the object in memory, it doesn't create
   * the dataset in the database storage; this requires a subsequent call to
   * create the data structure. This ensures that the data structures aren't
   * touched every time that the class is instanciated.
   */
  constructor (name, idType, fields = [], org = null, versioned = false) {
    this.name = name
    this.idType = idType
    this.fields = fields
    this.org = org
    this.versioned = versioned
  }

  checkIfExists () {
    return new Promise((resolve, reject) => {
      const query = {
        text: 'SELECT to_regclass($1)',
        values: [this.name],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          if (result.rows[0].to_regclass === null) {
            const msg = { statusCode: '404', message: 'Not found' }
            return resolve(msg)
          }
          const msg = { statusCode: '302', message: 'Found' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  createTableQuery () {
    let query = ''
    if (this.versioned) {
      query += `CREATE SEQUENCE ${this.name}_version_id_seq;`
    }
    query += `CREATE TABLE ${this.name} (`
    query += ` id ${this.idType} PRIMARY KEY`
    if (this.versioned) {
      query += `, 
      version_id SMALLINT NOT NULL DEFAULT nextval('${this.name}_version_id_seq'),
      is_current SMALLINT DEFAULT 1,
      version SMALLINT NOT NULL DEFAULT 1,
      CONSTRAINT version_current_unique UNIQUE (version_id, is_current)`
    }
    for (let i = 0; i < this.fields.length; i++) {
      query += `, "${this.fields[i].name}" ${this.fields[i].datatype}`
      if (this.fields[i].notNull === 'Yes') {
        query += ' NOT NULL'
      }
      if (this.fields[i].unique === 'Yes') {
        if (this.versioned) {
          query += `,
          CONSTRAINT ${this.fields[i].name}_current_unique UNIQUE (${this.fields[i].name}, is_current)`
        } else {
          query += ' UNIQUE'
        }
      }
    }
    query += `, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP, 
    created_by VARCHAR, 
    updated_by VARCHAR`
    query += ' );'
    return query
  }

  createTable () {
    return new Promise((resolve, reject) => {
      const queryString = this.createTableQuery()
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          // check that result is as expected for a successful create
          logger.verbose(`New Dataset table created for ${this.name}`)
          const msg = { statusCode: '200', message: 'OK' }
          return resolve(msg)
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  registerDatasetQuery () {
    // build the query to register the dataset
    const query = {
      text: 'INSERT INTO datasets (name, idtype, fields, org, virsioned) VALUES ($1, $2, $3, $4, $5)',
      values: [this.name, this.idType, JSON.stringify(this.fields), this.org, this.versioned],
    }
    return query
  }

  registerDataset () {
    return new Promise((resolve, reject) => {
      const query = this.registerDatasetQuery()
      logger.debug(query)
      db.query(query)
        .then(result => {
          // check that result is as expected for a successful create or throw an error/warning
          logger.verbose(`New Dataset registered for ${this.name}`)
          const msg = { statusCode: '200', message: 'OK' }
          return resolve(msg)
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  unregisterDatasetQuery () {
    // build the query to register the dataset
    const query = {
      text: 'DELETE FROM datasets WHERE name = $1',
      values: [this.name],
    }
    return query
  }

  unregisterDataset () {
    return new Promise((resolve, reject) => {
      const query = this.unregisterDatasetQuery()
      logger.debug(query)
      db.query(query)
        .then(result => {
          // check that result is as expected for a successful create or throw an error/warning
          // result.command === 'DELETE'
          logger.verbose(`Dataset unregistered for ${this.name}`)
          const msg = { statusCode: '200', message: 'OK' }
          return resolve(msg)
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  dropTable () {
    return new Promise((resolve, reject) => {
      const queryString = `DROP TABLE IF EXISTS ${this.name};`
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          // check the result
          // result.command === 'DROP'
          logger.verbose(`Removed table for ${this.name} dataset`)
          const msg = { statusCode: '200', message: 'OK' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  findOne () {
    return new Promise((resolve, reject) => {
      const queryString = `SELECT name, idtype, fields FROM datasets WHERE name = '${this.name}';`
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          if (result.rows.length === 1) {
            logger.verbose(`Processing info for ${this.name}`)
            const dataset = {
              name: result.rows[0].name,
              idType: result.rows[0].idtype,
              fields: result.rows[0].fields
            }
            const msg = { statusCode: '200', message: 'OK', data: dataset }
            return resolve(msg)
          }
          logger.verbose(`The requested dataset (${this.name}) doesn't exist`)
          const msg = { statusCode: '404', message: 'NOT FOUND' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  checkIfPropertyExists () {
    // grab the current fields and append them to this.fields[]
    // this makes them available in memory for the next functions
    // return 302 Found or 404 Not found
    return new Promise((resolve, reject) => {
      const queryString = `SELECT fields FROM datasets WHERE name = '${this.name}';`
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          for (let i = 0; i < result.rows[0].fields.length; i++) {
            this.fields.push(result.rows[0].fields[i])
          }
          for (let j = 1; j < this.fields.length; j++) {
            // console.log(`Comparing ${this.fields[0].name} to ${this.fields[j].name}`);
            if (this.fields[0].name === this.fields[j].name) {
              logger.verbose(`The property ${this.fields[0].name} already exists`)
              const msg = { statusCode: '302', message: 'Found' }
              return resolve(msg)
            }
          }
          logger.verbose(`The property ${this.fields[0].name} does not exist in the ${this.name} dataset`)
          const msg = { statusCode: '404', message: 'Not found' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  updateDataset () {
    return new Promise((resolve, reject) => {
      const query = {
        text: 'UPDATE datasets SET versioned = true WHERE name = $1',
        values: [this.name],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          logger.verbose(`Set ${this.name} dataset to versioned`)
          const msg = { statusCode: '200', message: 'Updated' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  versionQuery () {
    let query = `CREATE SEQUENCE ${this.name}_version_id_seq;
    ALTER TABLE IF EXISTS ${this.name} 
    ADD COLUMN IF NOT EXISTS version_id SMALLINT NOT NULL DEFAULT nextval('${this.name}_version_id_seq'),
    ADD COLUMN IF NOT EXISTS is_current SMALLINT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS version SMALLINT NOT NULL DEFAULT 1,
    DROP CONSTRAINT IF EXISTS version_current_unique,
    ADD CONSTRAINT version_current_unique UNIQUE (version_id, is_current)`
    for (let i = 0; i < this.fields.length; i++) {
      if (this.fields[i].unique === 'Yes') {
        query += `,
        DROP CONSTRAINT IF EXISTS ${this.fields[0].name}_current_unique,
        ADD CONSTRAINT ${this.fields[0].name}_current_unique UNIQUE (${this.fields[i].name}, is_current),
        DROP CONSTRAINT IF EXISTS ${this.name}_${this.fields[0].name}_key`
      }
    }
    query += ';'
    return query
  }

  versionTable () {
    return new Promise((resolve, reject) => {
      if (!this.versioned) {
        return resolve({ statusCode: '422', message: 'Table is not versioned' })
      }
      const queryString = this.versionQuery()
      console.log(queryString)
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          this.updateDataset()
            .then(r => {
              logger.verbose(`Set ${this.name} dataset to versioned`)
              const msg = { statusCode: '200', message: 'Updated' }
              return resolve(msg)
            })
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  addPropertyQueryString () {
    let alterTableQuery = `ALTER TABLE IF EXISTS ${this.name} ADD COLUMN`
    alterTableQuery += ` "${this.fields[0].name}" ${this.fields[0].datatype}`
    if (this.fields[0].notNull === 'Yes') {
      alterTableQuery += ' NOT NULL'
    }
    if (this.fields[0].unique === 'Yes') {
      if (this.versioned) {
        alterTableQuery += `,
        ADD CONSTRAINT IF NOT EXISTS ${this.fields[0].name}_current_unique UNIQUE (${this.fields[0].name}, is_current);`
      } else {
        alterTableQuery += ' UNIQUE'
      }
    }
    alterTableQuery += ';'
    return alterTableQuery
  }

  addPropertyToTable () {
    // alter table to add this.fields[0]
    // if it fails return 422
    // if it succeeds return 201
    return new Promise((resolve, reject) => {
      const queryString = this.addPropertyQueryString()
      logger.debug(queryString)
      db.query(queryString)
        .then(result => {
          logger.verbose(`Added property to ${this.name} table`)
          const msg = { statusCode: '201', message: 'Created' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  registerProperty () {
    // register property for this.fields[0]
    // if it fails return 422
    // if it succeeds return 201
    return new Promise((resolve, reject) => {
      const query = {
        text: 'UPDATE datasets SET fields = $1 WHERE name = $2',
        values: [JSON.stringify(this.fields), this.name],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          logger.verbose(`Added property to ${this.name} table`)
          const msg = { statusCode: '201', message: 'Created' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  /**
   * Returns the dataset's idType.
   *
   * @returns {Object} Returns key:value pairs for statusCode, message and data (optional)
   *
   */
  getIdType () {
    return new Promise((resolve, reject) => {
      const query = {
        text: 'SELECT idtype FROM datasets WHERE name = $1',
        values: [this.name],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          if (result.rowCount === 1) {
            const msg = { statusCode: '200', message: 'OK', data: result.rows[0].idtype }
            return resolve(msg)
          }
          logger.verbose(`The dataset ${this.datasetName} does not exist`)
          const msg = { statusCode: '422', message: 'Unprocessable Entity' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  post () {
    return new Promise((resolve, reject) => {
      // check if the dataset already exists (ie. there's a table and it's registered)
      this.checkIfExists()
        .then(tableExists => {
          if (tableExists.statusCode === '302') {
            if (this.versioned) {
              this.versionTable()
                .then(versionResult => {
                  if (versionResult.statusCode === '200') {
                    const msg = { statusCode: '200', message: 'Dataset versioning added' }
                    return resolve(msg)
                  }
                })
            }
            const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
            return resolve(msg)
          }
          this.registerDataset()
            .then(registrationResult => {
              if (registrationResult.statusCode === '422') {
                const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                return resolve(msg)
              }
              this.createTable()
                .then(creationResult => {
                  if (creationResult.statusCode === '422') {
                    const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                    return resolve(msg)
                  }
                  const msg = { statusCode: '201', message: 'CREATED' }
                  return resolve(msg)
                })
            })
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  get () {
    return new Promise((resolve, reject) => {
      this.findOne()
        .then(result => {
          if (result.statusCode === '200') {
            return resolve(result)
          }
          return resolve(result)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  delete () {
    return new Promise((resolve, reject) => {
      this.unregisterDataset()
        .then(unregistrationResult => {
          if (unregistrationResult.statusCode === '422') {
            const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
            return resolve(msg)
          }
          this.dropTable()
            .then(dropResult => {
              if (dropResult.statusCode === '422') {
                const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                return resolve(msg)
              }
              const msg = { statusCode: '200', message: 'OK' }
              return resolve(msg)
            })
            .catch(err => {
              logger.error(err)
              return reject(err)
            })
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  postProperty () {
    return new Promise((resolve, reject) => {
      // check if the dataset already exists (ie. there's a table and it's registered)
      this.checkIfPropertyExists()
        .then(propertyExists => {
          logger.verbose('postProperty has checked if the property already exists')
          if (propertyExists.statusCode === '302') {
            const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
            return resolve(msg)
          }
          this.registerProperty()
            .then(registrationResult => {
              if (registrationResult.statusCode === '422') {
                logger.verbose('postProperty failed to registered the property')
                const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                return resolve(msg)
              }
              logger.verbose('postProperty has registered the property')
              this.addPropertyToTable()
                .then(addPropertyResult => {
                  if (addPropertyResult.statusCode === '422') {
                    logger.verbose('postProperty failed to alter the table')
                    const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                    return resolve(msg)
                  }
                  logger.verbose('postProperty has altered the table')
                  const msg = { statusCode: '201', message: 'CREATED' }
                  return resolve(msg)
                })
                .catch(err => {
                  logger.error(err)
                  return reject(err)
                })
            })
            .catch(err => {
              logger.error(err)
              return reject(err)
            })
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }
}

module.exports = Dataset
