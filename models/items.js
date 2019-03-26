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
            let fields = []
            for (let i = 0; i < result.fields.length; i++) {
              if (result.fields[i].name !== '_total_count') {
                fields.push(result.fields[i].name)
              }
            }
            let rows = []
            let count = 0
            for (let j = 0; j < result.rows.length; j++) {
              let row = []
              if (j === 0) {
                count = result.rows[0]['_total_count']
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
      const column = datasetTypeList.find(column => column.name === property)
      if (searchQuery[property] !== '' && column !== undefined) {
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

    let values = []
    for (let [index, property] of properties.entries()) {
      (index !== 0 && index < properties.length) ? searchStr += ' AND ' : searchStr += ''
      if (searchObj[`${property}`].columnType === 'VARCHAR') {
        searchStr += `LOWER(${property}) LIKE LOWER($${index + 1})`
        values.push(`%${searchObj[`${property}`].searchParam}%`)
      }
      if (searchObj[`${property}`].columnType === 'INTEGER') {
        searchStr += `${property} = $${index + 1}`
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
