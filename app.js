'use strict'

/* eslint camelcase: 0 */

const express = require('express')
const sassMiddleware = require('node-sass-middleware')
const session = require('express-session')

const bodyParser = require('body-parser')
const compression = require('compression')
const errorHandler = require('errorhandler')
const { check } = require('express-validator')
const flash = require('express-flash')
const lusca = require('lusca')
const morgan = require('morgan')
// multer is only need to support file uploads (not currently a feature but likely an enhancement in the future)
// const multer = require('multer');
const path = require('path')
const passport = require('passport')
// const pg = require('pg');
const PgSession = require('connect-pg-simple')(session)
// multer is only need to support file uploads (not currently a feature but likely an enhancement in the future)
// const upload = multer({ dest: path.join(__dirname, 'uploads') });
const { handleRoles } = require('./auth/authToken')
const Authenticator = require('./lib/Authenticator')

const config = require('./config/core')
const Datasets = require('./models/datasets')
const logger = require('./logger')
const db = require('./db')
const routes = require('./routes')
const nunjucksConfig = require('./nunjucks.config')
const production = process.env.NODE_ENV === 'production'

/**
 * Create Express server.
 */
const app = express()

/**
 * Express configuration.
 */
app.set('port', config.port)
nunjucksConfig.register(app, [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'node_modules/govuk-frontend')
], production)

app.set('view engine', 'html')

if (production) {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.sessionSecret,
  store: new PgSession({
    pool: db
  })
}))
app.use(passport.initialize())
app.use(passport.session({ cookie: { maxAge: 60000 }}))
app.use(flash())
app.use(lusca.csrf())
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.use((req, res, next) => {
  res.locals.user = req.user
  next()
})
app.use(handleRoles)
app.use(function (req, res, next) {
  res.locals.Authenticator = new Authenticator(req)
  next()
})
app.use(compression())

// Catch errors from being displayed
app.use(function (err, req, res, next) {
  if (err) {
    logger.error(err)
    req.flash('errors', { msg: `${err.message}` })
    res.redirect(`/error?code=${err.code || res.statusCode || 500}`)
  } else if (err) {
    next(err)
  } else {
    next(req, res)
  }
})

/**
 * App routes
 */
app.use(routes.router)

/**
 * local variables required for govuk-template-jinja to work
 */
app.locals.app_title = config.title
app.locals.asset_path = '/base/'
app.locals.homepage_url = '/'
app.locals.logo_link_title = config.title
app.locals.navbar = routes.navbar

app.use(
  sassMiddleware(
    {
      src: path.join(__dirname, 'sass'),
      dest: path.join(__dirname, 'public', 'css'),
      debug: true,
      force: true,
      outputStyle: 'compressed',
      prefix: '/css',
      includePaths: [
        'node_modules/govuk_frontend_toolkit/stylesheets',
        'node_modules/govuk-elements-sass/public/sass'
      ],
      sourceComments: 'map',
      error: function (severity, key, value) { logger.error(`node-saas-middleware: ${severity}, ${key}, ${value}`) },
      log: function (severity, key, value) { logger.info(`node-saas-middleware: ${severity}, ${key}, ${value}`) }
    }
  ))
app.use(express.static(path.join(__dirname, 'public/')))

/**
 * Error Handler.
 */
app.use(errorHandler())

/**
 * Start Express server.
 */
const server = require('http').Server(app)
server.listen(app.get('port'), () => {
  logger.info(`Express server listening on port ${app.get('port')} in ${process.env.NODE_ENV || 'dev'} mode`)
})

/**
 * Run some startup checks; including making sure that the datasets table
 * exists
 */
const datasets = new Datasets()
datasets.dbChecks()
  .then(result => {
    if (result.statusCode === '200') {
      logger.info('Startup checks completed successfully')
    } else {
      logger.warn('Startup checks failed')
    }
  })
  .catch(err => {
    logger.error(err)
  })

module.exports = app
