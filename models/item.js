'use strict'

const logger = require('../logger')
const db = require('../db')

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
  constructor (datasetName, itemId, properties = []) {
    this.datasetName = datasetName
    this.itemId = itemId
    this.properties = properties
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
              const property = {
                field: result.fields[i].name,
                value: result.rows[0][result.fields[i].name],
                columnType: this._columnIdToType(result.fields[i].dataTypeID)
              }
              properties.push(property)
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
    for (const key in this.properties) {
      if (key !== '_csrf') {
        fields += `"${key}", `
        this.properties[key] === '' ? values.push(null) : values.push(`${this.properties[key]}`)
      }
    }
    fields = fields.slice(0, -2)

    let valueRefs = ''
    for (let paramNumber = 1; paramNumber < values.length + 1; paramNumber++) {
      valueRefs += '$' + paramNumber + ', '
    };
    valueRefs = valueRefs.slice(0, -2)
    const queryText = `INSERT INTO ${this.datasetName} (${fields}) VALUES (${valueRefs}) RETURNING id`
    const query = {
      text: queryText,
      values: values,
    }
    return query
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
      1082: 'DATE'
    }
    return idValueMap[columnId]
  }
}

module.exports = Item
