const _ = require('lodash')

const basePath = (path) => {
  const urlArr = path.split('/')
  if (urlArr.length > 2) {
    urlArr.pop()
  }

  return urlArr.join('/')
}

/**
 * Capitalize each word in sentence
 */
const capitalizeWords = value => {
  return value.toLowerCase().replace(/\b\w/g, l => {
    return l.toUpperCase()
  })
}
exports.capitalizeWords = capitalizeWords

/**
 * Returns true if any fillString starts with searchString in array
 */
const startsWithArr = (searchString, arrayObject) => {
  let match = false
  if (typeof searchString !== 'undefined' && Array.isArray(arrayObject)) {
    arrayObject.forEach(string => {
      if (string) {
        if (searchString.startsWith(string)) {
          match = true
        }

        if (searchString.search(string) !== -1) {
          match = true
        }
      }
    })
  }

  return match
}

exports.startsWithArr = startsWithArr

/**
 * Returns true if fillString starts with searchString
 */
exports.startsWith = (fullString, searchString) => {
  return fullString ? fullString.startsWith(searchString) : false
}

/**
 * Returns true if fillString starts with searchString
 */
const getUrl = (urlObj, isSuper, all = false) => {
  const defaultUrl = urlObj.defaultUrl ? urlObj.defaultUrl : ''
  const superUrl = urlObj.superUrl ? urlObj.superUrl : defaultUrl
  const otherUrl = urlObj.otherUrl ? urlObj.otherUrl : []

  const allUrls = [defaultUrl, superUrl, ...otherUrl]
  return all ? allUrls : isSuper ? superUrl : defaultUrl
}
exports.getUrl = getUrl

/**
 * Returns function for splitting string based on delimiter and returning array
 * @param string
 * @param delimiter
 * @returns {string[]}
 */
const split = (string, delimiter = '/') => {
  return typeof string === 'string' ? string.split(delimiter) : string
}
exports.split = split

/**
 * Method for custom capitalization
 * @param string
 * @returns {*}
 */
const cCapitalize = (string) => {
  const dict = {
    iom: 'Isle of Man',
    flightplans: 'Flights',
    flightplan: 'Flight',
    gar: 'GAR',
    gars: 'GARs',
    persontype: 'Person Type'
  }

  string = _.toString(string).toLowerCase()

  return dict[string] ? dict[string] : capitalizeWords(string)
}
exports.cCapitalize = cCapitalize

/**
 * Returns true if fillString starts with searchString
 */
exports.basePath = basePath

const getReverseSubsetMatch = (searchString, arrayObject) => {
  let match = false
  if (typeof searchString !== 'undefined' && Array.isArray(arrayObject)) {
    // eslint-disable-next-line array-callback-return
    arrayObject.some(string => {
      const stringSlash = string.match(/\//g).length
      const searchSlash = searchString.match(/\//g).length
      const slashDiff = searchSlash - stringSlash
      if (string && slashDiff < 2 && slashDiff >= 0) {
        match = searchString.match(string)
        if (match) {
          return true
        }
      }
    })
  }
  return match ? match[0] : ''
}
exports.getReverseSubsetMatch = getReverseSubsetMatch

/**
 * Returns field names from properties
 */
const fieldNames = (properties) => {
  const names = []
  properties.forEach(fieldProp => {
    names.push(fieldProp.field)
  })
  return names
}
exports.fieldNames = fieldNames
