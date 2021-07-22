const logger = require('../logger')
const authorise = require('./access-control').authorise

const routeAuthenticator = (resource, permission, attribute = null) => {
  return (req, res, next) => {
    logger.log('debug', 'Running route authenticator')
    logger.log('debug', 'process.env.GAIT_ROLE: ' + process.env.GAIT_ROLE)
    logger.log('debug', 'process.env.GAIT_SUPERUSER_ROLE: ' + process.env.GAIT_SUPERUSER_ROLE)
    logger.log('debug', 'process.env.GAIT_READONLY_ROLE: ' + process.env.GAIT_READONLY_ROLE)
    req.app.locals = req.app.locals || {}
    const userRoles = req.app.locals.roles || []
    logger.log('debug', 'Route authenticate for routes ' + userRoles.toString())
    const perm = authorise(resource, permission, userRoles, attribute)
    if (perm && next) {
      next()
    } else if (!perm) {
      logger.log('error', 'Route denied for ' + userRoles.toString())
      res.status(401).send('Not authorised')
    }
  }
}

exports.routeAuthenticator = routeAuthenticator
