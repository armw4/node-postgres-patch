var pick = require('lodash.pick')
var decamelize = require('decamelize')
var PatchError = require('./errors').PatchError

module.exports = function () {
  var args = arguments
  var argumentArray = Object.keys(args).map(function (key) {
    return args[key]
  })

  var safeObject = pick.apply(null, argumentArray)
  var keys = Object.keys(safeObject)

  if (!keys.length) {
    throw new PatchError('expected an object with at least one key present')
  }

  var expressions = keys.map(function (key, index) {
    return decamelize(key) + ' = ' + '$' + (index + 1)
  })

  return {
    set: 'SET ' + expressions.join(', '),
    values: keys.map(function (key) {
      return safeObject[key]
    })
  }
}
