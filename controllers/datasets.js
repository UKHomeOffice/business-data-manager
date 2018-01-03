'use strict';

const Dataset = require('../models/dataset');
const Datasets = require('../models/datasets');
const logger = require('../logger');

/**
 * GET /v1/datasets
 * @returns summary info about the current datasets
 */
exports.getDatasets = (req, res) => {
  let datasets = new Datasets();
  datasets.findAll()
    .then(result => {
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getDatasets sending HTML response');
            res.status(200).render('getDatasets', {
              title: 'Current datasets',
              data: result.data
            });
          },
          json: () => {
            logger.verbose('getDatasets sending JSON response');
            res.status(200).json(result.data);
          },
          default: () => {
            logger.verbose('getDatasets invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      // findAll() can only respond with either 200 or an error so there is
      // currently no additional handling here
    })
    .catch(err => {
      logger.error(err);
    });
};


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

  let dataset = new Dataset(req.body.name, req.body.idType, req.body.fields);
  dataset.post()
    .then(result => {
      // check the result for successful creation
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response');
            // flash notify that dataset was created successfully
            req.flash('success', { msg: 'Dataset created' });
            // redirect to GET datasets/:dataset
            res.status(201).redirect('/v1/datasets/' + req.body.name);
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response');
            let uri = `/v1/datasets/${req.body.name}`
            res.status(201).json({uri: uri, action: 'Created'});
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response');
            req.flash('errors', { msg: `Dataset could not be created with the name: ${req.body.name}` });
            res.status(422).redirect('/v1/datasets/');
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response');
            let uri = `/v1/datasets/${req.body.name}`
            res.status(422).json({uri: uri, action: 'Unprocessable Entity'});
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      // other catch an unexpected response code
    })
    .catch(err => {
      logger.error(err);
    });
};


/**
 * GET /v1/datasets/:dataset
 *
 * @param {String} dataset - name of the dataset, used to name the table
 */
exports.getDataset = (req, res) => {
  let dataset = new Dataset(req.params.dataset);
  dataset.findOne()
    .then(result => {
      if (result.statusCode === '200') {
        res.format({
          html: () => {
            logger.verbose('getDataset sending HTML response');
            res.status(200).render('getDataset', {title: 'Dataset', data: result.data});
          },
          json: () => {
            logger.verbose('getDataset sending JSON response');
            res.status(200).json(result.data);
          },
          default: () => {
            logger.verbose('getDataset invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      if (result.statusCode === '404') {
        res.format({
          html: () => {
            logger.verbose('getDataset sending HTML response');
            // flash notify that dataset could not be found
            req.flash('errors', { msg: `No dataset found with the name ${req.params.dataset}` });
            res.status(200).redirect('/v1/datasets');
          },
          json: () => {
            logger.verbose('getDataset sending JSON response');
            // respond that dataset could not be created
            res.status(404).json({status: '404', message: 'NOT FOUND'});
          },
          default: () => {
            logger.verbose('getDataset invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      // other catch an unexpected response code
    })
    .catch(err => {
      logger.error(err);
    });
};


/**
 * DELETE /v1/datasets/:dataset
 * POST /v1/datasets/:dataset/delete
 *
 * @param dataset (string) extracted from the request URL parameters
 * @param name (string) passed in the request body and used for verification
 *
 * @returns success/failure
 */
exports.deleteDataset = (req, res) => {
  // check the req.body.name matches the req.params.dataset
  if (req.body.name === req.params.dataset) {
    logger.verbose('Verification check for dataset deletion passed');
    let dataset = new Dataset(req.params.dataset);
    dataset.delete()
      .then(deleteResult => {
        if (deleteResult.statusCode === '200') {
          res.format({
            html: () => {
              logger.verbose('deleteDataset sending HTML response');
              req.flash('success', {msg: `The ${req.params.dataset} dataset has been deleted.`});
              res.status(200).redirect('/v1/datasets/');
            },
            json: () => {
              logger.verbose('deleteDataset sending JSON response');
              let uri = `/v1/datasets/${req.body.name}`
              res.status(200).json({uri: uri, action: 'Deleted'});
            },
            default: () => {
              logger.verbose('deleteDataset invalid format requested');
              res.status(406).send('Invalid response format requested');
            }
          });
        }
        if (deleteResult.statusCode === '422') {
          res.format({
            html: () => {
              logger.verbose('deleteDataset sending HTML response');
              let flashMsg = 'Deletion failed due to an issue in the database.' +
                             'Please contact a system administrator.';
              req.flash('errors', {msg: flashMsg});
              res.status(200).redirect('/v1/datasets/' + req.params.dataset);
            },
            json: () => {
              logger.verbose('deleteDataset sending JSON response');
              res.status(422).json({status: '422', message: 'UNPROCESSABLE ENTITY'});
            },
            default: () => {
              logger.verbose('deleteDataset invalid format requested');
              res.status(406).send('Invalid response format requested');
            }
          });
        }
        // other catch an unexpected response code
      })
      .catch(err => {
        logger.error(err);
      });
  } else {
    logger.verbose('Verification check for dataset deletion failed');
    res.format({
      html: () => {
        logger.verbose('deleteDataset sending HTML response');
        let flashMsg = `The ${req.params.dataset} dataset has not been deleted.
                        Verification code (${req.body.name}) supplied does not
                        match dataset name (${req.params.dataset})`;
        req.flash('errors', {msg: flashMsg});
        res.status(200).redirect('/v1/datasets/' + req.params.dataset);
        logger.verbose('*** got here and ??? ***');
      },
      json: () => {
        logger.verbose('deleteDataset sending JSON response');
        res.status(400).json({status: '400', message: 'BAD REQUEST'});
      },
      default: () => {
        logger.verbose('deleteDataset invalid format requested');
        res.status(406).send('Invalid response format requested');
      }
    });
  }
};


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
  let fields = [{
    name: req.body.name,
    datatype: req.body.datatype,
    notNull: req.body.notNull,
    unique: req.body.unique
  }];
  let dataset = new Dataset(req.params.dataset, '', fields);
  dataset.postProperty()
    .then(result => {
      // check the result for successful creation
      if (result.statusCode === '201') {
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response');
            // flash notify that dataset was created successfully
            req.flash('success', { msg: 'Dataset updated' });
            // redirect to GET datasets/:dataset
            res.status(201).redirect('/v1/datasets/' + req.params.dataset);
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response');
            res.status(201).json({name: req.body.name, action: 'Created'});
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      if (result.statusCode === '422') {
        // respond with an error about creating the dataset
        res.format({
          html: () => {
            logger.verbose('postDatasets sending HTML response');
            // flash notify that dataset could not be created
            // redirect to GET datasets
          },
          json: () => {
            logger.verbose('postDatasets sending JSON response');
            // respond that dataset could not be created
          },
          default: () => {
            logger.verbose('postDatasets invalid format requested');
            res.status(406).send('Invalid response format requested');
          }
        });
      }
      // other catch an unexpected response code
    })
    .catch(err => {
      logger.error(err);
    });
};


/**
 * GET /v1/datasets/:dataset/properties/:property
 * @returns detailed info about a single property
 */
// exports.getDatasetProperty = (req, res) => {
//   // do something
// };
