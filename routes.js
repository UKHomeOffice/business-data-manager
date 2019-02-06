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

// [{defaultUrl:'URL', superUrl:'URL'}, 'id', {label: 'label', crumbTitle: ''}, 'extra-class', [[SUB-MENU-ITEMS]]]
const navbar = [
  [{defaultUrl: '/v1/datasets'}, 'nb_dataset', {label: 'Datasets', crumbTitle: 'Datasets'}, '', [
    [{defaultUrl: '/v1/datasets/port'}, 'nb_manage_port', {label: 'Port', crumbTitle: 'Port'}, ''],
    [{defaultUrl: '/v1/datasets/persontype'}, 'nb_manage_persontype', {label: 'Person Type', crumbTitle: 'Person Type'}, ''],
    [{defaultUrl: '/v1/datasets/region'}, 'nb_manage_region', {label: 'Regions', crumbTitle: 'Regions'}, ''],
    [{defaultUrl: '/v1/datasets/name'}, 'nb_manage_name', {label: 'Names', crumbTitle: 'Names'}, ''],
    [{defaultUrl: '/v1/datasets/office'}, 'nb_manage_office', {label: 'Offices', crumbTitle: 'Offices'}, ''],
    [{defaultUrl: '/v1/datasets/country'}, 'nb_manage_office', {label: 'Countries', crumbTitle: 'Countries'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/port/items'}, 'nb_port_view', {label: 'Ports', crumbTitle: 'Ports'}, '', [
    [{defaultUrl: '/v1/datasets/port/items/add'}, 'nb_add_port', {label: 'Add Port', crumbTitle: 'Add Port'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/persontype/items'}, 'nb_person_type', {label: 'Person Type', crumbTitle: 'Person Type'}, '', [
    [{defaultUrl: '/v1/datasets/persontype/items/add'}, 'nb_add_person_type', {label: 'Add Person Type', crumbTitle: 'Add Person Type'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/region/items'}, 'nb_regions', {label: 'Regions', crumbTitle: 'Regions'}, '', [
    [{defaultUrl: '/v1/datasets/region/items/add'}, 'nb_add_region', {label: 'Add Region', crumbTitle: 'Add Region'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/name/items'}, 'nb_names', {label: 'Names', crumbTitle: 'Names'}, '', [
    [{defaultUrl: '/v1/datasets/name/items/add'}, 'nb_add_name', {label: 'Add Name', crumbTitle: 'Add Name'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/office/items'}, 'nb_offices', {label: 'Offices', crumbTitle: 'Offices'}, '', [
    [{defaultUrl: '/v1/datasets/office/items/add'}, 'nb_add_office', {label: 'Add Office', crumbTitle: 'Add Office'}, ''],
  ]],
  [{defaultUrl: '/v1/datasets/country/items'}, 'nb_countries', {label: 'Countries', crumbTitle: 'Countries'}, '', [
    [{defaultUrl: '/v1/datasets/country/items/add'}, 'nb_add_country', {label: 'Add Country', crumbTitle: 'Add Country'}, ''],
  ]],
  [{defaultUrl: '/feedback'}, 'nb_feedback', {label: 'Feedback', crumbTitle: 'Feedback'}, ''],
]

module.exports = {router, navbar}
