'use strict'

const escapeLiteral = (str) => {
  let hasBackslash = false
  let escaped = '\''

  for (let i = 0; i < str.length; i++) {
    let c = str[i]
    if (c === '\'') {
      escaped += c + c
    } else if (c === '\\') {
      escaped += c + c
      hasBackslash = true
    } else {
      escaped += c
    }
  }

  escaped += '\''

  if (hasBackslash === true) {
    escaped = ' E' + escaped
  }

  return escaped
}

module.exports.escapeLiteral = escapeLiteral
