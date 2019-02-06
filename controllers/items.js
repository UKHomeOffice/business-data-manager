'use strict'

const paginationConfig = require('../config/pagination')
const Item = require('../models/item')
const Items = require('../models/items')
const logger = require('../logger')
const filter = require('../lib/filters')

/**
 * GET /v1/datasets/:dataset/items
 *
 * @returns summary all items from the dataset
 */
exports.getItems = (req, res) => {
  let items = new Items(req.params.dataset)
  const fetchAll = (req.get('Accept') === 'application/json') || false
  const page = parseInt(req.sanitize('page').escape()) || false
  const itemsPerPage = paginationConfig.itemsPerPage
  const start = page ? (page - 1) * itemsPerPage : 0
  items.findAll(start, itemsPerPage, fetchAll)
    .then(result => {
      console.log(result)
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
            req.flash('errors', {msg: `No dataset found with the name ${req.params.dataset}`})
            res.status(200).redirect('/v1/datasets')
          },
          json: () => {
            logger.verbose('getItems sending JSON response')
            // respond that dataset could not be created
            res.status(404).json({status: '404', message: 'NOT FOUND'})
          },
          default: () => {
            logger.verbose('getItem invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      // other catch an unexpected response code
    })
    .catch(err => {
      logger.error(err)
    })
}

/**
 * GET /v1/datasets/:dataset/items/add
 *
 * @returns form to add new item
 */
exports.addItem = (req, res) => {
  let items = new Items(req.params.dataset)
  const fetchAll = (req.get('Accept') === 'application/json') || false
  const page = parseInt(req.sanitize('page').escape()) || false
  const itemsPerPage = paginationConfig.itemsPerPage
  const start = page ? (page - 1) * itemsPerPage : 0
  items.findAll(start, itemsPerPage, fetchAll)
    .then(result => {
      console.log(result)
      if (result.statusCode === '200') {
        logger.verbose('getItems sending HTML response')

        res.status(200).render('addItem', {
          title: filter.cCapitalize(req.params.dataset),
          data: result.data,
          reqPath: req.originalUrl,
        })
      }
    })
    .catch(err => {
      logger.error(err)
    })
}

/**
 * POST /v1/datasets/:dataset/items
 * @param {String} dataset - name of the dataset to add the item to
 * @param {String} id - id of the item to create, must be ommitted for datasets with a serial id
 * @param {Object} properties - an object containing key:value pairs posted in the `req.body`
 *
 * @returns adds a new item to the dataset
 */
exports.postItems = (req, res) => {
  let item
  if (typeof req.body.id !== 'undefined') {
    item = new Item(req.params.dataset, req.body.id, req.body)
  } else {
    item = new Item(req.params.dataset, null, req.body)
  }
  item.post()
    .then(result => {
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postItems sending HTML response')
            req.flash('success', {msg: 'Item created'})
            res.status(201).redirect(result.uri)
          },
          json: () => {
            logger.verbose('postItems sending JSON response')
            let uri = `/v1/datasets/${req.params.dataset}/items/${result.itemId}`
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
            req.flash('errors', {msg: `Item could not be created`})
            res.status(422).redirect('/v1/datasets/')
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            let uri = `/v1/datasets/${req.params.dataset}`
            res.status(422).json({uri: uri, action: 'Unprocessable Entity'})
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
    })
}

/**
 * GET /v1/datasets/:dataset/items/:item
 * @param {String} dataset - name of the dataset to get the item from
 * @param {String} id - id of the item to get
 *
 * @returns a single item from the dataset
 */
exports.getItem = (req, res) => {
  let item = new Item(req.params.dataset, req.params.item)
  item.findOne()
    .then(result => {
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getItem sending HTML response')
            res.status(200).render('getItem', {
              title: `${filter.cCapitalize(req.params.dataset)} - ${req.params.item}`,
              data: result.data
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
            req.flash('errors', {msg: `No item found with the id ${req.params.item} in dataset ${req.params.dataset}`})
            res.status(200).redirect('/v1/datasets')
          },
          json: () => {
            logger.verbose('getItem sending JSON response')
            // respond that dataset could not be created
            res.status(404).json({status: '404', message: 'NOT FOUND'})
          },
          default: () => {
            logger.verbose('getItem invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      // other catch an unexpected response code
    })
    .catch(err => {
      logger.error(err)
    })
}

/**
 * PUT /v1/datasets/:dataset/items/:item/properties/:property
 *
 * @returns summary all elements from the dataset
 */
exports.putItemProperty = (req, res) => {

}
