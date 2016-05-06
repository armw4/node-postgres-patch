/* globals describe, it */

var patch = require('../')
var assert = require('assert')
var PatchError = require('../errors').PatchError

describe('node-postgres-patch', function () {
  it('should handle 3 keys using a variable argument list of keys', function () {
    var output = patch({
      abstractSyntaxTree: 'jason Murray',
      antwan: JSON.stringify({ jason: 'Murray Jr' })
    }, 'abstractSyntaxTree', 'antwan', 'wimberly')

    var expectedOutput = {
      set: 'SET abstract_syntax_tree = $1, antwan = $2',
      values: ['jason Murray', '{"jason":"Murray Jr"}']
    }

    assert.deepEqual(output, expectedOutput)
  })

  it('should handle 3 keys using an array of keys', function () {
    var output = patch({
      wimberly: 39,
      antwan: JSON.stringify({ jason: 'Murray Jr' }),
      abstractSyntaxTree: 'jason Murray'
    }, ['abstractSyntaxTree', 'antwan', 'wimberly'])

    var expectedOutput = {
      set: 'SET abstract_syntax_tree = $1, antwan = $2, wimberly = $3',
      values: ['jason Murray', '{"jason":"Murray Jr"}', 39]
    }

    assert.deepEqual(output, expectedOutput)
  })

  it('should handle 1 key', function () {
    var output = patch({
      wimberly: 39,
      antwan: JSON.stringify({ jason: 'Murray Jr' }),
      massAssignment: 'for push a commit to core rails'
    }, 'antwan')

    var expectedOutput = {
      set: 'SET antwan = $1',
      values: ['{"jason":"Murray Jr"}']
    }

    assert.deepEqual(output, expectedOutput)
  })

  it('should throw if an empty object is yielded', function () {
    var fn = function () {
      patch({
        unsafeCode: 39,
        massAssignment: 'for push a commit to core rails via GitHub attack vector'
      }, 'antwan')
    }

    assert.throws(fn, PatchError)
  })
})
