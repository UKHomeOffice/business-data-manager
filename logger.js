'use strict'

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, prettyPrint } = format

const config = require('./config/core')

const logger = createLogger({
  level: config.logLevel || 'info',
  format: combine(
    label({ label: config.name }),
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
})

module.exports = logger
