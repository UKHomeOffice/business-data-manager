const roles = {
  superUserRole: (process.env.BDM_SUPERUSER_ROLE || 'BDM-SUPERUSER').trim(),
  standardUserRole: (process.env.BDM_STANDARD_ROLE || 'BDM-STANDARD-USER').trim(),
  readOnlyRole: (process.env.BDM_READONLY_ROLE || 'BDM-READONLY-USER').trim(),
}

module.exports = {
  roles
}
