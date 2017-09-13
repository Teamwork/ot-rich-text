const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, isInsertText, isInsertOpen, isInsertClose, isInsertEmbed, isRetain, isDelete,
    getContent, getLength, copyOperation,
    areAttributesEqual,
    slice, merge, composeIterators
} = require('../lib/Operation')
const Iterator = require('../lib/Iterator')
const invalidObjectContent = '\uE000'
const validObjectContent = '\uE000DIV'
const nodeContent1 = '\uE001'
const nodeContent2 = '\uE002'

tap.test('basic tests', t => {
    const retain = createRetain(1)
    const del = createDelete(2)
    const insertText = createInsertText('hello')
    const insertOpen = createInsertOpen(validObjectContent)
    const insertClose = createInsertClose(validObjectContent)
    const insertEmbed = createInsertEmbed(validObjectContent)

    t.equal(getContent(retain), 1)
    t.equal(getContent(del), 2)
    t.equal(getContent(insertText), 'hello')
    t.equal(getContent(insertOpen), validObjectContent)
    t.equal(getContent(insertClose), validObjectContent)
    t.equal(getContent(insertEmbed), validObjectContent)

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
            createInsertText('hello', ['key', 'value'])),
            createInsertText('hello', ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertOpen(nodeContent1, ['key', 'value'])),
            createInsertOpen(nodeContent1, ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertClose(nodeContent1, ['key', 'value'])),
            createInsertClose(nodeContent1, ['key', 'value']))
        t.strictSame(copyOperation(
            createInsertEmbed(nodeContent1, ['key', 'value'])),
            createInsertEmbed(nodeContent1, ['key', 'value']))
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
            createInsertText('hello', ['key', 'value']), true),
            createInsertText('hello'))
        t.strictSame(copyOperation(
            createInsertOpen(nodeContent1, ['key', 'value']), true),
            createInsertOpen(nodeContent1))
        t.strictSame(copyOperation(
            createInsertClose(nodeContent1, ['key', 'value']), true),
            createInsertClose(nodeContent1))
        t.strictSame(copyOperation(
            createInsertEmbed(nodeContent1, ['key', 'value']), true),
            createInsertEmbed(nodeContent1))
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
            createInsertText('a'),
            createInsertText('b')
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', ['key', 'value']),
            createInsertText('b', ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', ['key', 'value', 'key2', null]),
            createInsertText('b', ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('a', ['key', 'value']),
            createInsertText('b')
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a'),
            createInsertText('b', ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a', ['key', 'value1']),
            createInsertText('b', ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('a', ['key1', 'value']),
            createInsertText('b', ['key2', 'value'])
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
            createInsertEmbed(nodeContent1),
            createInsertEmbed(nodeContent2)
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, ['key', 'value']),
            createInsertEmbed(nodeContent2, ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, ['key', 'value', 'key2', null]),
            createInsertEmbed(nodeContent2, ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, ['key', 'value']),
            createInsertEmbed(nodeContent2)
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1),
            createInsertEmbed(nodeContent2, ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, ['key', 'value1']),
            createInsertEmbed(nodeContent2, ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed(nodeContent1, ['key1', 'value']),
            createInsertEmbed(nodeContent2, ['key2', 'value'])
        ), false)
        t.end()
    })
    t.test('mix', t => {
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value']),
            createInsertEmbed(nodeContent2, ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value']),
            createRetain(2, ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value']),
            createInsertEmbed(nodeContent2, ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value1']),
            createInsertEmbed(nodeContent2, ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value1']),
            createRetain(2, ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value1']),
            createInsertEmbed(nodeContent2, ['key1', 'value2'])
        ), false)
        t.end()
    })
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
    t.strictSame(merge(createDelete(3), createDelete(8)), createDelete(11, 5, 'user'))
    t.strictSame(merge(
        createInsertText('Hello'),
        createInsertText(' World')),
        createInsertText('Hello World'))
    t.strictSame(merge(
        createInsertText('Hello', ['attributeName', 'attributeValue']),
        createInsertText(' World', ['attributeName', 'attributeValue'])),
        createInsertText('Hello World', ['attributeName', 'attributeValue']))

    t.equal(merge(createRetain(1), createDelete(1)), null, 'Different actions')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertClose(validObjectContent)), null, 'Different insert actions')
    t.equal(merge(createInsertOpen(validObjectContent), createInsertOpen(validObjectContent)), null, 'Insert open')
    t.equal(merge(createInsertClose(validObjectContent), createInsertClose(validObjectContent)), null, 'Insert close')
    t.equal(merge(createInsertEmbed(validObjectContent), createInsertEmbed(validObjectContent)), null, 'Insert embed')
    t.equal(
        merge(
            createInsertText('hello', ['attributeName', 'attributeValue']),
            createInsertText('hello')
        ),
        null,
        'Different attribute lengths')
    t.equal(
        merge(
            createInsertText('hello', ['attributeName', 'attributeValue1']),
            createInsertText('hello', ['attributeName', 'attributeValue2'])
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
            slice(createInsertText('hello', ['key', 'value'])),
            createInsertText('hello', ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), -1),
            createInsertText('hello', ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 1),
            createInsertText('ello', ['key', 'value']),
            'positive offset')
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 1, -1),
            createInsertText('', ['key', 'value']),
            'positive offset and negative count')
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 1, 2),
            createInsertText('el', ['key', 'value']),
            'positive offset and small count')
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 5),
            createInsertText('', ['key', 'value']),
            'too big offset')
        t.end()
    })

    t.test('insert open', t => {
        t.strictSame(
            slice(createInsertOpen(validObjectContent, ['key', 'value'])),
            createInsertOpen(validObjectContent, ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, ['key', 'value']), -1),
            createInsertOpen(validObjectContent, ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, ['key', 'value']), 1),
            createInsertOpen('', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertOpen(validObjectContent, ['key', 'value']), 0, 0),
            createInsertOpen('', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert close', t => {
        t.strictSame(
            slice(createInsertClose(validObjectContent, ['key', 'value'])),
            createInsertClose(validObjectContent, ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertClose(validObjectContent, ['key', 'value']), -1),
            createInsertClose(validObjectContent, ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertClose(validObjectContent, ['key', 'value']), 1),
            createInsertClose('', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertClose(validObjectContent, ['key', 'value']), 0, 0),
            createInsertClose('', ['key', 'value']),
            'zero count')
        t.end()
    })

    t.test('insert embed', t => {
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, ['key', 'value'])),
            createInsertEmbed(validObjectContent, ['key', 'value']),
            'no params')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, ['key', 'value']), -1),
            createInsertEmbed(validObjectContent, ['key', 'value']),
            'negative offset')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, ['key', 'value']), 1),
            createInsertEmbed('', ['key', 'value']),
            'too big offset')
        t.strictSame(
            slice(createInsertEmbed(validObjectContent, ['key', 'value']), 0, 0),
            createInsertEmbed('', ['key', 'value']),
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
        const i2 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
        const composedOperation = createInsertText('ello', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator2 empty', t => {
        const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([])
        const composedOperation = createInsertText('ello', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
        const composedOperation = createInsertText('ello', ['key', 'value'])

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
        const i1 = new Iterator([ createInsertText('hello') ]).next(1)
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertText('ello', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 6)
        t.end()
    })

    t.test('iterator1 insert text (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createInsertText('hello') ]).next(1)
        const i2 = new Iterator([ createRetain(4, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertText('el', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 insert embed (no attributes), iterator2 retain (with attributes)', t => {
        const i1 = new Iterator([ createInsertEmbed(validObjectContent) ])
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertEmbed(validObjectContent, ['key', 'value'])

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
        t.test('iterator1 retain (with attributes), iterator2 retain (extra atrributes at start)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra atrributes at end)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['anotherKey', 'anotherValue', 'key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value', 'z-anotherKey', 'anotherValue'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at start)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['anotherKey', null, 'key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at end)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', null]) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra null attributes at start), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['anotherKey', null, 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (extra null attributes at end), iterator2 retain (with atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value', 'z-anotherKey', null]) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedOperation = createInsertText('ello', ['key', 'value'])

            t.strictSame(composeIterators(i1, i2), composedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 6)
            t.end()
        })
        t.test('iterator1 retain (with attributes), iterator2 retain (with null atrributes)', t => {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', null]) ]).next(2)
            const composedOperation = createInsertText('ello')

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
        const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
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
        const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createDelete(3) ]).next(1)
        const composedOperation = createInsertText('lo', ['key', 'value'])

        t.strictSame(composeIterators(i1, i2), composedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.end()
})
