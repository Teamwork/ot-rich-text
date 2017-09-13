const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, isInsertText, isInsertOpen, isInsertClose, isInsertEmbed, isRetain, isDelete,
    getContent, getLength, copyOperation,
    areAttributesEqual,
    slice, merge, composeIterators, transformIterators
} = require('../lib/Operation')
const Iterator = require('../lib/Iterator')
const invalidNodeContent = '\uE000DIV'
const nodeContent1 = '\uE001'
const nodeContent2 = '\uE002'

tap.test('basic tests', t => {
    const retain = createRetain(1)
    const del = createDelete(2)
    const insertText = createInsertText('hello', 1, 'user')
    const insertOpen = createInsertOpen(nodeContent1, 1, 'user', 'DIV')
    const insertClose = createInsertClose(nodeContent1, 1, 'user', 'DIV')
    const insertEmbed = createInsertEmbed(nodeContent1, 1, 'user', 'DIV')

    t.equal(getContent(retain), 1)
    t.equal(getContent(del), 2)
    t.equal(getContent(insertText), 'hello')
    t.equal(getContent(insertOpen), nodeContent1)
    t.equal(getContent(insertClose), nodeContent1)
    t.equal(getContent(insertEmbed), nodeContent1)

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

tap.test('copyOperation', t => {
    t.test('with attributes', t => {
        t.strictSame(copyOperation(
            createInsertText('hello', 1, 'user', ['key', 'value'])),
            createInsertText('hello', 1, 'user', ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']))
        t.strictSame(copyOperation(
            createRetain(5, ['key', 'value'])),
            createRetain(5, ['key', 'value']))
        t.strictSame(copyOperation(
            createDelete(6)),
            createDelete(6))
        t.end()
    })

    t.test('without attributes', t => {
        t.strictSame(copyOperation(
            createInsertText('hello', 1, 'user', ['key', 'value']), true),
            createInsertText('hello', 1, 'user'))
        t.strictSame(copyOperation(
            createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), true),
            createInsertOpen(nodeContent1, 1, 'user', 'DIV'))
        t.strictSame(copyOperation(
            createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), true),
            createInsertClose(nodeContent1, 1, 'user', 'DIV'))
        t.strictSame(copyOperation(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), true),
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV'))
        t.strictSame(copyOperation(
            createRetain(5, ['key', 'value']), true),
            createRetain(5))
        t.strictSame(copyOperation(
            createDelete(6), true),
            createDelete(6))
        t.end()
    })

    t.end()
})

tap.test('areAttributesEqual', t => {
    t.test('insertText', t => {
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user'),
            createInsertText('b', 1, 'user')
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user', ['key', 'value']),
            createInsertText('b', 1, 'user', ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user', ['key', 'value', 'key2', null]),
            createInsertText('b', 1, 'user', ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user', ['key', 'value']),
            createInsertText('b', 1, 'user')
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user'),
            createInsertText('b', 1, 'user', ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user', ['key', 'value1']),
            createInsertText('b', 1, 'user', ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a', 1, 'user', ['key1', 'value']),
            createInsertText('b', 1, 'user', ['key2', 'value'])
        ), false)
        t.end()
    })
    t.test('retain', t => {
        t.equal(areAttributesEqual(
            createRetain(1),
            createRetain(2)
        ), true)
        t.equal(areAttributesEqual(
            createRetain(1, ['key', 'value']),
            createRetain(2, ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createRetain(1, ['key', 'value', 'key2', null]),
            createRetain(2, ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createRetain(1, ['key', 'value']),
            createRetain(2)
        ), false)
        t.equal(areAttributesEqual(
            createRetain(1),
            createRetain(2, ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createRetain(1, ['key', 'value1']),
            createRetain(2, ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createRetain(1, ['key1', 'value']),
            createRetain(2, ['key2', 'value'])
        ), false)
        t.end()
    })
    t.test('insertEmbed', t => {
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV'),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV')
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value', 'key2', null]),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV')
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV'),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value1']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key1', 'value']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key2', 'value'])
        ), false)
        t.end()
    })
    t.test('mix', t => {
        t.equal(areAttributesEqual(
            createInsertText('hello', 1, 'user', ['key1', 'value']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', 1, 'user', ['key1', 'value']),
            createRetain(2, ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', 1, 'user', ['key1', 'value1']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('hello', 1, 'user', ['key1', 'value1']),
            createRetain(2, ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value1']),
            createInsertEmbed(nodeContent2, 1, 'user', 'DIV', ['key1', 'value2'])
        ), false)
        t.end()
    })
    t.end()
})

tap.test('getLength', t => {
    t.equal(getLength(createInsertText('hello', 1, 'user')), 5)
    t.equal(getLength(createInsertOpen(nodeContent1, 1, 'user', 'DIV')), 1)
    t.equal(getLength(createInsertClose(nodeContent1, 1, 'user', 'DIV')), 1)
    t.equal(getLength(createInsertEmbed(nodeContent1, 1, 'user', 'DIV')), 1)
    t.equal(getLength(createRetain(5)), 5)
    t.equal(getLength(createDelete(5)), 5)

    t.equal(getLength([111]), 0)
    t.equal(getLength(createInsertText('', 1, 'user')), 0)
    t.equal(getLength(createInsertOpen('', 1, 'user', 'DIV')), 0)
    t.equal(getLength(createInsertOpen(invalidNodeContent, 1, 'user', 'DIV')), 0)
    t.equal(getLength(createInsertClose('', 1, 'user', 'DIV')), 0)
    t.equal(getLength(createInsertClose(invalidNodeContent, 1, 'user', 'DIV')), 0)
    t.equal(getLength(createInsertEmbed('', 1, 'user', 'DIV')), 0)
    t.equal(getLength(createInsertEmbed(invalidNodeContent, 1, 'user', 'DIV')), 0)
    t.equal(getLength(createRetain(0)), 0)
    t.equal(getLength(createRetain(-1)), 0)
    t.equal(getLength(createDelete(0)), 0)
    t.equal(getLength(createDelete(-1)), 0)

    t.end()
})

tap.test('merge', t => {
    t.strictSame(merge(createRetain(2), createRetain(5)), createRetain(7))
    t.strictSame(merge(createRetain(0), createRetain(0)), createRetain(0))
    t.strictSame(merge(createDelete(3), createDelete(8)), createDelete(11))
    t.strictSame(merge(createDelete(3), createDelete(8)), createDelete(11, 5, 'user'))
    t.strictSame(merge(
        createInsertText('Hello', 1, 'user'),
        createInsertText(' World', 1, 'user')),
        createInsertText('Hello World', 1, 'user'))
    t.strictSame(merge(
        createInsertText('Hello', 1, 'user', ['attributeName', 'attributeValue']),
        createInsertText(' World', 1, 'user', ['attributeName', 'attributeValue'])),
        createInsertText('Hello World', 1, 'user', ['attributeName', 'attributeValue']))

    t.equal(merge(createRetain(1), createDelete(1)), null, 'Different actions')
    t.equal(merge(createInsertOpen(nodeContent1, 1, 'user', 'DIV'), createInsertClose(nodeContent1, 1, 'user', 'DIV')), null, 'Different insert actions')
    t.equal(merge(createInsertOpen(nodeContent1, 1, 'user', 'DIV'), createInsertOpen(nodeContent1, 1, 'user', 'DIV')), null, 'Insert open')
    t.equal(merge(createInsertClose(nodeContent1, 1, 'user', 'DIV'), createInsertClose(nodeContent1, 1, 'user', 'DIV')), null, 'Insert close')
    t.equal(merge(createInsertEmbed(nodeContent1, 1, 'user', 'DIV'), createInsertEmbed(nodeContent1, 1, 'user', 'DIV')), null, 'Insert embed')
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
            slice(createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), -1),
            createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 1),
            createInsertOpen('', 1, 'user', 'DIV', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertOpen(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 0, 0),
            createInsertOpen('', 1, 'user', 'DIV', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert close', t => {
        t.strictSame(
            slice(createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), -1),
            createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 1),
            createInsertClose('', 1, 'user', 'DIV', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertClose(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 0, 0),
            createInsertClose('', 1, 'user', 'DIV', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert embed', t => {
        t.strictSame(
            slice(createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])),
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), -1),
            createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 1),
            createInsertEmbed('', 1, 'user', 'DIV', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value']), 0, 0),
            createInsertEmbed('', 1, 'user', 'DIV', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.end()
})

tap.test('composeIterators', t => {
    t.test('iterator1 and iterator2 empty', t => {
        const i1 = new Iterator([])
        const i2 = new Iterator([])
        const composedOperation = null

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 empty', t => {
        const i1 = new Iterator([])
        const i2 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
        const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator2 empty', t => {
        const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([])
        const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
        const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 retain', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(1)
        const composedOperation = createDelete(4)

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 1)
        t.end()
    })

    t.test('iterator1 retain (with attributes), iterator2 retain (no attributes)', t => {
        const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createRetain(9) ]).next(2)
        const composedOperation = createRetain(4, ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 retain (with attributes), iterator2 retain (the same atrributes)', t => {
        const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createRetain(4, ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 retain (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createRetain(5) ]).next(1)
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createRetain(4, ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 insert text (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createInsertText('hello', 1, 'user') ]).next(1)
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 insert text (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createInsertText('hello', 1, 'user') ]).next(1)
        const i2 = new Iterator([ createRetain(4, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertText('el', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 insert embed (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createInsertEmbed(nodeContent1, 1, 'user', 'DIV') ])
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertEmbed(nodeContent1, 1, 'user', 'DIV', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 3)
        t.end()
    })

    t.test('attributes (retain+retain)', t => {
        t.test('iterator1 retain (with attributes), iterator2 retain (extra atrributes at start)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra atrributes at end)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(2)
            const composedOperation = createRetain(4, ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createRetain(5, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at start)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', null, 'key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['anotherKey', null, 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at end)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', null]) ]).next(2)
            const composedOperation = createRetain(4, ['key', 'value', 'z-anotherKey', null])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra null attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createRetain(5, ['anotherKey', null, 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['anotherKey', null, 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra null attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value', 'z-anotherKey', null]) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createRetain(4, ['key', 'value', 'z-anotherKey', null])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (with null atrributes)', t => {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', null]) ]).next(2)
            const composedOperation = createRetain(4, ['key', null])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.end()
    })

    t.test('attributes (insert+retain)', t => {
        t.test('iterator1 insert (with attributes), iterator2 retain (extra atrributes at start)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (with attributes), iterator2 retain (extra atrributes at end)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (extra attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (with attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at start)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', null, 'key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at end)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', null]) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (extra null attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['anotherKey', null, 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (extra null attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value', 'z-anotherKey', null]) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 insert (with attributes), iterator2 retain (with null atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', null]) ]).next(2)
            const composedOperation = createInsertText('ello', 1, 'user')

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (longer operation)', t => {
        const i1 = new Iterator([ createRetain(5) ]).next(1)
        const i2 = new Iterator([ createDelete(8) ]).next(2)
        const composedOperation = createDelete(4)

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (shorter operation)', t => {
        const i1 = new Iterator([ createRetain(5) ]).next(1)
        const i2 = new Iterator([ createDelete(3) ]).next(1)
        const composedOperation = createDelete(2)

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 insert, iterator2 delete (longer operation)', t => {
        const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createDelete(8) ]).next(1)
        const composedOperation = createDelete(3)

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 insert, iterator2 delete (shorter operation)', t => {
        const i1 = new Iterator([ createInsertText('hello', 1, 'user', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createDelete(3) ]).next(1)
        const composedOperation = createInsertText('lo', 1, 'user', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.end()
})

tap.test('transformIterators', t => {
    t.test('iterator1 insert, iterator2 insert (left first)', t => {
        const i1 = new Iterator([ createInsertText('abc', 1, 'user', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createInsertText('xyz', 1, 'user', ['key', 'value']) ]).next(1)
        const transformedOperation = createInsertText('bc', 1, 'user', ['key', 'value'])

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 1)
        t.end()
    })

    t.test('iterator1 insert, iterator2 insert (right first)', t => {
        const i1 = new Iterator([ createInsertText('abc', 1, 'user', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createInsertText('xyz', 1, 'user', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert (left first)', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('abc', 1, 'user', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert (right first)', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('abc', 1, 'user', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (left first)', t => {
        const i1 = new Iterator([ createRetain(5) ]).next(1)
        const i2 = new Iterator([ createDelete(8) ]).next(1)
        const transformedOperation = null

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 5)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (right first)', t => {
        const i1 = new Iterator([ createRetain(5) ]).next(1)
        const i2 = new Iterator([ createDelete(8) ]).next(1)
        const transformedOperation = null

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 5)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (left first)', t => {
        const i1 = new Iterator([ createRetain(6) ]).next(1)
        const i2 = new Iterator([ createDelete(4) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (right first)', t => {
        const i1 = new Iterator([ createRetain(6) ]).next(1)
        const i2 = new Iterator([ createDelete(4) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 retain (left first)', t => {
        const i1 = new Iterator([ createDelete(4) ]).next(1)
        const i2 = new Iterator([ createRetain(6) ]).next(1)
        const transformedOperation = createDelete(3)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 4)
        t.end()
    })

    t.test('iterator1 retain, iterator2 retain (right first)', t => {
        const i1 = new Iterator([ createDelete(4) ]).next(1)
        const i2 = new Iterator([ createRetain(3) ]).next(1)
        const transformedOperation = createDelete(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.end()
})
