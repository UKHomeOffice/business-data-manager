'use strict'

const logger = require('../logger')

/**
 * GET /
 * @returns summary info about the current datasets
 */
exports.getHome = (req, res) => {
  res.format({
    html: () => {
      logger.verbose('Sending HTML response')
      res.status(200).render('home', {
        title: 'Home',
      })
    },
    default: () => {
      logger.verbose('Invalid format requested')
      res.status(406).send('Invalid response format requested')
    }
  })
}
