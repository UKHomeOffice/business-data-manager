'use strict';

const logger = require('../logger');
const db = require('../db');

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
    this.datasetName = datasetName;
    this.itemId = itemId;
    this.properties = properties;
  }

  findOne () {
    return new Promise((resolve, reject) => {
      let queryString = `SELECT * FROM ${this.datasetName} WHERE id = '${this.itemId}';`;
      db.query(queryString)
        .then(result => {
          if (result.rows.length === 1) {
            logger.verbose(`Getting properties for ${this.datasetName}.${this.itemId}`);
            // process fields and rows
            let properties = [];
            for (let i = 0; i < result.fields.length; i++) {
              let property = {
                field: result.fields[i].name,
                value: result.rows[0][result.fields[i].name]
              };
              properties.push(property);
            }
            let item = {
              datasetName: this.datasetName,
              itemId: this.itemId,
              properties: properties
            };
            let msg = {statusCode: '200', message: 'OK', data: item};
            return resolve(msg);
          }
          logger.verbose(`The requested dataset (${this.name}) doesn't exist`);
          let msg = {statusCode: '404', message: 'NOT FOUND'};
          return resolve(msg);
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
    });
  }

  // ***************************************************************************
  // ***************************************************************************
  // ***************************************************************************
  //        NEEDS UPDATING TO WORK ON ITEMS
  // ***************************************************************************
  // ***************************************************************************
  // ***************************************************************************
  // ***************************************************************************
  // checkIfPropertyExists () {
  //   // grab the current fields and append them to this.fields[]
  //   // this makes them available in memory for the next functions
  //   // return 302 Found or 404 Not found
  //   return new Promise((resolve, reject) => {
  //     let queryString = `SELECT fields FROM datasets WHERE name = '${this.itemId}';`;
  //     db.query(queryString)
  //       .then(result => {
  //         for (let i = 0; i < result.rows[0].fields.length; i++) {
  //           this.fields.push(result.rows[0].fields[i]);
  //         }
  //         for (let j = 1; j < this.fields.length; j++) {
  //           if (this.fields[0].name === this.fields[j].name) {
  //             logger.verbose(`The property ${this.itemId} already exists in ${this.datasetName}`);
  //             let msg = {statusCode: '302', message: 'Found'};
  //             return resolve(msg);
  //           }
  //         }
  //         logger.verbose(`The property ${this.itemId} does not exist in ${this.datasetName}`);
  //         let msg = {statusCode: '404', message: 'Not found'};
  //         return resolve(msg);
  //       })
  //       .catch(err => {
  //         logger.error(err);
  //         return reject(err);
  //       });
  //   });
  // }

  checkIfItemExists () {
    return new Promise((resolve, reject) => {
      if (this.itemId === null) {
        logger.verbose(`The ${this.datasetName} dataset uses a serial id so the new item can be created`);
        let msg = {statusCode: '404', message: 'NOT FOUND'};
        return resolve(msg);
      }
      let queryString = `SELECT id FROM ${this.datasetName} WHERE id = '${this.itemId}';`;
      logger.debug(queryString);
      db.query(queryString)
        .then(result => {
          if (result.rowCount === '1') {
            logger.verbose(`The item ${this.itemId} already exists in ${this.datasetName}`);
            let msg = {statusCode: '302', message: 'FOUND'};
            return resolve(msg);
          }
          logger.verbose(`The item ${this.itemId} does not exist in ${this.datasetName}`);
          let msg = {statusCode: '404', message: 'NOT FOUND'};
          return resolve(msg);
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
    });
  }

  insertItemQueryString () {
    let fields = '';
    let values = '';
    if (this.itemId === null) {
      fields += 'id, ';
      values += 'DEFAULT, ';
    }
    for (let key in this.properties) {
      if (key !== '_csrf') {
        fields += `${key}, `;
        values += `'${this.properties[key]}', `;
      }
    }
    // remove the last ', '
    fields = fields.slice(0, -2);
    values = values.slice(0, -2);
    let queryString = `INSERT INTO ${this.datasetName} (${fields}) VALUES (${values}) RETURNING id;`;
    return queryString;
  }

  insertItem () {
    return new Promise((resolve, reject) => {
      let queryString = this.insertItemQueryString();
      logger.debug(queryString);
      db.query(queryString)
        .then(result => {
          // check that result is as expected for a successful create
          logger.verbose(`Item ${result.rows[0].id} added to ${this.datasetName} dataset`);
          let uri = `/v1/datasets/${this.datasetName}/items/${result.rows[0].id}`;
          let msg = {statusCode: '201', message: 'CREATED', uri: uri};
          return resolve(msg);
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
    });
  }

  deleteItem () {
    return new Promise((resolve, reject) => {
      let queryString = `DELETE FROM ${this.datasetName} WHERE (id = '${this.itemId}') RETURNING id`;
      logger.debug(queryString);
      db.query(queryString)
        .then(result => {
          // check that result is as expected for a successful delete
          logger.verbose(`Item ${result.rows[0].id} deleted from ${this.datasetName} dataset`);
          let uri = `/v1/datasets/${this.datasetName}/items/${result.rows[0].id}`;
          let msg = {statusCode: '200', message: 'OK', uri: uri};
          return resolve(msg);
          // if not then
          // let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
          // return resolve(msg);
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
    });
  }

  post () {
    // will need to return error 400 - for bad input causing queries to fail
    return new Promise((resolve, reject) => {
      // get params from this.
      this.checkIfItemExists()
        .then(itemExists => {
          if (itemExists.statusCode === '302') {
            let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
            return resolve(msg);
          }
          this.insertItem()
            .then(insertResult => {
              if (insertResult.statusCode === '422') {
                let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
                return resolve(msg);
              }
              return resolve(insertResult);
            });
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
    });
  }

  delete () {
    return new Promise((resolve, reject) => {
      this.deleteItem()
        .then(deleteResult => {
          if (deleteResult.statusCode === '422') {
            let msg = {statusCode: '422', message: 'UNPROCESSABLE ENTITY'};
            return resolve(msg);
          }
          let msg = {statusCode: '200', message: 'OK'};
          return resolve(msg);
        })
        .catch(err => {
          logger.error(err);
          return reject(err);
        });
      });
  }


}

module.exports = Item;