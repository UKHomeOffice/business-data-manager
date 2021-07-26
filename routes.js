const express = require('express')
const router = express.Router()
const path = require('path')
const routeAuthenticator = require('./auth/route-authenticator').routeAuthenticator

function getControllerPath (name) {
  return path.join(__dirname, 'controllers', name)
}

/**
 * Controllers (route handlers).
 */
const errorController = require(getControllerPath('error'))
const feedbackController = require(getControllerPath('feedback'))
const datasetsController = require(getControllerPath('datasets'))
const itemsController = require(getControllerPath('items'))

/**
 * Permissions
 */
const datasetAll = routeAuthenticator('dataset', '*')
const datasetWrite = routeAuthenticator('dataset', 'write')
const datasetRead = routeAuthenticator('dataset', 'read')

const itemAll = routeAuthenticator('item', '*')
const itemWrite = routeAuthenticator('item', 'write')
const itemRead = routeAuthenticator('item', 'read')

/**
 * Primary app routes.
 */
router.get('/error', errorController.error)
// web routes (api clients not expected to request these)
router.get('/', (req, res) => { return res.redirect('/v1/datasets') })
router.get('/v1', (req, res) => { return res.redirect('/v1/datasets') })
router.post('/feedback', feedbackController.postFeedback)
router.get('/feedback', feedbackController.getFeedback)
// datasets routes
router.get('/v1/datasets', datasetRead, datasetsController.getDatasets)
router.get('/v1/datasets/add', datasetWrite, datasetsController.addViewDatasets)
router.post('/v1/datasets/add', datasetWrite, datasetsController.postDatasets)
router.get('/v1/datasets/:dataset', datasetRead, datasetsController.getDataset)
router.post('/v1/datasets/:dataset/properties', datasetWrite, datasetsController.postDatasetProperties)
// items routes
router.get('/v1/datasets/:dataset/items', itemRead, itemsController.getItems)
router.get('/v1/datasets/:dataset/items/add', itemRead, itemsController.addItem)
router.post('/v1/datasets/:dataset/items', itemWrite, itemsController.postItems)
router.get('/v1/datasets/:dataset/items/:item', itemRead, itemsController.getItem)
router.post('/v1/datasets/:dataset/items/:item/update', itemRead, itemWrite, itemsController.updateItem)
router.put('/v1/datasets/:dataset/items/:item',itemWrite, itemsController.updateItem)
router.post('/v1/datasets/:dataset/items/:item/delete', itemAll, itemsController.deleteItem)
router.delete('/v1/datasets/:dataset/items/:item', itemAll, itemsController.deleteItem)

// [{defaultUrl:'URL', superUrl:'URL'}, 'id', {label: 'label', crumbTitle: ''}, 'extra-class', [[SUB-MENU-ITEMS]]]
const navbar = [
  [{ defaultUrl: '/v1/datasets' }, 'nb_dataset', { label: 'Datasets', crumbTitle: 'Datasets' }, '', [
  ]],
  [{ defaultUrl: '/feedback' }, 'nb_feedback', { label: 'Feedback', crumbTitle: 'Feedback' }, ''],
]

module.exports = { router, navbar }
