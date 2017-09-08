const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    getLength,
    slice,
    merge,
    INVALID_OPERATION
} = require('../lib/Operation')
const invalidObjectContent = '\uE000'
const validObjectContent = '\uE000DIV'

tap.test('getLength', t => {
    t.equal(getLength(createInsertText('hello')), 5)
    t.equal(getLength(createInsertOpen(validObjectContent)), 1)
    t.equal(getLength(createInsertClose(validObjectContent)), 1)
    t.equal(getLength(createInsertEmbed(validObjectContent)), 1)
    t.equal(getLength(createRetain(5)), 5)
    t.equal(getLength(createDelete(5)), 5)

    t.equal(getLength(INVALID_OPERATION), 0)
    t.equal(getLength(createInsertText()), 0)
    t.equal(getLength(createInsertOpen()), 0)
    t.equal(getLength(createInsertOpen(invalidObjectContent)), 0)
    t.equal(getLength(createInsertClose()), 0)
    t.equal(getLength(createInsertClose(invalidObjectContent)), 0)
    t.equal(getLength(createInsertEmbed()), 0)
    t.equal(getLength(createInsertEmbed(invalidObjectContent)), 0)
    t.equal(getLength(createRetain()), 0)
    t.equal(getLength(createRetain(-1)), 0)
    t.equal(getLength(createDelete()), 0)
    t.equal(getLength(createDelete(-1)), 0)

    t.end()
})

tap.test('merge', t => {
    t.strictSame(merge(createRetain(2), createRetain(5)), createRetain(7))
    t.strictSame(merge(createRetain(0), createRetain(0)), createRetain(0))
    t.strictSame(merge(createDelete(3), createDelete(8)), createDelete(11))
    t.strictSame(merge(createDelete(3, 5, 'user'), createDelete(8, 5, 'user')), createDelete(11, 5, 'user'))
    t.strictSame(merge(
        createInsertText('Hello', 5, 'user'),
        createInsertText(' World', 5, 'user')),
        createInsertText('Hello World', 5, 'user'))
    t.strictSame(merge(
        createInsertText('Hello', 5, 'user', 'attributeName', 'attributeValue'),
        createInsertText(' World', 5, 'user', 'attributeName', 'attributeValue')),
        createInsertText('Hello World', 5, 'user', 'attributeName', 'attributeValue'))

    t.equal(merge(createRetain(1), createDelete(1)), null, 'Different actions')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertClose(validObjectContent)), null, 'Different insert actions')
    t.equal(merge(INVALID_OPERATION, INVALID_OPERATION), null, 'Invalid operations')
    t.equal(merge(createDelete(3, 1), createDelete(8, 2)), null, 'Different versions for delete')
    t.equal(merge(createDelete(3, 1, 'user 1'), createDelete(8, 1, 'user 2')), null, 'Different users for delete')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertOpen(validObjectContent)), null, 'Insert open')
    t.equal(merge(createInsertClose(validObjectContent), createInsertClose(validObjectContent)), null, 'Insert close')
    t.equal(merge(createInsertEmbed(validObjectContent), createInsertEmbed(validObjectContent)), null, 'Insert embed')
    t.equal(
        merge(
            createInsertText('hello', 1, 'user', 'attributeName', 'attributeValue'),
            createInsertText('hello', 1, 'user')
        ),
        null,
        'Different attribute lengths')
    t.equal(
        merge(
            createInsertText('hello', 1, 'user', 'attributeName', 'attributeValue1'),
            createInsertText('hello', 1, 'user', 'attributeName', 'attributeValue2')
        ),
        null,
        'Different attributes')

    t.end()
})
