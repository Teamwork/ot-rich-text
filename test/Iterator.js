const tap = require('tap')
const Iterator = require('../lib/Iterator')
const {
    createInsertText, createInsertEmbed, createRetain, createDelete
} = require('../lib/Action')

tap.test('no actions', t => {
    const operation = []
    const i = new Iterator(operation)

    t.equal(i.operation, operation)
    t.equal(i.index, 0)
    t.equal(i.action, null)
    t.equal(i.offset, 0)
    t.end()
})

tap.test('empty insert text action at the start', t => {
    const operation = [ createInsertText('') ]
    const i = new Iterator(operation)

    t.equal(i.operation, operation)
    t.equal(i.index, 1)
    t.equal(i.action, null)
    t.equal(i.offset, 0)
    t.end()
})

tap.test('empty delete action at the start', t => {
    const operation = [ createDelete(0) ]
    const i = new Iterator(operation)

    t.equal(i.operation, operation)
    t.equal(i.index, 1)
    t.equal(i.action, null)
    t.equal(i.offset, 0)
    t.end()
})

tap.test('empty retain action at the start', t => {
    const operation = [ createRetain(0) ]
    const i = new Iterator(operation)

    t.equal(i.operation, operation)
    t.equal(i.index, 1)
    t.equal(i.action, null)
    t.equal(i.offset, 0)
    t.end()
})

tap.test('insert text action', t => {
    const text = 'asese fesfsefsd fsdhjb hbj \u{101EE}'
    const action = createInsertText(text)
    const i = new Iterator([ action ])

    t.equal(i.action, action)
    t.end()
})

tap.test('insert object action', t => {
    const action = createInsertEmbed('\uE000DIV')
    const i = new Iterator([ action ])

    t.equal(i.action, action)
    t.end()
})

tap.test('retain action', t => {
    const count = 123
    const action = createRetain(count)
    const i = new Iterator([ action ])

    t.equal(i.action, action)
    t.end()
})

tap.test('delete action', t => {
    const count = 123
    const action = createDelete(count)
    const i = new Iterator([ action ])

    t.equal(i.action, action)
    t.end()
})

tap.test('move within operation', t => {
    const action0 = createInsertEmbed('\uE000DIV')
    const action1 = createInsertText('1234')
    const action2 = createRetain(10)
    const action3 = createDelete(15)
    const action4 = createRetain(20)
    const i = new Iterator([ action0, action1, action2, action3, action4 ])

    i.next(0)
    t.equal(i.action, action0)
    t.equal(i.index, 0)
    t.equal(i.offset, 0)

    i.next(1)
    t.equal(i.action, action1)
    t.equal(i.index, 1)
    t.equal(i.offset, 0)

    i.next(1)
    t.equal(i.action, action1)
    t.equal(i.index, 1)
    t.equal(i.offset, 1)

    i.next(2)
    t.equal(i.action, action1)
    t.equal(i.index, 1)
    t.equal(i.offset, 3)

    i.next(2)
    t.equal(i.action, action2)
    t.equal(i.index, 2)
    t.equal(i.offset, 1)

    i.next(25)
    t.equal(i.action, action4)
    t.equal(i.index, 4)
    t.equal(i.offset, 1)

    i.next(Infinity)
    t.equal(i.action, null)
    t.equal(i.index, 5)
    t.equal(i.offset, 0)

    t.end()
})
