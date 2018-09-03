const assert = require('chai').assert
const index = require('../src/index')
const type = require('../src/type')
const Action = require('../src/Action')
const Iterator = require('../src/Iterator')
const Operation = require('../src/Operation')

describe('index', function () {
    it('exports properties', function () {
        assert.strictEqual(index.type, type)
        assert.strictEqual(index.Action, Action)
        assert.strictEqual(index.Iterator, Iterator)
        assert.strictEqual(index.Operation, Operation)
    })
})
