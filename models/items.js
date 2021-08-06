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
    this.nonFields = [
      '_total_count',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
    ]
  }

  findAll (offset = 0, limit = null, fetchAll = false, searchQuery = false) {
    return new Promise((resolve, reject) => {
      let limiter = ''
      let totalCount = ''

      if (!fetchAll) {
        limiter = Number.isInteger(limit) ? ` LIMIT ${limit} OFFSET ${offset}` : ''
        totalCount = ', count(*) OVER() AS _total_count'
      }

      let query = `SELECT * ${totalCount}
          FROM ${this.datasetName} 
          ORDER BY 1 
          ${limiter}
          `
      try {
        query = searchQuery.values.length > 0 ? searchQuery : query
      } catch (err) {
        logger.verbose('Empty search query found. Using default query instead')
      }

      db.query(query)
        .then(result => {
          if (result.command === 'SELECT') {
            logger.verbose(`Getting items from ${this.datasetName}`)
            // process fields and rows
            const fields = []
            for (let i = 0; i < result.fields.length; i++) {
              if (!this.nonFields.includes(result.fields[i].name)) {
                fields.push(result.fields[i].name)
              }
            }
            const rows = []
            let count = 0
            for (let j = 0; j < result.rows.length; j++) {
              const row = []
              if (j === 0) {
                count = result.rows[0]._total_count
              }

              for (let k = 0; k < result.fields.length; k++) {
                row.push(result.rows[j][fields[k]])
              }
              rows.push(row)
            }
            const items = {
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
          const msg = { statusCode: '404', message: 'NOT FOUND' }
          return msg
        })
        .then(items => {
          const dataset = new Dataset(this.datasetName)
          logger.verbose(`Getting idType for the ${this.datasetName} dataset`)
          dataset.getIdType()
            .then(idTypeResult => {
              if (idTypeResult.statusCode === '200') {
                items.idType = idTypeResult.data
                const msg = { statusCode: '200', message: 'OK', data: items }
                return resolve(msg)
              }
              logger.verbose(`Unable to get idType for dataset (${this.datasetName})`)
              const msg = { statusCode: '404', message: 'NOT FOUND' }
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

  /**
   * Given a search query and an array of column data, generate an object collating this data
   * @param {Object} searchQuery An object in the form { columnName: query , }
   * @param {Array} datasetTypeList An array in the form [ { columnName, datatype } ]
   * @returns {Object} Object in the form { columnName: { query, columnType } }
   */
  genSearchObj (searchQuery, datasetTypeList) {
    const properties = Object.keys(searchQuery)
    const searchObj = {}
    properties.forEach(property => {
      const column = datasetTypeList.find(column => { return column.name === property })
      if (searchQuery[property] !== '' && column) {
        try {
          searchObj[property] = { searchParam: searchQuery[property], columnType: column.datatype }
        } catch (err) {
          searchObj[property] = { searchParam: searchQuery[property], columnType: '' }
        }
      }
    })
    return searchObj
  }

  /**
   * Given a search object, for each key value pair, check the datatype and append the correct query string
   * @param {Object} searchObj  An object of { columnName: { query, columnType } }
   * @returns {Object} An object for the prepared statement to be run against the database
   */
  searchQuery (searchQuery, datasetTypeList, fetchAll = false, offset = 0, limit = null) {
    const searchObj = this.genSearchObj(searchQuery, datasetTypeList)
    const properties = Object.keys(searchObj)
    let limiter = ''
    let totalCount = ''
    if (!fetchAll) {
      limiter = Number.isInteger(limit) ? ` LIMIT ${limit} OFFSET ${offset}` : ''
      totalCount = ', count(*) OVER() AS _total_count'
    }

    let searchStr = `SELECT * ${totalCount} FROM ${this.datasetName} `
    searchStr += Object.values(searchQuery).join('') === '' ? '' : 'WHERE '

    const values = []
    for (const [index, property] of properties.entries()) {
      (index !== 0 && index < properties.length) ? searchStr += ' AND ' : searchStr += ''
      if (searchObj[`${property}`].columnType === 'VARCHAR') {
        searchStr += `LOWER("${property}") LIKE LOWER($${index + 1})`
        values.push(`%${searchObj[`${property}`].searchParam}%`)
      }
      if (searchObj[`${property}`].columnType === 'INTEGER') {
        searchStr += `"${property}" = $${index + 1}`
        values.push(parseInt(searchObj[`${property}`].searchParam))
      }
    }
    searchStr += ` ORDER BY 1 ${limiter}`
    return {
      text: searchStr,
      values
    }
  }
}

module.exports = Items
