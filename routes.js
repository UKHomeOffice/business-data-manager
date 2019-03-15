const express = require('express')
const router = express.Router()
const path = require('path')

function getControllerPath (name) {
  return path.join(__dirname, 'controllers', name)
}

/**
 * Controllers (route handlers).
 */
const feedbackController = require(getControllerPath('feedback'))
const datasetsController = require(getControllerPath('datasets'))
const itemsController = require(getControllerPath('items'))

/**
 * Primary app routes.
 */
// web routes (api clients not expected to request these)
router.get('/', (req, res) => { return res.redirect('/v1/datasets') })
router.get('/v1', (req, res) => { return res.redirect('/v1/datasets') })
router.post('/feedback', feedbackController.postFeedback)
router.get('/feedback', feedbackController.getFeedback)
// datasets routes
router.get('/v1/datasets', datasetsController.getDatasets)
router.get('/v1/datasets/add', datasetsController.addViewDatasets)
router.post('/v1/datasets/add', datasetsController.postDatasets)
router.get('/v1/datasets/:dataset', datasetsController.getDataset)
router.post('/v1/datasets/:dataset/properties', datasetsController.postDatasetProperties)
// items routes
router.get('/v1/datasets/:dataset/items', itemsController.getItems)
router.get('/v1/datasets/:dataset/items/add', itemsController.addItem)
router.post('/v1/datasets/:dataset/items', itemsController.postItems)
router.get('/v1/datasets/:dataset/items/:item', itemsController.getItem)
router.post('/v1/datasets/:dataset/items/:item/update', itemsController.updateItem)
router.put('/v1/datasets/:dataset/items/:item', itemsController.updateItem)

// [{defaultUrl:'URL', superUrl:'URL'}, 'id', {label: 'label', crumbTitle: ''}, 'extra-class', [[SUB-MENU-ITEMS]]]
const navbar = [
  [{defaultUrl: '/v1/datasets'}, 'nb_dataset', {label: 'Datasets', crumbTitle: 'Datasets'}, '', [
  ]],
  [{defaultUrl: '/feedback'}, 'nb_feedback', {label: 'Feedback', crumbTitle: 'Feedback'}, ''],
]

module.exports = {router, navbar}
