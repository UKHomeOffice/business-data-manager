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
  update (updateObj) {
    return new Promise((resolve, reject) => {
      const query = this.updateItemQuery(updateObj)
      logger.verbose(`Executing: ${JSON.stringify(query)}`)
      db.query(query)
        .then(result => {
          if (result.rowCount === 1) {
            logger.verbose(`Item id ${this.itemId} of ${this.datasetName} updated`)
            let msg = { statusCode: '200', message: 'UPDATED' }
            return resolve(msg)
          }
          logger.verbose(`The requested item does not exist`)
          let msg = { statusCode: '404', message: 'NOT FOUND' }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  /**
   * Given the updated data, build a sql query
   * @param {Object} updateObj An object with key, value pairs reflecting the updated values
   * @returns {Object} An object containing a prepared statement for the update query
   */
  updateItemQuery (updateObj) {
    const properties = Object.keys(updateObj)
    let updatePartial = ''
    const values = []

    for (let [index, val] of properties.entries()) {
      if (values.length !== 0) updatePartial += ', '
      updatePartial += `${val} = $${index + 1}`
      values.push(updateObj[val])
    }

    return {
      text: `UPDATE ${this.datasetName} SET ${updatePartial} WHERE id = ${this.itemId}`,
      values,
    }
  }

  findOne () {
    return new Promise((resolve, reject) => {
      let query = {
        text: `SELECT * FROM ${this.datasetName} WHERE id = $1`,
        values: [this.itemId],
      }
      db.query(query)
        .then(result => {
          if (result.rows.length === 1) {
            logger.verbose(`Getting properties for ${this.datasetName}.${this.itemId}`)
            // process fields and rows
            let properties = []
            for (let i = 0; i < result.fields.length; i++) {
              let property = {
                field: result.fields[i].name,
                value: result.rows[0][result.fields[i].name]
              }
              properties.push(property)
            }
            let item = {
              datasetName: this.datasetName,
              itemId: this.itemId,
              properties: properties
            }
            let msg = {statusCode: '200', message: 'OK', data: item}
            return resolve(msg)
          }
          logger.verbose(`The requested dataset (${this.name}) doesn't exist`)
          let msg = {statusCode: '404', message: 'NOT FOUND'}
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
        let msg = {statusCode: '404', message: 'NOT FOUND'}
        return resolve(msg)
      }
      let query = {
        text: `SELECT id FROM ${this.datasetName} WHERE id = $1`,
        values: [this.itemId],
      }
      logger.debug(query)
      db.query(query)
        .then(result => {
          if (result.rowCount === '1') {
            logger.verbose(`The item ${this.itemId} already exists in ${this.datasetName}`)
            let msg = {statusCode: '302', message: 'FOUND'}
            return resolve(msg)
          }
          logger.verbose(`The item ${this.itemId} does not exist in ${this.datasetName}`)
          let msg = {statusCode: '404', message: 'NOT FOUND'}
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
    let values = []
    for (let key in this.properties) {
      if (key !== '_csrf') {
        fields += `${key}, `
        values.push(this.properties[key])
      }
    }
    fields = fields.slice(0, -2)

    let valueRefs = ''
    for (let paramNumber = 1; paramNumber < values.length + 1; paramNumber++) {
      valueRefs += '$' + paramNumber + ', '
    };
    valueRefs = valueRefs.slice(0, -2)

    let queryText = `INSERT INTO ${this.datasetName} (${fields}) VALUES (${valueRefs}) RETURNING id`
    let query = {
      text: queryText,
      values: values,
    }
    return query
  }

  insertItem () {
    return new Promise((resolve, reject) => {
      let query = this.insertItemQuery()
      logger.debug(query)
      db.query(query)
        .then(result => {
          // check that result is as expected for a successful create
          logger.verbose(`Item ${result.rows[0].id} added to ${this.datasetName} dataset`)
          let uri = `/v1/datasets/${this.datasetName}/items/${result.rows[0].id}`
          let msg = {statusCode: '201', message: 'CREATED', uri: uri, itemId: result.rows[0].id}
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
  deleteItem () {
    return new Promise((resolve, reject) => {
      let query = {
        text: `DELETE FROM ${this.datasetName} WHERE (id = $1) RETURNING id`,
        values: [this.itemId],
      }
      db.query(query)
        .then(result => {
          let uri = `/v1/datasets/${this.datasetName}/items`
          if (result.rowCount === 1) {
            logger.verbose(`Item ${this.itemId} deleted from ${this.datasetName} dataset`)
            let msg = { statusCode: '200', message: 'OK', uri }
            return resolve(msg)
          }
          let msg = { statusCode: '404', message: 'NOT FOUND', uri }
          return resolve(msg)
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }

  post () {
    // will need to return error 400 - for bad input causing queries to fail
    return new Promise((resolve, reject) => {
      // get params from this.
      this.checkIfItemExists()
        .then(itemExists => {
          if (itemExists.statusCode === '302') {
            let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'}
            return resolve(msg)
          }
          this.insertItem()
            .then(insertResult => {
              if (insertResult.statusCode === '422') {
                let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'}
                return resolve(msg)
              }
              return resolve(insertResult)
            })
        })
        .catch(err => {
          logger.error(err)
          return reject(err)
        })
    })
  }
}

module.exports = Item
