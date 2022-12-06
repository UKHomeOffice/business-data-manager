'use strict'

const Dataset = require('../models/dataset')
const Datasets = require('../models/datasets')
const logger = require('../logger')
const filter = require('../lib/filters')
const { validators } = require('../lib/validator')

/**
 * GET /v1/datasets
 * @returns summary info about the current datasets
 */
exports.getDatasets = (req, res) => {
  const datasets = new Datasets()
  datasets.findAll()
    .then(result => {
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getDatasets sending HTML response')
            const data = result.data.filter(dataset => {
              if (dataset.org) {
                return req.app.locals.orgs.includes(dataset.org)
              }
              return true
            }).sort((a, b) => {
              return a.name.localeCompare(b.name)
            })
            res.status(200).render('getDatasets', {
              reqPath: req.originalUrl,
              title: 'Current datasets',
              data: data
            })
          },
          json: () => {
            logger.verbose('getDatasets sending JSON response')
            res.status(200).json(result.data)
          },
          default: () => {
            logger.verbose('getDatasets invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      // findAll() can only respond with either 200 or an error so there is
      // currently no additional handling here
    })
    .catch(err => {
      logger.error(err)
    })
}

exports.addViewDatasets = (req, res) => {
  res.status(200).render('addDataset', {
    title: filter.cCapitalize(req.params.dataset),
    reqPath: req.originalUrl,
  })
}

/**
 * POST /v1/datasets
 *
 * @param {String} name - name of the dataset, used to name the table
 * @param {String} idType - the datatype for the Id field must be one of ['SERIAL', 'VARCHAR', 'INTEGER']
 * @param {Array} fields - array of objects {name, datatype, primaryKey, notNull, unique}
 *
 * @returns response in requested format (defautls to HTML)
 */
exports.postDatasets = (req, res) => {
  // pre-process the fields to set id correctly
  const dataset = new Dataset(req.body.name, req.body.idType, req.body.fields, req.body.org, req.body.versioned, req.body.uniqueTogether || [])
  dataset.post()
    .then(result => {
      // check the result for successful creation
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            // flash notify that dataset was created successfully
            req.flash('success', { msg: 'Dataset created' })
            // redirect to GET datasets/:dataset
            res.status(201).redirect('/v1/datasets/' + req.body.name)
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            const uri = `/v1/datasets/${req.body.name}`
            res.status(201).json({ uri: uri, action: 'Created' })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            req.flash('errors', { msg: `Dataset could not be created with the name: ${req.body.name}` })
            res.status(422).redirect('/v1/datasets/')
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            const uri = `/v1/datasets/${req.body.name}`
            res.status(422).json({ uri: uri, action: 'Unprocessable Entity' })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
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
 * GET /v1/datasets/:dataset
 *
 * @param {String} dataset - name of the dataset, used to name the table
 */
exports.getDataset = async (req, res) => {
  const datasets = new Datasets()
  const ds = await datasets.findAll()
  const foreignKeyDatasets = ds.data.filter(dataset => {
    if (dataset.name === req.params.dataset) {
      return false
    }
    if (dataset.org) {
      return req.app.locals.orgs.includes(dataset.org)
    }
    return true
  })
  const dataset = new Dataset(req.params.dataset)
  dataset.findOne()
    .then(result => {
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getDataset sending HTML response')
            res.status(200).render('getDataset', {
              title: filter.cCapitalize(req.params.dataset),
              data: result.data,
              reqPath: req.originalUrl,
              foreignKeyDatasets,
              validators
            })
          },
          json: () => {
            logger.verbose('getDataset sending JSON response')
            res.status(200).json(result.data)
          },
          default: () => {
            logger.verbose('getDataset invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '404') {
        res.format({
          html: () => {
            logger.verbose('getDataset sending HTML response')
            // flash notify that dataset could not be found
            req.flash('errors', { msg: `No dataset found with the name ${req.params.dataset}` })
            res.status(200).redirect('/v1/datasets')
          },
          json: () => {
            logger.verbose('getDataset sending JSON response')
            // respond that dataset could not be created
            res.status(404).json({ status: '404', message: 'NOT FOUND' })
          },
          default: () => {
            logger.verbose('getDataset invalid format requested')
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
 * GET /v1/datasets/:dataset/properties
 * @returns summary info about the dataset's properties
 */
// exports.getDatasetProperties = (req, res) => {
//   // returns the dataset's properties
// };

/**
 * POST /v1/datasets/:dataset/properties
 * @returns adds a new property to the dataset
 */
exports.postDatasetProperties = (req, res) => {
  // add one or more new fields to the dataset's field (using json operation)
  const fields = getFieldsDataFromRequest(req)
  const dataset = new Dataset(req.params.dataset, req.body.idType, fields, '', req.body.versioned, req.body.uniqueTogether || [])
  dataset.postProperty()
    .then(result => {
      // check the result for successful creation
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            // flash notify that dataset was created successfully
            req.flash('success', { msg: 'Dataset updated' })
            // redirect to GET datasets/:dataset
            res.status(201).redirect('/v1/datasets/' + req.params.dataset)
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            res.status(201).json({ name: req.body.name, action: 'Created' })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            // flash notify that dataset could not be created
            // redirect to GET datasets
            res.status(201).redirect('/v1/datasets/' + req.params.dataset)
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            // respond that dataset could not be created
            res.status(201).json({ name: req.body.name, action: 'Not created' })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
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
 * POST /v1/datasets/:dataset/properties/edit
 * @returns adds a new property to the dataset
 */
exports.postEditDatasetProperties = (req, res) => {
  // add one or more new fields to the dataset's field (using json operation)
  const fields = getFieldsDataFromRequest(req)
  const dataset = new Dataset(req.params.dataset, req.body.idType, fields, '', req.body.versioned, req.body.uniqueTogether || [])
  dataset.postEditProperty()
    .then(result => {
      // check the result for successful creation
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            // flash notify that dataset was created successfully
            req.flash('success', { msg: 'Dataset updated' })
            // redirect to GET datasets/:dataset
            res.status(201).redirect('/v1/datasets/' + req.params.dataset)
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            res.status(201).json({ name: req.body.name, action: 'Created', result: result })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response')
            // flash notify that dataset could not be created
            // redirect to GET datasets
            res.status(406).redirect('/v1/datasets/' + req.params.dataset)
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response')
            // respond that dataset could not be created
            res.status(406).json({ name: req.body.name, action: 'Not edited', result: result })
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested')
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

exports.deleteDataset = async (req, res) => {
  try {
    const dataset = new Dataset(req.params.dataset)
    const deleteResponse = await dataset.delete()
    if (deleteResponse.statusCode === '200') {
      res.format({
        html: () => {
          logger.verbose('deleteDataset sending HTML response')
          req.flash('success', { msg: 'Dataset deleted' })
          res.status(201).redirect(`${deleteResponse.uri}`)
        },
        json: () => {
          logger.verbose('deleteDataset sending JSON response')
          res.status(200).json({
            action: 'Deleted',
            name: dataset.name
          })
        },
        default: () => {
          logger.verbose('deleteDataset invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    } else if (deleteResponse.statusCode === '404') {
      res.format({
        html: () => {
          req.flash('errors', { msg: `No dataset found with the id ${dataset.name} in dataset ${dataset.name}` })
          res.status(404).redirect(`${deleteResponse.uri}`)
        },
        json: () => {
          logger.verbose('deleteDataset sending JSON response')
          res.status(404).json({ status: '404', message: 'NOT FOUND' })
        },
        default: () => {
          logger.verbose('deleteDataset invalid format requested')
          res.status(406).send('Invalid response format requested')
        }
      })
    }
  } catch (err) {
    logger.error(err)
  }
}

/**
 * GET /v1/datasets/:dataset/fields/:field
 *
 * @param {String} dataset - name of the dataset, used to name the table
 * @param {String} field - name of the field, used to name the field
 */
exports.getDatasetField = async (req, res) => {
  const datasets = new Datasets()
  const ds = await datasets.findAll()
  const foreignKeyDatasets = ds.data.filter(dataset => {
    if (dataset.name === req.params.dataset) {
      return false
    }
    if (dataset.org) {
      return req.app.locals.orgs.includes(dataset.org)
    }
    return true
  })
  const dataset = new Dataset(req.params.dataset)
  dataset.findOne()
    .then(result => {
      const field = result.data.fields.filter(x => {
        return x.name === req.params.field
      })[0]
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getField sending HTML response')
            res.status(200).render('getField', {
              title: filter.cCapitalize(req.params.dataset),
              data: result.data,
              reqPath: req.originalUrl,
              currentField: field,
              foreignKeyDatasets,
              validators
            })
          },
          json: () => {
            logger.verbose('getField sending JSON response')
            res.status(200).json(result.data)
          },
          default: () => {
            logger.verbose('getField invalid format requested')
            res.status(406).send('Invalid response format requested')
          }
        })
      }
      if (result.statusCode === '404') {
        res.format({
          html: () => {
            logger.verbose('getField sending HTML response')
            // flash notify that dataset could not be found
            req.flash('errors', { msg: `No dataset found with the name ${req.params.dataset}` })
            res.status(200).redirect('/v1/datasets')
          },
          json: () => {
            logger.verbose('getField sending JSON response')
            // respond that dataset could not be created
            res.status(404).json({ status: '404', message: 'NOT FOUND' })
          },
          default: () => {
            logger.verbose('getField invalid format requested')
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

const getFieldsDataFromRequest = (req) => {
  let fieldValidators = null
  let choices = null
  if (!req.is('json')) {
    if (req.body.validators) {
      fieldValidators = {}
      if (req.body.validators.includes('stringLength')) {
        fieldValidators.stringLength = {
          min: parseInt(req.body.stringLengthMin) || 0,
          max: parseInt(req.body.stringLengthMax) || 100
        }
      }
      if (req.body.validators.includes('upperCaseAlphaNumeric')) {
        fieldValidators.upperCaseAlphaNumeric = {}
      }
      if (req.body.validators.includes('upperCaseAlpha')) {
        fieldValidators.upperCaseAlpha = {}
      }
      if (req.body.validators.includes('upperCase')) {
        fieldValidators.upperCase = {}
      }
      if (req.body.validators.includes('year')) {
        fieldValidators.year = {}
      }
    }
    if (req.body.choices) {
      choices = req.body.choices.trim().split('\n').map(x => {
        return x.trim()
      })
    }
    if (req.body.foreignKey && req.body.foreignKeyId) {
      req.body.foreignKey = `${req.body.foreignKey}.${req.body.foreignKeyId}`
    }
    if (req.body.foreignKeyDisplay && req.body.foreignKeyDisplay.includes(',')) {
      req.body.foreignKeyDisplay = req.body.foreignKeyDisplay.split(',')
    }
  } else {
    choices = req.body.choices
    fieldValidators = req.body.validators
  }
  return [{
    name: req.body.name,
    display: req.body.display || null,
    datatype: req.body.datatype,
    notNull: req.body.notNull,
    unique: req.body.unique,
    foreignKey: req.body.foreignKey || null,
    foreignKeyDisplay: req.body.foreignKeyDisplay || null,
    validators: fieldValidators || null,
    generateUniqueId: req.body.generateUniqueId || null,
    choices
  }]
}
