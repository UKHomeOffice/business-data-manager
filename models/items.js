'use strict'

const logger = require('../logger')
const Dataset = require('./dataset')
const db = require('../db')

/**
 * Provides an interface to collections of Item resources.
 *
 * @param {String} datasetName - name of the Dataset collection that contains the
 *                               Item resources
 *
 */
class Items {
  /**
   * The constructor only creates the object in memory, it doesn't create
   * the Item in the database storage; this requires a subsequent call to
   * create the data structure. This ensures that the data structures aren't
   * touched every time that the class is instanciated.
   */
  constructor (datasetName) {
    this.datasetName = datasetName
  }

  findAll (offset = 0, limit = null) {
    return new Promise((resolve, reject) => {
      const limiter = Number.isInteger(limit) ? ` LIMIT ${limit} OFFSET ${offset}` : ''
      let query = `SELECT *, count(*) OVER() AS total_count 
          FROM ${this.datasetName} 
          ORDER BY 1 
          ${limiter}
          `
      db.query(query)
        .then(result => {
          if (result.command === 'SELECT') {
            logger.verbose(`Getting items from ${this.datasetName}`)
            // process fields and rows
            let fields = []
            for (let i = 0; i < result.fields.length; i++) {
              fields.push(result.fields[i].name)
            }
            let rows = []
            let count = 0
            for (let j = 0; j < result.rows.length; j++) {
              let row = []
              if (j === 0) {
                count = result.rows[0]['total_count']
              }

              for (let k = 0; k < result.fields.length; k++) {
                row.push(result.rows[j][fields[k]])
              }
              rows.push(row)
            }
            let items = {
              datasetName: this.datasetName,
              fields: fields,
              rows: rows,
              pagination: {
                count,
              },
            }
            return items
          }
          logger.verbose(`The requested dataset (${this.datasetName}) doesn't exist`)
          let msg = {statusCode: '404', message: 'NOT FOUND'}
          return msg
        })
        .then(items => {
          let dataset = new Dataset(this.datasetName)
          logger.verbose(`Getting idType for the ${this.datasetName} dataset`)
          dataset.getIdType()
            .then(idTypeResult => {
              if (idTypeResult.statusCode === '200') {
                items.idType = idTypeResult.data
                let msg = {statusCode: '200', message: 'OK', data: items}
                return resolve(msg)
              }
              logger.verbose(`Unable to get idType for dataset (${this.datasetName})`)
              let msg = {statusCode: '404', message: 'NOT FOUND'}
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
}

module.exports = Items
