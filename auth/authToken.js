const logger = require('../logger')
const config = require('./config')

const handleRoles = (req, res, next) => {
  try {
    const email = (req.get('X-Auth-Email') || 'no-email')
    const roles = (req.get('X-Auth-Roles') || `${config.roles.superUserRole},BDM-ORG-GAIT`).split(',')
    let userRole
    for (let r of Object.values(config.roles)) {
      if (roles.includes(r)) {
        userRole = r
        break
      }
    }
    if (req.app.locals) {
      req.app.locals.roles = roles
      req.app.locals.email = email
      req.app.locals.userRole = userRole
    } else {
      req.app.locals = {roles, email, userRole}
    }
    req.app.locals.orgs = req.app.locals.roles.filter(role => {
      return role.startsWith('BDM-ORG-')
    })
    next()
  } catch (e) {
    logger.log('error', 'Error occured whilst fetching roles')
    logger.log('error', e)
    next(e)
  }
}

module.exports = {handleRoles}
