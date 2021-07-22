const AccessControl = require('role-acl')
const roles = require('./config').roles

/**
 * Sets permissions for each of the roles we have.
 * -
 * These can be set in multiple ways with inheritance and can be stored as
 * single records in a JSON file or in a database.
 * https://github.com/tensult/role-acl
 * -
 * Actions can be one of read, write or *. Although they can be anything such
 * as one of create, read, update, delete but our application only has the
 * notion of read/write/none.
 */

let grantsObject = {
  [roles.superUserRole]: {
    grants: [
      {
        resource: 'dataset', action: '*', attributes: ['*']
      },
      {
        resource: 'item', action: '*', attributes: ['*']
      }
    ]
  },
  [roles.standardUserRole]: {
    grants: [
      {
        resource: 'dataset', action: 'write', attributes: ['*']
      },
      {
        resource: 'item', action: 'write', attributes: ['*']
      }
    ]
  },
  [roles.readOnlyRole]: {
    grants: [
      {
        resource: 'dataset', action: 'read', attributes: ['*']
      },
      {
        resource: 'item', action: 'read', attributes: ['*']
      }
    ]
  },
}

const accessControl = new AccessControl(grantsObject)

const authorise = (resource, permission, userRoles, attribute = null) => {
  const userAccessRoles = userRoles.filter(role => {
    return grantsObject.hasOwnProperty(role)
  })
  return userAccessRoles.some((role) => {
    const perm = accessControl.can(role).execute(permission).sync().on(resource)
    let attributePerm = true
    if (attribute) {
      if (perm.attributes.includes(`!${attribute}`) || !(perm.attributes.includes('*') || perm.attributes.includes(attribute))) {
        attributePerm = false
      }
    }
    if (perm.granted && attributePerm) {
      return true
    }
  })
}

const permissions = [
  'delete',
  'write',
  'read'
]

module.exports = {
  authorise,
  permissions
}
