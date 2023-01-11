const _ = require('lodash')

class Callable extends Function {
  constructor (fn, errorMessage) {
    super()
    this.errorMessage = errorMessage
    return new Proxy(this, {
      apply: (target, thisArg, args) => fn(...args)
    })
  }
}

const validators = {
  regExValidator: new Callable((val, regex) => {
    const re = new RegExp(regex)
    return re.test(val)
  }, ''),

  stringLength: new Callable((val, { min, max }) => {
    return min <= val.length && val.length <= max
  }, ''),

  upperCaseAlpha: new Callable((val) => {
    return /^[A-Z]*$/.test(val)
  }, ''),

  upperCaseAlphaNumeric: new Callable((val) => {
    return /^[A-Z0-9]*$/.test(val)
  }, ''),

  upperCase: new Callable((val) => {
    return val === val.toUpperCase()
  }, '<%- field %>: <%= value %> must be uppercase'),

  enum: new Callable((val, { choices }) => {
    return choices.includes(val)
  }, '<%- field %>: <%= value %> must be one of <%- opts %>'),

  year: new Callable((val) => {
    if (isNaN(val)) {
      return false
    }
    const year = parseInt(val)
    return year >= 1900 && year <= 9999
  }, '<%- field %>: <%= value %> must be four digit number between 1900 and 9999')
}

exports.validators = validators

class Validator {
  constructor (dataset, values) {
    this.dataset = dataset
    this.values = values
  }

  /**
   * validators = {
   *   stringLength: {min: 3, max: 3},
   *   upperCaseAlpha: {}
   * }
   */
  validate () {
    const errors = []
    for (const field of this.dataset.fields) {
      const fieldValidators = field.validators || {};
      for (const [validator, options] of Object.entries(fieldValidators)) {
        const callable = validators[validator]
        if (this.values[field.name] && !callable(this.values[field.name], options)) {
          const opts = Object.keys(options).map(key => {
            return `${key}: ${options[key]}`
          }).join(', ')
          let errorMessage
          if (callable.errorMessage) {
            const template = _.template(callable.errorMessage)
            errorMessage = template({
              field: field.name,
              value: this.values[field.name],
              opts
            })
          } else {
            errorMessage = `${field.name}: ${this.values[field.name]} is not valid for ${validator} ${opts}`
          }
          errors.push(errorMessage)
        }
      }
    }
    return errors
  }
}

exports.Validator = Validator

const sanatize = (dataset, requestBody) => {
  const formBody = {}
  for (const field of dataset.fields) {
    switch (field.datatype) {
      case 'DATE':
        if (requestBody[field.name + '-year'] || requestBody[field.name + '-month'] || requestBody[field.name + '-day']) {
          formBody[field.name] = `${requestBody[field.name + '-year'].padStart(4, '0')}-${requestBody[field.name + '-month'].padStart(2, '0')}-${requestBody[field.name + '-day'].padStart(2, '0')}`
        } else {
          formBody[field.name] = requestBody[field.name] || null
        }
        break
      default:
        formBody[field.name] = typeof requestBody[field.name] === 'undefined' ? null : requestBody[field.name]
    }
  }
  if (requestBody.hasOwnProperty('id')) {
    formBody.id = requestBody.id
  }
  return formBody
}

exports.sanatize = sanatize
