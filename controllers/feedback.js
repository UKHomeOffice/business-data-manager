'use strict'

const logger = require('../logger')

/**
 * GET /feedback
 * @returns renders the feedback page
 */
exports.getFeedback = (req, res) => {
  res.format({
    html: () => {
      logger.verbose('Sending HTML response')
      res.status(200).render('feedback', {
        title: 'Submit feedback'
      })
    },
    default: () => {
      logger.verbose('Invalid format requested')
      res.status(406).send('Invalid response format requested')
    }
  })
}

/**
 * POST /feedback
 * @returns redirect to home page or thank you page
 */
exports.postFeedback = (req, res) => {
  // need to process and store/alert on feedback

}
