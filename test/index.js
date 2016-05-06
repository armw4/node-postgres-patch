/* globals describe, it */
var patch = require('../')
var assert = require('assert')

describe('node-postgres-patch', function () {
  it('should handle 1 key', function () {
    assert.equal('it was written', patch())
  })

  it('should handle 2 keys', function () {

  })

  it('should handle 3 or more keys', function () {

  })

  it('should throw if an empty object is yielded', function () {

  })
})
