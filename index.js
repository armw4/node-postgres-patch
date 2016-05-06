var pick = require('lodash.pick')
var decamelize = require('decamelize')
var array = require('make-array')
var PatchError = require('./errors').PatchError

module.exports = function () {
  var safeObject = pick.apply(null, array(arguments))
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
