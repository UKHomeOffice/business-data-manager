
const validators = {
  regExValidator: (val, regex) => {
    const re = new RegExp(regex)
    return re.test(val)
  },
  stringLength: (val, { min, max }) => {
    return min <= val.length && val.length <= max
  },
  upperCaseAlpha: (val) => {
    return /^[A-Z]*$/.test(val)
  },
  upperCaseAlphaNumeric: (val) => {
    return /^[A-Z0-9]*$/.test(val)
  },
  upperCase: (val) => {
    return val === val.toUpperCase()
  },
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
        if (this.values[field.name] && !validators[validator](this.values[field.name], options)) {
          const opts = Object.keys(options).map(key => {
            return `${key}: ${options[key]}`
          }).join(', ')
          errors.push(`${field.name}: ${this.values[field.name]} is not valid for ${validator} ${opts}`)
        }
      }
    }
    return errors
  }
}

exports.Validator = Validator
