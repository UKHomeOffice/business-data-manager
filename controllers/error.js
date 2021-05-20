/**
 * GET /error
 * Generic Error page.
 */
exports.error = function (req, res) {
  res.render('error', { reqPath: req.path, errorCode: req.sanitize('code').escape() })
}
