const assert = require('chai').assert
const Iterator = require('../src/Iterator')
const {
    createInsertText, createInsertEmbed, createRetain, createDelete
} = require('../src/Action')

describe('Iterator', function () {
    it('no actions', function () {
        const operation = []
        const i = new Iterator(operation)

        assert.strictEqual(i.operation, operation)
        assert.strictEqual(i.index, 0)
        assert.strictEqual(i.action, null)
        assert.strictEqual(i.offset, 0)
    })

    it('empty insert text action at the start', function () {
        const operation = [ createInsertText('') ]
        const i = new Iterator(operation)

        assert.strictEqual(i.operation, operation)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.action, null)
        assert.strictEqual(i.offset, 0)
    })

    it('empty delete action at the start', function () {
        const operation = [ createDelete(0) ]
        const i = new Iterator(operation)

        assert.strictEqual(i.operation, operation)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.action, null)
        assert.strictEqual(i.offset, 0)
    })

    it('empty retain action at the start', function () {
        const operation = [ createRetain(0) ]
        const i = new Iterator(operation)

        assert.strictEqual(i.operation, operation)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.action, null)
        assert.strictEqual(i.offset, 0)
    })

    it('insert text action', function () {
        const text = 'asese fesfsefsd fsdhjb hbj \u{101EE}'
        const action = createInsertText(text)
        const i = new Iterator([ action ])

        assert.strictEqual(i.action, action)
    })

    it('insert object action', function () {
        const action = createInsertEmbed('\uE000DIV')
        const i = new Iterator([ action ])

        assert.strictEqual(i.action, action)
    })

    it('retain action', function () {
        const count = 123
        const action = createRetain(count)
        const i = new Iterator([ action ])

        assert.strictEqual(i.action, action)
    })

    it('delete action', function () {
        const count = 123
        const action = createDelete(count)
        const i = new Iterator([ action ])

        assert.strictEqual(i.action, action)
    })

    it('move within operation', function () {
        const action0 = createInsertEmbed('\uE000DIV')
        const action1 = createInsertText('1234')
        const action2 = createRetain(10)
        const action3 = createDelete(15)
        const action4 = createRetain(20)
        const i = new Iterator([ action0, action1, action2, action3, action4 ])

        i.next(0)
        assert.strictEqual(i.action, action0)
        assert.strictEqual(i.index, 0)
        assert.strictEqual(i.offset, 0)

        i.next(1)
        assert.strictEqual(i.action, action1)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.offset, 0)

        i.next(1)
        assert.strictEqual(i.action, action1)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.offset, 1)

        i.next(2)
        assert.strictEqual(i.action, action1)
        assert.strictEqual(i.index, 1)
        assert.strictEqual(i.offset, 3)

        i.next(2)
        assert.strictEqual(i.action, action2)
        assert.strictEqual(i.index, 2)
        assert.strictEqual(i.offset, 1)

        i.next(25)
        assert.strictEqual(i.action, action4)
        assert.strictEqual(i.index, 4)
        assert.strictEqual(i.offset, 1)

        i.next(Infinity)
        assert.strictEqual(i.action, null)
        assert.strictEqual(i.index, 5)
        assert.strictEqual(i.offset, 0)
    })
})
