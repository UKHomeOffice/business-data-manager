const nunjucks = require('nunjucks')
const filters = require('./lib/filters')

exports.register = (app, viewPath, production) => {
  /**
   * Registers nunjucks on app
   */
  const nunjucksConfig = {
    autoescape: true,
    express: app
  }

  if (!production) {
    nunjucksConfig.noCache = true
    nunjucksConfig.watch = true
  }

  const env = nunjucks.configure(viewPath, nunjucksConfig)
  nunjucks.installJinjaCompat()
  env.addFilter('startsWith', filters.startsWith)
  env.addFilter('startsWithArr', filters.startsWithArr)
  env.addFilter('cCapitalize', filters.cCapitalize)
  env.addFilter('split', filters.split)
  env.addFilter('getUrl', filters.getUrl)
  env.addFilter('basePath', filters.basePath)
  env.addFilter('getReverseSubsetMatch', filters.getReverseSubsetMatch)
}
