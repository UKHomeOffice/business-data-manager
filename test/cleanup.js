'use strict'

/* eslint func-names: 0 */

const db = require('../db')

before(function () {
  // global pre-test actions
})

after(function () {
  // global post-test actions
  db.end()
})
