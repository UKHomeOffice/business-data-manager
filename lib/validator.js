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
  }, '<%- field %>: <%- value %> must be uppercase')
}

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
          let errorMessage
          if (callable.errorMessage) {
            const template = _.template(callable.errorMessage)
            errorMessage = template({
              field: field.name,
              value: escape(this.values[field.name])
            })
          } else {
            const opts = Object.keys(options).map(key => {
              return `${key}: ${options[key]}`
            }).join(', ')
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
