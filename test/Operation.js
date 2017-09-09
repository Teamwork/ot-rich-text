const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, isInsertText, isInsertOpen, isInsertClose, isInsertEmbed, isRetain, isDelete,
    getContent, getVersion, getAuthor,
    getLength,
    slice,
    merge
} = require('../lib/Operation')
const invalidObjectContent = '\uE000'
const validObjectContent = '\uE000DIV'

tap.test('basic tests', t => {
    const retain = createRetain(1)
    const del = createDelete(2)
    const insertText = createInsertText('hello', 5, 'user')
    const insertOpen = createInsertOpen(validObjectContent, 6, 'user')
    const insertClose = createInsertClose(validObjectContent, 7, 'user')
    const insertEmbed = createInsertEmbed(validObjectContent, 8, 'user')

    t.equal(getContent(retain), 1)
    t.equal(getContent(del), 2)
    t.equal(getContent(insertText), 'hello')
    t.equal(getContent(insertOpen), validObjectContent)
    t.equal(getContent(insertClose), validObjectContent)
    t.equal(getContent(insertEmbed), validObjectContent)

    t.equal(getVersion(retain), 0)
    t.equal(getVersion(del), 0)
    t.equal(getVersion(insertText), 5)
    t.equal(getVersion(insertOpen), 6)
    t.equal(getVersion(insertClose), 7)
    t.equal(getVersion(insertEmbed), 8)

    t.equal(getAuthor(retain), '')
    t.equal(getAuthor(del), '')
    t.equal(getAuthor(insertText), 'user')
    t.equal(getAuthor(insertOpen), 'user')
    t.equal(getAuthor(insertClose), 'user')
    t.equal(getAuthor(insertEmbed), 'user')

    t.equal(isRetain(retain), true)
    t.equal(isRetain(del), false)
    t.equal(isRetain(insertText), false)
    t.equal(isRetain(insertOpen), false)
    t.equal(isRetain(insertClose), false)
    t.equal(isRetain(insertEmbed), false)

    t.equal(isDelete(retain), false)
    t.equal(isDelete(del), true)
    t.equal(isDelete(insertText), false)
    t.equal(isDelete(insertOpen), false)
    t.equal(isDelete(insertClose), false)
    t.equal(isDelete(insertEmbed), false)

    t.equal(isInsert(retain), false)
    t.equal(isInsert(del), false)
    t.equal(isInsert(insertText), true)
    t.equal(isInsert(insertOpen), true)
    t.equal(isInsert(insertClose), true)
    t.equal(isInsert(insertEmbed), true)

    t.equal(isInsertText(retain), false)
    t.equal(isInsertText(del), false)
    t.equal(isInsertText(insertText), true)
    t.equal(isInsertText(insertOpen), false)
    t.equal(isInsertText(insertClose), false)
    t.equal(isInsertText(insertEmbed), false)

    t.equal(isInsertOpen(retain), false)
    t.equal(isInsertOpen(del), false)
    t.equal(isInsertOpen(insertText), false)
    t.equal(isInsertOpen(insertOpen), true)
    t.equal(isInsertOpen(insertClose), false)
    t.equal(isInsertOpen(insertEmbed), false)

    t.equal(isInsertClose(retain), false)
    t.equal(isInsertClose(del), false)
    t.equal(isInsertClose(insertText), false)
    t.equal(isInsertClose(insertOpen), false)
    t.equal(isInsertClose(insertClose), true)
    t.equal(isInsertClose(insertEmbed), false)

    t.equal(isInsertEmbed(retain), false)
    t.equal(isInsertEmbed(del), false)
    t.equal(isInsertEmbed(insertText), false)
    t.equal(isInsertEmbed(insertOpen), false)
    t.equal(isInsertEmbed(insertClose), false)
    t.equal(isInsertEmbed(insertEmbed), true)

    t.end()
})

tap.test('getLength', t => {
    t.equal(getLength(createInsertText('hello')), 5)
    t.equal(getLength(createInsertOpen(validObjectContent)), 1)
    t.equal(getLength(createInsertClose(validObjectContent)), 1)
    t.equal(getLength(createInsertEmbed(validObjectContent)), 1)
    t.equal(getLength(createRetain(5)), 5)
    t.equal(getLength(createDelete(5)), 5)

    t.equal(getLength([111]), 0)
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
        createInsertText('Hello', 5, 'user', ['attributeName', 'attributeValue']),
        createInsertText(' World', 5, 'user', ['attributeName', 'attributeValue'])),
        createInsertText('Hello World', 5, 'user', ['attributeName', 'attributeValue']))

    t.equal(merge(createRetain(1), createDelete(1)), null, 'Different actions')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertClose(validObjectContent)), null, 'Different insert actions')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertOpen(validObjectContent)), null, 'Insert open')
    t.equal(merge(createInsertClose(validObjectContent), createInsertClose(validObjectContent)), null, 'Insert close')
    t.equal(merge(createInsertEmbed(validObjectContent), createInsertEmbed(validObjectContent)), null, 'Insert embed')
    t.equal(
        merge(
            createInsertText('hello', 1, 'user', ['attributeName', 'attributeValue']),
            createInsertText('hello', 1, 'user')
        ),
        null,
        'Different attribute lengths')
    t.equal(
        merge(
            createInsertText('hello', 1, 'user', ['attributeName', 'attributeValue1']),
            createInsertText('hello', 1, 'user', ['attributeName', 'attributeValue2'])
        ),
        null,
        'Different attributes')

    t.end()
})

tap.test('slice', t => {
    t.test('retain', t => {
        t.strictSame(
            slice(createRetain(5, ['key', 'value'])),
            createRetain(5, ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), -1),
            createRetain(5, ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 1),
            createRetain(4, ['key', 'value']),
            'positive offset')
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 1, -1),
            createRetain(0, ['key', 'value']),
            'positive offset and negative count')
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 1, 2),
            createRetain(2, ['key', 'value']),
            'positive offset and small count')
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 5),
            createRetain(0, ['key', 'value']),
            'too big offset')
        t.end()
    })

    t.test('delete', t => {
        t.strictSame(
            slice(createDelete(5)),
            createDelete(5),
            'no params')
        t.strictSame(
            slice(createDelete(5), -1),
            createDelete(5),
            'negative offset')
        t.strictSame(
            slice(createDelete(5), 1),
            createDelete(4),
            'positive offset')
        t.strictSame(
            slice(createDelete(5), 1, -1),
            createDelete(0),
            'positive offset and negative count')
        t.strictSame(
            slice(createDelete(5), 1, 2),
            createDelete(2),
            'positive offset and small count')
        t.strictSame(
            slice(createDelete(5), 5),
            createDelete(0),
            'too big offset')
        t.end()
    })

    t.test('insert text', t => {
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value'])),
            createInsertText('hello', 1, 'user', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value']), -1),
            createInsertText('hello', 1, 'user', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value']), 1),
            createInsertText('ello', 1, 'user', ['key', 'value']),
            'positive offset')
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value']), 1, -1),
            createInsertText('', 1, 'user', ['key', 'value']),
            'positive offset and negative count')
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value']), 1, 2),
            createInsertText('el', 1, 'user', ['key', 'value']),
            'positive offset and small count')
        t.strictSame(
            slice(createInsertText('hello', 1, 'user', ['key', 'value']), 5),
            createInsertText('', 1, 'user', ['key', 'value']),
            'too big offset')
        t.end()
    })

    t.test('insert open', t => {
        t.strictSame(
            slice(createInsertOpen(validObjectContent, 1, 'user', ['key', 'value'])),
            createInsertOpen(validObjectContent, 1, 'user', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, 1, 'user', ['key', 'value']), -1),
            createInsertOpen(validObjectContent, 1, 'user', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, 1, 'user', ['key', 'value']), 1),
            createInsertOpen('', 1, 'user', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, 1, 'user', ['key', 'value']), 0, 0),
            createInsertOpen('', 1, 'user', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert close', t => {
        t.strictSame(
            slice(createInsertClose(validObjectContent, 1, 'user', ['key', 'value'])),
            createInsertClose(validObjectContent, 1, 'user', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertClose(validObjectContent, 1, 'user', ['key', 'value']), -1),
            createInsertClose(validObjectContent, 1, 'user', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertClose(validObjectContent, 1, 'user', ['key', 'value']), 1),
            createInsertClose('', 1, 'user', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertClose(validObjectContent, 1, 'user', ['key', 'value']), 0, 0),
            createInsertClose('', 1, 'user', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert embed', t => {
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value'])),
            createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value']), -1),
            createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value']), 1),
            createInsertEmbed('', 1, 'user', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, 1, 'user', ['key', 'value']), 0, 0),
            createInsertEmbed('', 1, 'user', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.end()
})
