'use strict'

const logger = require('../logger')
const db = require('../db')
const {escapeLiteral} = require('../lib/utils')

/**
 * Provides an interface to singular Item resources.
 *
 * @param {String} datasetName - name of the Dataset
 * @param {String} itemId - id of the Item (unique within the Dataset collection)
 * @param {Array} properties - (optional) array of {key: value} pairs
 *
 */
class Item {
  /**
   * The constructor only creates the object in memory, it doesn't create
   * the Item in the database storage; this requires a subsequent call to
   * create the data structure. This ensures that the data structures aren't
   * touched every time that the class is instanciated.
   */
  constructor (datasetName, itemId, properties = [], userId = '') {
    this.nonFields = [
      '_total_count'
    ]
    this.datasetName = datasetName
    this.itemId = itemId
    this.properties = properties
    this.userId = userId
  }

  /**
   * Given an object, for each key value pair update the associated entity's attribuets
   * @param {Object} updateObj An object with key, value pairs reflecting the updated values
   * @returns {Promise} Resolves with db response
   */
  async update (updateObj) {
    try {
      const query = this.updateItemQuery(updateObj)
      const dbResponse = await db.query(query)
      if (dbResponse.rowCount === 1) {
        logger.verbose(`Item id ${this.itemId} of ${this.datasetName} updated`)
        const msg = { statusCode: '200', message: 'UPDATED' }
        return msg
      }
      logger.verbose('The requested item does not exist')
      const msg = { statusCode: '404', message: 'NOT FOUND' }
      return msg
    } catch (err) {
      logger.error(`Failed to update item ${this.itemId} of ${this.datasetName}`)
      throw err
    }
  }

  /**
   * Given the updated data, build a sql parameterized query
   * @param {Object} updateObj An object with key, value pairs reflecting the updated values
   * @returns {Object} An object containing a prepared statement for the update query
   */
  updateItemQuery (updateObj) {
    const properties = Object.keys(updateObj)
    let updatePartial = ''
    const values = []

    // eslint-disable-next-line no-unused-vars
    for (const [index, val] of properties.entries()) {
      updatePartial += values.length !== 0 ? ', ' : ''
      updatePartial += `"${val}" = $${values.length + 1}`
      updateObj[val] === '' ? values.push(null) : values.push(updateObj[val])
    }
    updatePartial += `, "updated_at" = $${values.length + 1}`
    values.push('NOW()')
    updatePartial += `, "updated_by" = $${values.length + 1}`
    values.push(this.userId)

    return {
      text: `UPDATE ${this.datasetName} SET ${updatePartial} WHERE id = '${this.itemId}'`,
      values,
    }
  }

  findOne () {
    return new Promise((resolve, reject) => {
      const query = {
        text: `SELECT * FROM ${this.datasetName} WHERE id = $1`,
        values: [this.itemId],
      }
      db.query(query)
        .then(result => {
          if (result.rows.length === 1) {
            logger.verbose(`Getting properties for ${this.datasetName}.${this.itemId}`)
            // process fields and rows
            const properties = []
            for (let i = 0; i < result.fields.length; i++) {
              if (!this.nonFields.includes(result.fields[i].name)) {
                const property = {
                  field: result.fields[i].name,
                  value: result.rows[0][result.fields[i].name],
                  columnType: this._columnIdToType(result.fields[i].dataTypeID)
                }
                properties.push(property)
              }
            }
            const item = {
              datasetName: this.datasetName,
              itemId: this.itemId,
              properties: properties
            }
            const msg = { statusCode: '200', message: 'OK', data: item }
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

  checkIfItemExists () {
    return new Promise((resolve, reject) => {
      if (this.itemId === null) {
        logger.verbose(`The ${this.datasetName} dataset uses a serial id so the new item can be created`)
        const msg = { statusCode: '404', message: 'NOT FOUND' }
        return resolve(msg)
      }
      const query = {
        text: `SELECT id FROM ${this.datasetName} WHERE id = $1`,
        values: [this.itemId],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          if (result.rowCount === '1') {
            logger.verbose(`The item ${this.itemId} already exists in ${this.datasetName}`)
            const msg = { statusCode: '302', message: 'FOUND' }
            return resolve(msg)
          }
          logger.verbose(`The item ${this.itemId} does not exist in ${this.datasetName}`)
          const msg = { statusCode: '404', message: 'NOT FOUND' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  insertItemQuery () {
    let fields = ''
    const values = []
    console.log(this.properties)
    for (const key in this.properties) {
      if (key !== '_csrf' && this.properties[key] !== null) {
        let val = this.properties[key]
        if (typeof val === 'string') {
          val = escapeLiteral(val)
        }
        fields += `"${key}", `
        this.properties[key] === '' || this.properties[key] === null ? values.push('NULL') : values.push(val)
      }
    }
    fields += '"created_by"'
    values.push(`'${this.userId}'`)
    let currentQuery = ''
    if (this.properties.is_current && this.properties.version && this.properties.version_id) {
      currentQuery = `UPDATE ${this.datasetName} SET is_current = NULL WHERE version_id = ${this.properties.version_id};`
    }
    const queryText = `${currentQuery}INSERT INTO ${this.datasetName} (${fields}) VALUES (${values.join(',')}) RETURNING id`
    return queryText
  }

  insertItem () {
    return new Promise((resolve, reject) => {
      const query = this.insertItemQuery()
      logger.debug(query)
      db.query(query)
        .then(result => {
          // check that result is as expected for a successful create
          logger.verbose(`Item ${result.rows[0].id} added to ${this.datasetName} dataset`)
          const uri = `/v1/datasets/${this.datasetName}/items/${result.rows[0].id}`
          const msg = { statusCode: '201', message: 'CREATED', uri: uri, itemId: result.rows[0].id }
          return resolve(msg)
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(query)
          logger.error(err)
          return reject(err)
        })
    })
  }

  /**
   * Given the item's id, delete it from the dataset
   * @returns {Promise} Resolves with operation status code and message
   */
  async deleteItem () {
    try {
      const query = {
        text: `DELETE FROM ${this.datasetName} WHERE (id = $1) RETURNING id`,
        values: [this.itemId],
      }
      const dbResponse = await db.query(query)
      const uri = `/v1/datasets/${this.datasetName}/items`
      if (dbResponse.rowCount === 1) {
        logger.verbose(`Item ${this.itemId} deleted from ${this.datasetName} dataset`)
        const msg = { statusCode: '200', message: 'OK', uri }
        return msg
      }
      const msg = { statusCode: '404', message: 'NOT FOUND', uri }
      return msg
    } catch (err) {
      logger.error(`Failed to delete item ${this.itemId} of ${this.datasetName}`)
      throw err
    }
  }

  post () {
    // will need to return error 400 - for bad input causing queries to fail
    return new Promise((resolve, reject) => {
      // get params from this.
      this.checkIfItemExists()
        .then(itemExists => {
          if (itemExists.statusCode === '302') {
            const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
            return resolve(msg)
          }
          this.insertItem()
            .then(insertResult => {
              if (insertResult.statusCode === '422') {
                const msg = { statusCode: '422', message: 'UNPROCESSABLE ENTITY' }
                return resolve(msg)
              }
              return resolve(insertResult)
            })
            .catch((err) => {
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

  _columnIdToType (columnId) {
    const idValueMap = {
      1043: 'VARCHAR',
      23: 'INTEGER',
      1082: 'DATE',
      1700: 'NUMERIC',
      1114: 'TIMESTAMP'
    }
    return idValueMap[columnId]
  }
}

module.exports = Item
