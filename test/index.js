const assert = require('chai').assert
const index = require('../index')
const type = require('../lib/type')
const Action = require('../lib/Action')
const Iterator = require('../lib/Iterator')
const Operation = require('../lib/Operation')

describe('index', function () {
    it('exports properties', function () {
        assert.strictEqual(index.type, type)
        assert.strictEqual(index.Action, Action)
        assert.strictEqual(index.Iterator, Iterator)
        assert.strictEqual(index.Operation, Operation)
    })
})
