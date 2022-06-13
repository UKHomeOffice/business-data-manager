const accessControl = require('../auth/access-control')

class Authenticator {
  constructor (req) {
    this.req = req
  }

  /**
   * This can be used in templates to determine if a user has certain
   * permissions on a resource.
   * if (Authenticator.authorise('voyage', 'write')) {
   *   ...can write to voyage
   * }
   * @param resource: String: 'voyage'
   * @param permission: String: 'write'
   * @param attribute: Array
   * @returns {boolean}
   */
  authorise (resource, permission, attribute = null) {
    const userRoles = this.req.app.locals.roles || []
    return accessControl.authorise(resource, permission, userRoles, attribute)
  }

  getAllPerms (resource, attribute = null) {
    const perms = []
    for (const permission of accessControl.permissions) {
      if (this.authorise(resource, permission, attribute)) {
        perms.push(`${resource}:${permission}`)
      }
    }
    return perms
  }

  getUrl (urlObj, all = false) {
    let resource = null
    let allPerms = []
    if (typeof urlObj === 'object') {
      for (let key in urlObj) {
        if (urlObj.hasOwnProperty(key) && key.includes(':')) {
          resource = key.split(':')[0]
          allPerms = this.getAllPerms(resource)
          break
        }
      }
    }

    const defaultUrl = urlObj.defaultUrl ? urlObj.defaultUrl : ''
    let authUrl = null

    for (const index in allPerms) {
      if (urlObj.hasOwnProperty(allPerms[index])) {
        authUrl = urlObj[allPerms[index]]
        break
      }
    }

    const permUrl = authUrl || defaultUrl
    const otherUrl = urlObj.otherUrl ? urlObj.otherUrl : []

    const allUrls = [defaultUrl, permUrl, ...otherUrl]

    if (all) {
      return allUrls
    } else {
      return permUrl
    }
  }
}

module.exports = Authenticator
