'use strict'

const paginationConfig = require('../config/pagination')
const Item = require('../models/item')
const Items = require('../models/items')
const Dataset = require('../models/dataset')
const logger = require('../logger')
const filter = require('../lib/filters')
const { zipListsToDict } = require('../lib/utils')
const { check } = require('express-validator')
const { Validator } = require('../lib/validator')

function hasNonPageQuery (req) {
  if (Object.keys(req.query).length !== 0) {
    return !(req.query.hasOwnProperty('page') && Object.keys(req.query).length === 1)
  }
}

/**
 * GET /v1/datasets/:dataset/items
 *
 * @returns summary all items from the dataset
 */
exports.getItems = async (req, res) => {
  delete req.session.form
  const dataset = new Dataset(req.params.dataset)
  const datasetObj = await dataset.findOne()
  const items = new Items(req.params.dataset)
  const fetchAll = (req.get('Accept') === 'application/json') || false
  const page = req.query.page ? parseInt(req.query.page.trim()) || false : false
  const itemsPerPage = paginationConfig.itemsPerPage
  const start = page ? (page - 1) * itemsPerPage : 0
  let result

  if (datasetObj.data.versioned) {
    req.query.is_current = '1'
  }

  try {
    if (hasNonPageQuery(req)) {
      delete req.query.page
      result = await items.findAll(start, itemsPerPage, fetchAll, items.searchQuery(req.query, datasetObj.data.fields, fetchAll, start, itemsPerPage, datasetObj.data.versioned))
    } else {
      result = await items.findAll(start, itemsPerPage, fetchAll)
    }
    if (result.statusCode === '200') {
      res.format({
        html: () => {
          logger.verbose('getItems sending HTML response')
          const midPoint = paginationConfig.midpoint
          const lastPage = Math.ceil(result.data.pagination.count / itemsPerPage)
          const firstPage = paginationConfig.firstPage
          result.data.pagination.midPoint = midPoint
          result.data.pagination.page = page
          result.data.pagination.itemsPerPage = itemsPerPage
          result.data.pagination.firstPage = firstPage
          result.data.pagination.lastPage = lastPage
          result.data.pagination.rangeStart = page - midPoint > 0 ? page - midPoint + 1 : firstPage
          result.data.pagination.rangeEnd = page + midPoint < lastPage ? page < midPoint ? midPoint * 2 : page + midPoint : lastPage + 1

          res.status(200).render('getItems', {
            title: filter.cCapitalize(req.params.dataset),
            data: result.data,
            reqPath: req.originalUrl,
            datasetFields: datasetObj.data.fields,
            dataset: datasetObj
          })
        },
        json: () => {
          logger.verbose('getItems sending JSON response')
          res.status(200).json(result.data)
        },
        default: () => {
          logger.verbose('getItems invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
    if (result.statusCode === '404') {
      res.format({
        html: () => {
          logger.verbose('getItems sending HTML response')
          // flash notify that dataset could not be found
          req.flash('errors', { msg: `No dataset found with the name ${req.params.dataset}` })
          res.status(200).redirect('/v1/datasets')
        },
        json: () => {
          logger.verbose('getItems sending JSON response')
          // respond that dataset could not be created
          res.status(404).json({ status: '404', message: 'NOT FOUND' })
        },
        default: () => {
          logger.verbose('getItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
  } catch (err) {
    logger.error(err)
    req.flash('errors', { msg: 'Search failed' })
    res.redirect(req.path)
  }
}

/**
 * GET /v1/datasets/:dataset/items/add
 *
 * @returns form to add new item
 */
exports.addItem = async (req, res) => {
  const datasetModel = new Dataset(req.params.dataset)
  const values = req.session.form
  delete req.session.form
  try {
    const result = await datasetModel.findOne()
    if (result.statusCode === '200') {
      logger.verbose('getItems sending HTML response')
      const dataset = result.data
      const foreignKeys = await getForeignKeys(dataset)

      res.status(200).render('addItem', {
        title: filter.cCapitalize(req.params.dataset),
        dataset: dataset,
        reqPath: req.originalUrl,
        foreignKeys,
        values
      })
    }
  } catch (err) {
    logger.error(err)
    req.flash('errors', { msg: 'Failed to add item' })
    res.redirect(`/v1/datasets/${req.params.dataset}/items`)
  }
}

/**
 * DELETE /v1/datasets/:dataset/item/:item
 * POST /v1/datasets/:dataset/item/:item/delete
 *
 * @returns deletes the item with the given id from the given dataset
 */
exports.deleteItem = async (req, res) => {
  try {
    const item = new Item(req.params.dataset, req.params.item)
    const deleteResponse = await item.deleteItem()
    if (deleteResponse.statusCode === '200') {
      res.format({
        html: () => {
          logger.verbose('deleteItem sending HTML response')
          req.flash('success', { msg: 'Item deleted' })
          res.status(201).redirect(`${deleteResponse.uri}`)
        },
        json: () => {
          logger.verbose('deleteItem sending JSON response')
          res.status(200).json({
            action: 'Deleted',
            itemId: item.itemId
          })
        },
        default: () => {
          logger.verbose('deleteItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    } else if (deleteResponse.statusCode === '404') {
      res.format({
        html: () => {
          req.flash('errors', { msg: `No item found with the id ${item.itemId} in dataset ${item.datasetName}` })
          res.status(404).redirect(`${deleteResponse.uri}`)
        },
        json: () => {
          logger.verbose('deleteItem sending JSON response')
          res.status(404).json({ status: '404', message: 'NOT FOUND' })
        },
        default: () => {
          logger.verbose('deleteItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
  } catch (err) {
    logger.error(err)
  }
}

/**
 * POST /v1/datasets/:dataset/item/:item/update
 * PUT /v1/datasets/:dataset/item/:item
 *
 * @returns updates the given item with the given values
 */
exports.updateItem = async (req, res) => {
  const datasetName = req.params.dataset
  const itemId = req.body._itemid ? req.body._itemid : 'add'
  delete req.body._itemid
  delete req.body._csrf
  const item = new Item(datasetName, itemId, req.body, req.app.locals.email)
  const dataset = new Dataset(datasetName)
  const datasetObj = (await dataset.findOne()).data
  const validator = new Validator(datasetObj, req.body)
  const errors = validator.validate()
  if (errors.length > 0) {
    for (const error of errors) {
      req.flash('errors', { msg: error })
    }
    req.session.form = req.body
    return res.format({
      html: () => {
        res.status(406).redirect(`/v1/datasets/${datasetName}/items/${itemId}`)
      },
      json: () => {
        res.status(406).json({
          uri: `/v1/datasets/${datasetName}/items/${itemId}`,
          action: 'Error',
          errors: errors
        })
      },
      default: () => {
        logger.verbose('updateItem invalid format requested')
        res.status(406).send('Invalid response format requested')
      }
    })
  }
  try {
    const updateResponse = await item.update(req.body)
    if (updateResponse.statusCode === '200') {
      res.format({
        html: () => {
          logger.verbose('updateItem sending HTML response')
          req.flash('success', { msg: 'Item updated' })
          res.status(201).redirect(`/v1/datasets/${datasetName}/items/${itemId}`)
        },
        json: () => {
          logger.verbose('updateItem sending JSON response')
          res.status(200).json({
            uri: `/v1/datasets/${datasetName}/items/${itemId}`,
            action: 'Updated',
            itemId
          })
        },
        default: () => {
          logger.verbose('updateItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    } else if (updateResponse.statusCode === '404') {
      res.format({
        html: () => {
          req.flash('errors', { msg: `No item found with the id ${itemId} in dataset ${datasetName}` })
          res.status(404).redirect(`/v1/datasets/${datasetName}`)
        },
        json: () => {
          logger.verbose('updateItem sending JSON response')
          res.status(404).json({ status: '404', message: 'NOT FOUND' })
        },
        default: () => {
          logger.verbose('updateItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
  } catch (err) {
    logger.error(err)
    let errString = err.toString()
    if (err.detail.startsWith('Key (') && err.detail.endsWith(') already exists.')) {
      errString = err.detail
    }
    req.flash('errors', { msg: `Update failed: ${errString}` })
    res.redirect(`/v1/datasets/${datasetName}/items/${itemId}`)
  }
}

/**
 * POST /v1/datasets/:dataset/items
 * @param {String} dataset - name of the dataset to add the item to
 * @param {String} id - id of the item to create, must be ommitted for datasets with a serial id
 * @param {Object} properties - an object containing key:value pairs posted in the `req.body`
 *
 * @returns adds a new item to the dataset
 */
exports.postItems = async (req, res) => {
  const itemId = req.body._itemid ? req.body._itemid : 'add'
  delete req.body._itemid
  delete req.body._csrf
  const datasetName = req.params.dataset
  const dataset = new Dataset(datasetName)
  const datasetObj = (await dataset.findOne()).data
  const validator = new Validator(datasetObj, req.body)
  const errors = validator.validate()
  console.log(errors)
  if (errors.length > 0) {
    for (const error of errors) {
      console.log(error)
      req.flash('errors', { msg: error })
    }
    req.session.form = req.body
    return res.format({
      html: () => {
        res.status(406).redirect(`/v1/datasets/${datasetName}/items/${itemId}`)
      },
      json: () => {
        res.status(406).json({
          uri: `/v1/datasets/${datasetName}/items/${itemId}`,
          action: 'Error',
          errors: errors
        })
      },
      default: () => {
        logger.verbose('updateItem invalid format requested')
        res.status(406).send('Invalid response format requested')
      }
    })
  }

  let item
  if (typeof req.body.id !== 'undefined') {
    item = new Item(req.params.dataset, req.body.id, req.body, req.app.locals.email)
  } else {
    item = new Item(req.params.dataset, null, req.body, req.app.locals.email)
  }
  item.post()
    .then(result => {
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postItems sending HTML response')
            req.flash('success', { msg: 'Item created' })
            res.status(201).redirect(result.uri)
          },
          json: () => {
            logger.verbose('postItems sending JSON response')
            const uri = `/v1/datasets/${req.params.dataset}/items/${result.itemId}`
            res.status(201).json({
              uri: uri,
              action: 'Created',
              itemId: result.itemId
            })
          },
          default: () => {
            logger.verbose('postItems invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            req.flash('errors', { msg: 'Item could not be created' })
            res.status(422).redirect('/v1/datasets/')
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            const uri = `/v1/datasets/${req.params.dataset}`
            res.status(422).json({ uri: uri, action: 'Unprocessable Entity' })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
    })
    // other catch an unexpected response code
    .catch(err => {
      logger.error(err)
      let errString = err.toString()
      if (err.detail.startsWith('Key (') && err.detail.endsWith(') already exists.')) {
        errString = err.detail
      }
      req.flash('errors', { msg: `Failed to add item: ${errString}` })
      if (req.get('Accept') === 'application/json') {
        return res.status(500).json({ action: 'Unprocessable Entity', error: errString })
      }
      res.redirect(`/v1/datasets/${req.params.dataset}/items`)
    })
}

/**
 * GET /v1/datasets/:dataset/items/:item
 * @param {String} dataset - name of the dataset to get the item from
 * @param {String} id - id of the item to get
 *
 * @returns a single item from the dataset
 */
exports.getItem = async (req, res) => {
  const item = new Item(req.params.dataset, req.params.item)
  const values = req.session.form
  delete req.session.form
  try {
    const datasetModel = new Dataset(req.params.dataset)
    const dataset = (await datasetModel.findOne()).data
    const dsFields = {}
    for (const f of dataset.fields) {
      dsFields[f.name] = f
    }
    const result = await item.findOne()
    if (result.statusCode === '200') {
      let history = []
      if (dataset.versioned) {
        const items = new Items(dataset.name)
        const query = {
          version_id: result.data.properties.filter((p) => p.field === 'version_id')[0].value,
          order_by: 'version DESC'
        }
        const historyResult = await items.findAll(0, 100, false, items.searchQuery(query, dataset.fields, false, 0, 100, dataset.versioned))
        history = historyResult.data.rows.map((r) => zipListsToDict(historyResult.data.fields, r))
      }
      res.format({
        html: async () => {
          logger.verbose('getItem sending HTML response')
          const foreignKeys = await getForeignKeys(dataset)
          res.status(200).render('getItem', {
            title: `${filter.cCapitalize(req.params.dataset)} - ${req.params.item}`,
            values,
            data: result.data,
            datasetFields: dsFields,
            foreignKeys,
            dataset,
            history,
            itemId: req.params.item
          })
        },
        json: () => {
          logger.verbose('getItem sending JSON response')
          res.status(200).json(result.data)
        },
        default: () => {
          logger.verbose('getItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
    if (result.statusCode === '404') {
      res.format({
        html: () => {
          logger.verbose('getItem sending HTML response')
          // flash notify that dataset could not be found
          req.flash('errors', { msg: `No item found with the id ${req.params.item} in dataset ${req.params.dataset}` })
          res.status(200).redirect('/v1/datasets')
        },
        json: () => {
          logger.verbose('getItem sending JSON response')
          // respond that dataset could not be created
          res.status(404).json({ status: '404', message: 'NOT FOUND' })
        },
        default: () => {
          logger.verbose('getItem invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
  } catch (err) {
    res.format({
      html: () => {
        logger.verbose('getItem sending HTML response')
        // flash notify that dataset could not be found
        req.flash('errors', { msg: `No item found with the id ${req.params.item} in dataset ${req.params.dataset}` })
        res.status(200).redirect('/v1/datasets')
      },
      json: () => {
        logger.verbose('getItem sending JSON response')
        // respond that dataset could not be created
        res.status(404).json({ status: '404', message: 'NOT FOUND' })
      },
      default: () => {
        logger.verbose('getItem invalid format requested')
        res.status(406).send('Invalid response format requested')
      }
    })
  }
}

/**
 * PUT /v1/datasets/:dataset/items/:item/properties/:property
 *
 * @returns summary all elements from the dataset
 */
exports.putItemProperty = (req, res) => {

}

const getForeignKeys = async (dataset) => {
  const foreignKeys = {}
  for (const field of dataset.fields) {
    if (field.foreignKey) {
      let foreignKey = field.foreignKey
      let idField = 'id'
      if (field.foreignKey.includes('.')) {
        [foreignKey, idField] = field.foreignKey.split('.')
      }
      try {
        const ds = (await (new Dataset(foreignKey)).findOne()).data
        const itemsModel = new Items(foreignKey)
        let searchQuery = false
        if (ds.versioned) {
          searchQuery = itemsModel.searchQuery({ is_current: 1 }, ds.fields, true)
          if (idField === 'id') {
            idField = 'version_id'
          }
        }
        let displayField = idField
        if (field.foreignKeyDisplay) {
          displayField = field.foreignKeyDisplay
        }
        const items = await itemsModel.findAll(0, 0, true, searchQuery)
        const idIndex = items.data.fields.indexOf(idField)
        const displayIndex = items.data.fields.indexOf(displayField)
        foreignKeys[field.foreignKey] = items.data.rows.map((row) => {
          return {
            key: row[idIndex],
            value: row[displayIndex]
          }
        })
      } catch (error) {
      }
    }
  }
  return foreignKeys
}
