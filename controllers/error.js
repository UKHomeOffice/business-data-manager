/**
 * GET /error
 * Generic Error page.
 */
const { check } = require('express-validator')

exports.error = function (req, res) {
  res.render('error', { reqPath: req.path, errorCode: check('code').escape() })
}
