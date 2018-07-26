'use strict'

const paginationConfig = require('../config/pagination')
const Item = require('../models/item')
const Items = require('../models/items')
const logger = require('../logger')

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

            res.status(200).render('getItems', {title: 'Items', data: result.data})
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
            res.status(200).render('getItem', {title: 'Item', data: result.data})
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
 * PUT /v1/datasets/:dataset/items/:item
 * POST /v1/datasets/:dataset/items/:item/update
 *
 * @returns updates an item in the dataset
 */
// exports.putItem = (req, res) => {
//
// };

/**
 * DELETE /v1/datasets/:dataset/items/:item
 * POST /v1/datasets/:dataset/items/:item/delete
 * @param {String} dataset - extracted from the request URL parameters
 * @param {String} item - passed in the request URL parameters
 * @param {String} itemId - passed in the request body and used for verification
 *
 * @returns success/failure
 */
exports.deleteItem = (req, res) => {
  if (req.body.itemId === req.params.item) {
    logger.verbose('Verification check for item deletion passed')
    let item = new Item(req.params.dataset, req.params.item)
    item.delete()
      .then(deleteResult => {
        if (deleteResult.statusCode === '200') {
          res.format({
            html: () => {
              logger.verbose('deleteItem sending HTML response')
              req.flash('success', {msg: `The ${req.params.item} has been deleted from ${req.params.dataset}`})
              res.status(200).redirect(`/v1/datasets/${req.params.dataset}/items`)
            },
            json: () => {
              logger.verbose('deleteItem sending JSON response')
              let uri = `/v1/datasets/${req.params.dataset}/items/${req.params.item}`
              res.status(200).json({uri: uri, action: 'Deleted'})
            },
            default: () => {
              logger.verbose('deleteItem invalid format requested')
              res.status(406).send('Invalid response format requested')
            }
          })
        }
        if (deleteResult.statusCode === '422') {
          res.format({
            html: () => {
              logger.verbose('deleteItem sending HTML response')
              let flashMsg = 'Deletion failed due to an issue in the database.' +
                'Please contact a system administrator.'
              req.flash('errors', {msg: flashMsg})
              res.status(422).redirect(`/v1/datasets/${req.params.dataset}/items`)
            },
            json: () => {
              logger.verbose('deleteItem sending JSON response')
              res.status(422).json({status: '422', message: 'UNPROCESSABLE ENTITY'})
            },
            default: () => {
              logger.verbose('deleteItem invalid format requested')
              res.status(406).send('Invalid response format requested')
            }
          })
        }
        // other catch an unexpected response code
      })
      .catch(err => {
        logger.error(err)
      })
  } else {
    logger.verbose('Verification check for item deletion failed')
    res.format({
      html: () => {
        logger.verbose('deleteItem sending HTML response')
        let flashMsg = `The ${req.params.dataset} dataset has not been deleted.
                        Verification code (${req.body.name}) supplied does not
                        match dataset name (${req.params.dataset})`
        req.flash('errors', {msg: flashMsg})
        res.status(200).redirect('/v1/datasets/' + req.params.dataset)
      },
      json: () => {
        logger.verbose('deleteItem sending JSON response')
        res.status(400).json({status: '400', message: 'BAD REQUEST'})
      },
      default: () => {
        logger.verbose('deleteItem invalid format requested')
        res.status(406).send('Invalid response format requested')
      }
    })
  }
}

/**
 * GET /v1/datasets/:dataset/items/:item/properties/:property
 *
 * @returns summary all elements from the dataset
 */
// exports.getItemProperty = (req, res) => {
//
// };

/**
 * PUT /v1/datasets/:dataset/items/:item/properties/:property
 *
 * @returns summary all elements from the dataset
 */
exports.putItemProperty = (req, res) => {

}
