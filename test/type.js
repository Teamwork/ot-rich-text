const assert = require('chai').assert
const type = require('../lib/type')
const {
    create, isNoop, compose, apply, applyAndInvert, transform, normalize,
    transformCursor, diffX, createPresence, transformPresence, comparePresence
} = require('../lib/Operation')

describe('type', function() {
    it('exports properties', function() {
        assert.strictEqual(type.name, 'ot-rich-text')
        assert.strictEqual(type.uri, 'https://github.com/Teamwork/ot-rich-text')
        assert.strictEqual(type.create, create)
        assert.strictEqual(type.isNoop, isNoop)
        assert.strictEqual(type.compose, compose)
        assert.strictEqual(type.apply, apply)
        assert.strictEqual(type.applyAndInvert, applyAndInvert)
        assert.strictEqual(type.transform, transform)
        assert.strictEqual(type.normalize, normalize)
        assert.strictEqual(type.transformCursor, transformCursor)
        assert.strictEqual(type.diffX, diffX)
        assert.strictEqual(type.createPresence, createPresence)
        assert.strictEqual(type.transformPresence, transformPresence)
        assert.strictEqual(type.comparePresence, comparePresence)
    })
})
