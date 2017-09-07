const tap = require('tap')
const Iterator = require('../lib/Iterator')
const {
    createInsertText, createInsertObject, createRetain, createDelete
} = require('../lib/Operation')
const objectContent = '\uE000DIV'

tap.test('no operations', t => {
    const operations = []
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 0)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('empty insert text operation at the start', t => {
    const operations = [ createInsertText() ]
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 1)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('empty insert object operation at the start', t => {
    const operations = [ createInsertObject() ]
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 1)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('empty delete operation at the start', t => {
    const operations = [ createDelete() ]
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 1)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('empty retain operation at the start', t => {
    const operations = [ createRetain() ]
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 1)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('unknown operation at the start', t => {
    const operations = [ [ 12345, 12345 ] ]
    const i = new Iterator(operations)

    t.equal(i.operations, operations)
    t.equal(i.index, 1)
    t.equal(i.hasOperation, false)
    t.equal(i.operation, null)
    t.equal(i.operationLength, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)
    t.end()
})

tap.test('insert text operation', t => {
    const text = 'asese fesfsefsd fsdhjb hbj \u{101EE}'
    const operation = createInsertText(text)
    const i = new Iterator([ operation ])

    t.equal(i.hasOperation, true)
    t.equal(i.operation, operation)
    t.equal(i.operationLength, text.length)
    t.end()
})

tap.test('insert object operation', t => {
    const operation = createInsertObject(objectContent)
    const i = new Iterator([ operation ])

    t.equal(i.hasOperation, true)
    t.equal(i.operation, operation)
    t.equal(i.operationLength, 1)
    t.end()
})

tap.test('retain operation', t => {
    const count = 123
    const operation = createRetain(count)
    const i = new Iterator([ operation ])

    t.equal(i.hasOperation, true)
    t.equal(i.operation, operation)
    t.equal(i.operationLength, count)
    t.end()
})

tap.test('delete operation', t => {
    const count = 123
    const operation = createDelete(count)
    const i = new Iterator([ operation ])

    t.equal(i.hasOperation, true)
    t.equal(i.operation, operation)
    t.equal(i.operationLength, count)
    t.end()
})

tap.test('move within operation', t => {
    const operation0 = createInsertObject(objectContent)
    const operation1 = createInsertText('1234')
    const operation2 = createRetain(10)
    const operation3 = createDelete(15)
    const operation4 = createRetain(20)
    const i = new Iterator([ operation0, operation1, operation2, operation3, operation4 ])

    i.next(0)
    t.equal(i.operation, operation0)
    t.equal(i.index, 0)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 1)

    i.next(1)
    t.equal(i.operation, operation1)
    t.equal(i.index, 1)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 4)

    i.next(1)
    t.equal(i.operation, operation1)
    t.equal(i.index, 1)
    t.equal(i.offset, 1)
    t.equal(i.remaining, 3)

    i.next(2)
    t.equal(i.operation, operation1)
    t.equal(i.index, 1)
    t.equal(i.offset, 3)
    t.equal(i.remaining, 1)

    i.next(2)
    t.equal(i.operation, operation2)
    t.equal(i.index, 2)
    t.equal(i.offset, 1)
    t.equal(i.remaining, 9)

    i.next(25)
    t.equal(i.operation, operation4)
    t.equal(i.index, 4)
    t.equal(i.offset, 1)
    t.equal(i.remaining, 19)

    i.next(Infinity)
    t.equal(i.operation, null)
    t.equal(i.index, 5)
    t.equal(i.offset, 0)
    t.equal(i.remaining, 0)

    t.end()
})
