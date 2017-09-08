const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    getLength,
    slice,
    INVALID_OPERATION
} = require('../lib/Operation')
const invalidObjectContent = '\uE000'
const validObjectContent = '\uE000DIV'

tap.test('getLength', t => {
    t.test('invalid', t => {
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

    t.end()
})
