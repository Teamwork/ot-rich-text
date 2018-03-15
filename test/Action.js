const tap = require('tap')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, isInsertText, isInsertOpen, isInsertClose, isInsertEmbed, isRetain, isDelete,
    getCount, getText, getNodeIdAndName, getNodeId, getNodeName, getAttributes, getLength, clone,
    validate, areEqual, areTypesEqual, areAttributesEqual, getAttributesIndex, hasAttributes,
    slice, merge, composeIterators, transformIterators, setAttribute
} = require('../lib/Action')
const Iterator = require('../lib/Iterator')

tap.test('basic tests', t => {
    const retain = createRetain(1)
    const del = createDelete(2)
    const insertText = createInsertText('hello')
    const insertOpen = createInsertOpen('\uE000DIV')
    const insertClose = createInsertClose('\uE000DIV')
    const insertEmbed = createInsertEmbed('\uE000DIV')

    const retainWithAttributes = createRetain(1, ['key', 'value'])
    const insertTextWithAttributes = createInsertText('hello', ['key', 'value'])
    const insertOpenWithAttributes = createInsertOpen('\uE000DIV', ['key', 'value'])
    const insertCloseWithAttributes = createInsertClose('\uE000DIV', ['key', 'value'])
    const insertEmbedWithAttributes = createInsertEmbed('\uE000DIV', ['key', 'value'])

    t.equal(getCount(retain), 1)
    t.equal(getCount(del), 2)
    t.equal(getText(insertText), 'hello')
    t.equal(getNodeIdAndName(insertOpen), '\uE000DIV')
    t.equal(getNodeIdAndName(insertClose), '\uE000DIV')
    t.equal(getNodeIdAndName(insertEmbed), '\uE000DIV')
    t.equal(getNodeName(insertOpen), 'DIV')
    t.equal(getNodeName(insertClose), 'DIV')
    t.equal(getNodeName(insertEmbed), 'DIV')
    t.equal(getNodeId(insertOpen), '\uE000')
    t.equal(getNodeId(insertClose), '\uE000')
    t.equal(getNodeId(insertEmbed), '\uE000')

    t.strictSame(getAttributes(retain), [])
    t.strictSame(getAttributes(del), [])
    t.strictSame(getAttributes(insertText), [])
    t.strictSame(getAttributes(insertOpen), [])
    t.strictSame(getAttributes(insertClose), [])
    t.strictSame(getAttributes(insertEmbed), [])

    t.strictSame(getAttributes(retainWithAttributes), ['key', 'value'])
    t.strictSame(getAttributes(insertTextWithAttributes), ['key', 'value'])
    t.strictSame(getAttributes(insertOpenWithAttributes), ['key', 'value'])
    t.strictSame(getAttributes(insertCloseWithAttributes), ['key', 'value'])
    t.strictSame(getAttributes(insertEmbedWithAttributes), ['key', 'value'])
    t.strictSame(
        getAttributes(createRetain(1, [ 'more', 'attributes', 'nullValue', null, 'yet another', 'one' ])),
        [ 'more', 'attributes', 'nullValue', null, 'yet another', 'one' ])

    t.strictSame(getAttributes(retain, [ 'key' ]), [])
    t.strictSame(getAttributes(del, [ 'key' ]), [])
    t.strictSame(getAttributes(insertText, [ 'key' ]), [])
    t.strictSame(getAttributes(insertOpen, [ 'key' ]), [])
    t.strictSame(getAttributes(insertClose, [ 'key' ]), [])
    t.strictSame(getAttributes(insertEmbed, [ 'key' ]), [])

    t.strictSame(getAttributes(retainWithAttributes, [ 'key' ]), ['key', 'value'])
    t.strictSame(getAttributes(insertTextWithAttributes, [ 'key' ]), ['key', 'value'])
    t.strictSame(getAttributes(insertOpenWithAttributes, [ 'key' ]), ['key', 'value'])
    t.strictSame(getAttributes(insertCloseWithAttributes, [ 'key' ]), ['key', 'value'])
    t.strictSame(getAttributes(insertEmbedWithAttributes, [ 'key' ]), ['key', 'value'])

    t.strictSame(getAttributes(retainWithAttributes, []), [])
    t.strictSame(getAttributes(insertTextWithAttributes, []), [])
    t.strictSame(getAttributes(insertOpenWithAttributes, []), [])
    t.strictSame(getAttributes(insertCloseWithAttributes, []), [])
    t.strictSame(getAttributes(insertEmbedWithAttributes, []), [])

    t.strictSame(
        getAttributes(
            createRetain(1, [ 'more', 'attributes', 'nullValue', null, 'won\'t be found', '', 'yet another', 'one' ]),
            [ 'aaa', 'nullValue', 'ppp', 'yet another', 'zzz' ]
        ),
        [ 'nullValue', null, 'yet another', 'one' ]
    )

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

    t.equal(getAttributesIndex(retain), 2)
    t.equal(getAttributesIndex(del), 2)
    t.equal(getAttributesIndex(insertText), 2)
    t.equal(getAttributesIndex(insertOpen), 2)
    t.equal(getAttributesIndex(insertClose), 2)
    t.equal(getAttributesIndex(insertEmbed), 2)

    t.equal(getAttributesIndex(retainWithAttributes), 2)
    t.equal(getAttributesIndex(insertTextWithAttributes), 2)
    t.equal(getAttributesIndex(insertOpenWithAttributes), 2)
    t.equal(getAttributesIndex(insertCloseWithAttributes), 2)
    t.equal(getAttributesIndex(insertEmbedWithAttributes), 2)

    t.equal(hasAttributes(retain), false)
    t.equal(hasAttributes(del), false)
    t.equal(hasAttributes(insertText), false)
    t.equal(hasAttributes(insertOpen), false)
    t.equal(hasAttributes(insertClose), false)
    t.equal(hasAttributes(insertEmbed), false)

    t.equal(hasAttributes(retainWithAttributes), true)
    t.equal(hasAttributes(insertTextWithAttributes), true)
    t.equal(hasAttributes(insertOpenWithAttributes), true)
    t.equal(hasAttributes(insertCloseWithAttributes), true)
    t.equal(hasAttributes(insertEmbedWithAttributes), true)

    t.end()
})

tap.test('clone', t => {
    t.test('with attributes', t => {
        t.strictSame(clone(
            createInsertText('hello', ['key', 'value']), false),
            createInsertText('hello', ['key', 'value']))
        t.strictSame(clone(
            createInsertOpen('\uE000DIV', ['key', 'value']), false),
            createInsertOpen('\uE000DIV', ['key', 'value']))
        t.strictSame(clone(
            createInsertClose('\uE000DIV', ['key', 'value']), false),
            createInsertClose('\uE000DIV', ['key', 'value']))
        t.strictSame(clone(
            createInsertEmbed('\uE000DIV', ['key', 'value']), false),
            createInsertEmbed('\uE000DIV', ['key', 'value']))
        t.strictSame(clone(
            createRetain(5, ['key', 'value']), false),
            createRetain(5, ['key', 'value']))
        t.strictSame(clone(
            createDelete(6), false),
            createDelete(6))
        t.end()
    })

    t.test('without attributes', t => {
        t.strictSame(clone(
            createInsertText('hello', ['key', 'value']), true),
            createInsertText('hello'))
        t.strictSame(clone(
            createInsertOpen('\uE000DIV', ['key', 'value']), true),
            createInsertOpen('\uE000DIV'))
        t.strictSame(clone(
            createInsertClose('\uE000DIV', ['key', 'value']), true),
            createInsertClose('\uE000DIV'))
        t.strictSame(clone(
            createInsertEmbed('\uE000DIV', ['key', 'value']), true),
            createInsertEmbed('\uE000DIV'))
        t.strictSame(clone(
            createRetain(5, ['key', 'value']), true),
            createRetain(5))
        t.strictSame(clone(
            createDelete(6), true),
            createDelete(6))
        t.end()
    })

    t.end()
})

tap.test('setAttribute', t => {
    t.strictSame(
        setAttribute(createInsertText('Test', []), 'name', 'value'),
        createInsertText('Test', [ 'name', 'value' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'name', 'blah' ]), 'name', 'value'),
        createInsertText('Test', [ 'name', 'value' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'a', 'b', 'name', 'blah' ]), 'name', 'value'),
        createInsertText('Test', [ 'a', 'b', 'name', 'value' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'name', 'blah', 'x', 'y' ]), 'name', 'value'),
        createInsertText('Test', [ 'name', 'value', 'x', 'y' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'a', 'b' ]), 'name', 'value'),
        createInsertText('Test', [ 'a', 'b', 'name', 'value' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'x', 'y' ]), 'name', 'value'),
        createInsertText('Test', [ 'name', 'value', 'x', 'y' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'x', '1', 'y', '2', 'z', '3' ]), 'name', 'value'),
        createInsertText('Test', [ 'name', 'value', 'x', '1', 'y', '2', 'z', '3' ]))
    t.strictSame(
        setAttribute(createInsertText('Test', [ 'a', 'A', 'b', 'B', 'c', 'C', 'x', '1', 'y', '2', 'z', '3' ]), 'name', 'value'),
        createInsertText('Test', [ 'a', 'A', 'b', 'B', 'c', 'C', 'name', 'value', 'x', '1', 'y', '2', 'z', '3' ]))
    t.end()
})

tap.test('validate', t => {
    t.test('basic', t => {
        t.type(validate(null), Error, 'not an array: null')
        t.type(validate(undefined), Error, 'not an array: null')
        t.type(validate({ 0: 0, 1: 1, length: 2 }), Error, 'not an array: an object pretending to be a "retain" action')
        t.type(validate(['0', 5]), Error, 'invalid action')
        t.type(validate([-2, 5]), Error, 'unsupported action')
        t.type(validate([ -1 ]), Error, 'too short for delete')
        t.type(validate([ 0 ]), Error, 'too short for retain')
        t.type(validate([ 1 ]), Error, 'too short for insert text')
        t.type(validate([ 2 ]), Error, 'too short for insert open')
        t.type(validate([ 3 ]), Error, 'too short for insert close')
        t.type(validate([ 4 ]), Error, 'too short for insert embed')
        t.end()
    })

    t.test('delete', t => {
        t.type(validate(createDelete('1')), Error, 'content not a number')
        t.type(validate(createDelete(0)), Error, '0 content')
        t.type(validate(createDelete(-1)), Error, 'negative content')
        t.type(validate(createDelete(1.01)), Error, 'content not int')
        t.type(validate(createDelete(Infinity)), Error, 'content not finite')
        t.type(validate(createDelete(1).concat([1])), Error, 'operation too long')
        t.equal(validate(createDelete(1)), null)
        t.end()
    })

    t.test('retain', t => {
        t.type(validate(createRetain('1')), Error, 'content not a number')
        t.type(validate(createRetain(0)), Error, '0 content')
        t.type(validate(createRetain(-1)), Error, 'negative content')
        t.type(validate(createRetain(1.01)), Error, 'content not int')
        t.type(validate(createRetain(Infinity)), Error, 'content not finite')
        t.type(validate(createRetain(1, [ '1' ])), Error, 'no attribute value')
        t.type(validate(createRetain(1, [ 1, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createRetain(1, [ null, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createRetain(1, [ '1', 1 ])), Error, 'attribute value not a string and not null')
        t.type(validate(createRetain(1, [ 'b', null, 'a', null ])), Error, 'attributes not sorted by name')
        t.type(validate(createRetain(1, [ 'a', null, 'a', null ])), Error, 'duplicate attribute name')
        t.type(validate(createRetain(1, [ 'a', null, 'b', null, 'a', null ])), Error, 'attributes not sorted by name')
        t.equal(validate(createRetain(1)), null)
        t.equal(validate(createRetain(1, [ '1', '1' ])), null)
        t.equal(validate(createRetain(1, [ '1', null ])), null)
        t.equal(validate(createRetain(1, [ '', null, '1', null, 'a', '', 'ab', 'b' ])), null)
        t.equal(validate(createRetain(1, [ 'a', null, 'b', null ])), null)

        t.end()
    })

    t.test('insertText', t => {
        t.type(validate(createInsertText(1)), Error, 'content not a string')
        t.type(validate(createInsertText('')), Error, 'content empty')
        t.type(validate(createInsertText('a', [ '1' ])), Error, 'no attribute value')
        t.type(validate(createInsertText('a', [ 1, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertText('a', [ null, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertText('a', [ '1', 1 ])), Error, 'attribute value not a string')
        t.type(validate(createInsertText('a', [ '1', null ])), Error, 'attribute value not a string')
        t.type(validate(createInsertText('a', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.type(validate(createInsertText('a', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
        t.type(validate(createInsertText('a', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.equal(validate(createInsertText('a')), null)
        t.equal(validate(createInsertText('a', [ '1', '1' ])), null)
        t.equal(validate(createInsertText('a', [ '1', '' ])), null)
        t.equal(validate(createInsertText('a', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
        t.equal(validate(createInsertText('a', [ 'a', '', 'b', '' ])), null)
        t.end()
    })

    t.test('insertOpen', t => {
        t.type(validate(createInsertOpen(1)), Error, 'content not a string')
        t.type(validate(createInsertOpen('')), Error, 'content empty')
        t.type(validate(createInsertOpen('\uE000')), Error, 'node name missing')
        t.type(validate(createInsertOpen('P')), Error, 'node name missing and node ID invalid "P"')
        t.type(validate(createInsertOpen('DIV')), Error, 'node ID invalid "D"')
        t.type(validate(createInsertOpen('\uE000DIV', [ '1' ])), Error, 'no attribute value')
        t.type(validate(createInsertOpen('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertOpen('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertOpen('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
        t.type(validate(createInsertOpen('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
        t.type(validate(createInsertOpen('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.type(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
        t.type(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.equal(validate(createInsertOpen('\uE000DIV')), null)
        t.equal(validate(createInsertOpen('\uE000DIV')), null)
        t.equal(validate(createInsertOpen('\uE000DIV', [ '1', '1' ])), null)
        t.equal(validate(createInsertOpen('\uE000DIV', [ '1', '' ])), null)
        t.equal(validate(createInsertOpen('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
        t.equal(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        t.end()
    })

    t.test('insertClose', t => {
        t.type(validate(createInsertClose(1)), Error, 'content not a string')
        t.type(validate(createInsertClose('')), Error, 'content empty')
        t.type(validate(createInsertClose('\uE000')), Error, 'node name missing')
        t.type(validate(createInsertClose('P')), Error, 'node name missing and node ID invalid "P"')
        t.type(validate(createInsertClose('DIV')), Error, 'node ID invalid "D"')
        t.type(validate(createInsertClose('\uE000DIV', [ '1' ])), Error, 'no attribute value')
        t.type(validate(createInsertClose('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertClose('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertClose('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
        t.type(validate(createInsertClose('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
        t.type(validate(createInsertClose('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.type(validate(createInsertClose('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
        t.type(validate(createInsertClose('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.equal(validate(createInsertClose('\uE000DIV')), null)
        t.equal(validate(createInsertClose('\uE000DIV')), null)
        t.equal(validate(createInsertClose('\uE000DIV', [ '1', '1' ])), null)
        t.equal(validate(createInsertClose('\uE000DIV', [ '1', '' ])), null)
        t.equal(validate(createInsertClose('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
        t.equal(validate(createInsertClose('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        t.end()
    })

    t.test('insertEmbed', t => {
        t.type(validate(createInsertEmbed(1)), Error, 'content not a string')
        t.type(validate(createInsertEmbed('')), Error, 'content empty')
        t.type(validate(createInsertEmbed('\uE000')), Error, 'node name missing')
        t.type(validate(createInsertEmbed('P')), Error, 'node name missing and node ID invalid "P"')
        t.type(validate(createInsertEmbed('DIV')), Error, 'node ID invalid "D"')
        t.type(validate(createInsertEmbed('\uE000DIV', [ '1' ])), Error, 'no attribute value')
        t.type(validate(createInsertEmbed('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertEmbed('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
        t.type(validate(createInsertEmbed('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
        t.type(validate(createInsertEmbed('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
        t.type(validate(createInsertEmbed('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.type(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
        t.type(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
        t.equal(validate(createInsertEmbed('\uE000DIV')), null)
        t.equal(validate(createInsertEmbed('\uE000DIV')), null)
        t.equal(validate(createInsertEmbed('\uE000DIV', [ '1', '1' ])), null)
        t.equal(validate(createInsertEmbed('\uE000DIV', [ '1', '' ])), null)
        t.equal(validate(createInsertEmbed('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
        t.equal(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        t.end()
    })

    t.end()
})

tap.test('areEqual', t => {
    t.equal(areEqual(
        createInsertText('a', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertText('a', [ 'key1', 'value1', 'key2', 'value2' ] )
    ), true)
    t.equal(areEqual(
        createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
    ), true)
    t.equal(areEqual(
        createInsertClose('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertClose('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
    ), true)
    t.equal(areEqual(
        createInsertEmbed('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertEmbed('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
    ), true)
    t.equal(areEqual(
        createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] ),
        createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] )
    ), true)
    t.equal(areEqual(
        createDelete(5),
        createDelete(5)
    ), true)
    t.equal(areEqual(
        createDelete(5),
        createRetain(5)
    ), false)
    t.equal(areEqual(
        createDelete(5),
        createDelete(6)
    ), false)
    t.equal(areEqual(
        createRetain(5, [ 'key1', 'value1' ] ),
        createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] )
    ), false)
    t.equal(areEqual(
        createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertOpen('\uE000DIV', [ 'key1', 'value1', 'key2', 'value2' ] )
    ), false)
    t.equal(areEqual(
        createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
        createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value3' ] )
    ), false)
    t.end()
})

tap.test('areTypesEqual', t => {
    t.equal(areTypesEqual(
        createInsertText('abc', ['a', 'b']),
        createInsertText('xyz', ['c', 'd'])
    ), true)
    t.equal(areTypesEqual(
        createInsertOpen('\uE000P', ['a', 'b']),
        createInsertOpen('\uE000DIV', ['c', 'd'])
    ), true)
    t.equal(areTypesEqual(
        createInsertClose('\uE000P', ['a', 'b']),
        createInsertClose('\uE000DIV', ['c', 'd'])
    ), true)
    t.equal(areTypesEqual(
        createInsertEmbed('\uE000BR', ['a', 'b']),
        createInsertEmbed('\uE000HR', ['c', 'd'])
    ), true)
    t.equal(areTypesEqual(
        createRetain(4, ['a', 'b']),
        createRetain(5, ['c', 'd'])
    ), true)
    t.equal(areTypesEqual(
        createDelete(4),
        createDelete(5)
    ), true)
    t.equal(areTypesEqual(
        createRetain(4),
        createDelete(5)
    ), false)
    t.equal(areTypesEqual(
        createRetain(4),
        createDelete(4)
    ), false)
    t.equal(areTypesEqual(
        createInsertOpen('\uE000P', ['a', 'b']),
        createInsertClose('\uE000DIV', ['c', 'd'])
    ), false)
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
            createInsertEmbed('\uE000DIV'),
            createInsertEmbed('\uE000P')
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createInsertEmbed('\uE000P', ['key', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV', ['key', 'value', 'key2', null]),
            createInsertEmbed('\uE000P', ['key', 'value', 'key2', null])
        ), true)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createInsertEmbed('\uE000P')
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV'),
            createInsertEmbed('\uE000P', ['key', 'value'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV', ['key', 'value1']),
            createInsertEmbed('\uE000P', ['key', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertEmbed('\uE000DIV', ['key1', 'value']),
            createInsertEmbed('\uE000P', ['key2', 'value'])
        ), false)
        t.end()
    })
    t.test('mix', t => {
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value']),
            createInsertEmbed('\uE000P', ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value']),
            createRetain(2, ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value']),
            createInsertEmbed('\uE000P', ['key1', 'value'])
        ), true)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value1']),
            createInsertEmbed('\uE000P', ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createInsertText('hello', ['key1', 'value1']),
            createRetain(2, ['key1', 'value2'])
        ), false)
        t.equal(areAttributesEqual(
            createRetain(5, ['key1', 'value1']),
            createInsertEmbed('\uE000P', ['key1', 'value2'])
        ), false)
        t.end()
    })
    t.end()
})

tap.test('getLength', t => {
    t.equal(getLength(createInsertText('hello')), 5)
    t.equal(getLength(createInsertOpen('\uE000DIV')), 1)
    t.equal(getLength(createInsertClose('\uE000DIV')), 1)
    t.equal(getLength(createInsertEmbed('\uE000DIV')), 1)
    t.equal(getLength(createRetain(5)), 5)
    t.equal(getLength(createDelete(5)), 5)

    t.equal(getLength(createInsertText('')), 0)
    t.equal(getLength(createInsertOpen('\uE000')), 1)
    t.equal(getLength(createInsertClose('\uE000')), 1)
    t.equal(getLength(createInsertEmbed('\uE000')), 1)
    t.equal(getLength(createRetain(0)), 0)
    t.equal(getLength(createRetain(-1)), -1)
    t.equal(getLength(createDelete(0)), 0)
    t.equal(getLength(createDelete(-1)), -1)

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
    t.equal(merge(createInsertOpen('\uE000DIV'), createInsertClose('\uE000DIV')), null, 'Different insert actions')
    t.equal(merge(createInsertOpen('\uE000DIV'), createInsertOpen('\uE000DIV')), null, 'Insert open')
    t.equal(merge(createInsertClose('\uE000DIV'), createInsertClose('\uE000DIV')), null, 'Insert close')
    t.equal(merge(createInsertEmbed('\uE000DIV'), createInsertEmbed('\uE000DIV')), null, 'Insert embed')
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
            slice(createRetain(5, ['key', 'value']), 0, 5, 5),
            createRetain(5, ['key', 'value']))
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 0, 2, 5),
            createRetain(2, ['key', 'value']))
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 1, 2, 5),
            createRetain(2, ['key', 'value']))
        t.strictSame(
            slice(createRetain(5, ['key', 'value']), 2, 3, 5),
            createRetain(3, ['key', 'value']))
        t.end()
    })

    t.test('delete', t => {
        t.strictSame(
            slice(createDelete(5), 0, 5, 5),
            createDelete(5))
        t.strictSame(
            slice(createDelete(5), 0, 2, 5),
            createDelete(2))
        t.strictSame(
            slice(createDelete(5), 1, 2, 5),
            createDelete(2))
        t.strictSame(
            slice(createDelete(5), 2, 3, 5),
            createDelete(3))
        t.end()
    })

    t.test('insert text', t => {
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 0, 5, 5),
            createInsertText('hello', ['key', 'value']))
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 0, 2, 5),
            createInsertText('he', ['key', 'value']))
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 1, 2, 5),
            createInsertText('el', ['key', 'value']))
        t.strictSame(
            slice(createInsertText('hello', ['key', 'value']), 2, 3, 5),
            createInsertText('llo', ['key', 'value']))
        t.end()
    })

    t.test('insert open', t => {
        t.strictSame(
            slice(createInsertOpen('\uE000DIV', ['key', 'value']), 0, 1, 1),
            createInsertOpen('\uE000DIV', ['key', 'value']))
        t.end()
    })

    t.test('insert close', t => {
        t.strictSame(
            slice(createInsertClose('\uE000DIV', ['key', 'value']), 0, 1, 1),
            createInsertClose('\uE000DIV', ['key', 'value']))
        t.end()
    })

    t.test('insert embed', t => {
        t.strictSame(
            slice(createInsertEmbed('\uE000DIV', ['key', 'value']), 0, 1, 1),
            createInsertEmbed('\uE000DIV', ['key', 'value']))
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
        const i1 = new Iterator([ createInsertEmbed('\uE000DIV') ])
        const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
        const composedOperation = createInsertEmbed('\uE000DIV', ['key', 'value'])

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
        t.test('iterator1 insert (with attributes), iterator2 retain (extra atrributes at end)', t => {
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
        t.test('iterator1 insert (extra attributes at start), iterator2 retain (with atrributes)', t => {
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
        t.test('iterator1 insert (with attributes at end), iterator2 retain (with atrributes)', t => {
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
        t.test('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at start)', t => {
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
        t.test('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at end)', t => {
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
        t.test('iterator1 insert (extra null attributes at start), iterator2 retain (with atrributes)', t => {
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
        t.test('iterator1 insert (extra null attributes at end), iterator2 retain (with atrributes)', t => {
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
        t.test('iterator1 insert (with attributes), iterator2 retain (with null atrributes)', t => {
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

tap.test('transformIterators', t => {
    t.test('iterator1 insert, iterator2 insert (priority: left)', t => {
        const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createInsertText('xyz', ['key', 'value']) ]).next(1)
        const transformedOperation = createInsertText('bc', ['key', 'value'])

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 1)
        t.end()
    })

    t.test('iterator1 insert, iterator2 insert (priority: right)', t => {
        const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createInsertText('xyz', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 insert, iterator2 retain (priority: left)', t => {
        const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
        const transformedOperation = createInsertText('bc', ['key', 'value'])

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 1)
        t.end()
    })

    t.test('iterator1 insert, iterator2 retain (priority: right)', t => {
        const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const i2 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
        const transformedOperation = createInsertText('bc', ['key', 'value'])

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 1)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert (priority: left)', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 delete, iterator2 insert (priority: right)', t => {
        const i1 = new Iterator([ createDelete(5) ]).next(1)
        const i2 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 1)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 retain, iterator2 delete (priority: left)', t => {
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

    t.test('iterator1 retain, iterator2 delete (priority: right)', t => {
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

    t.test('iterator1 retain, iterator2 delete (priority: left)', t => {
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

    t.test('iterator1 retain, iterator2 delete (priority: right)', t => {
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

    t.test('iterator1 delete, iterator2 retain (priority: left)', t => {
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

    t.test('iterator1 delete, iterator2 retain (priority: right)', t => {
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

    t.test('iterator1 retain, iterator2 retain (priority: left)', t => {
        const i1 = new Iterator([ createRetain(4) ]).next(1)
        const i2 = new Iterator([ createRetain(6) ]).next(1)
        const transformedOperation = createRetain(3)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 4)
        t.end()
    })

    t.test('iterator1 retain, iterator2 retain (priority: right)', t => {
        const i1 = new Iterator([ createRetain(4) ]).next(1)
        const i2 = new Iterator([ createRetain(6) ]).next(1)
        const transformedOperation = createRetain(3)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 1)
        t.equal(i1.offset, 0)
        t.equal(i2.index, 0)
        t.equal(i2.offset, 4)
        t.end()
    })

    t.test('iterator1 retain, iterator2 retain (priority: left)', t => {
        const i1 = new Iterator([ createRetain(4) ]).next(1)
        const i2 = new Iterator([ createRetain(3) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, true), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 retain, iterator2 retain (priority: right)', t => {
        const i1 = new Iterator([ createRetain(4) ]).next(1)
        const i2 = new Iterator([ createRetain(3) ]).next(1)
        const transformedOperation = createRetain(2)

        t.strictSame(transformIterators(i1, i2, false), transformedOperation)
        t.equal(i1.index, 0)
        t.equal(i1.offset, 3)
        t.equal(i2.index, 1)
        t.equal(i2.offset, 0)
        t.end()
    })

    t.test('iterator1 retain, iterator2 retain (attributes)', t => {
        t.test('an attribute <-> the same attribute (priority: left)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['key', 'value'])

            t.strictSame(transformIterators(i1, i2, true), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('an attribute <-> the same attribute (priority: right)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1)

            t.strictSame(transformIterators(i1, i2, false), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('an attribute <-> extra attribute at end (priority: left)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value', 'z key', 'z value']) ]).next(1)
            const transformedOperation = createRetain(1, ['key', 'value'])

            t.strictSame(transformIterators(i1, i2, true), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('an attribute <-> extra attribute at end (priority: right)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value', 'z key', 'z value']) ]).next(1)
            const transformedOperation = createRetain(1)

            t.strictSame(transformIterators(i1, i2, false), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('an attribute <-> extra attribute at start (priority: left)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['a key', 'a value', 'key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['key', 'value'])

            t.strictSame(transformIterators(i1, i2, true), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('an attribute <-> extra attribute at start (priority: right)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['a key', 'a value', 'key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1)

            t.strictSame(transformIterators(i1, i2, false), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('extra attribute at end <-> an attribute (priority: left)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value', 'z key', 'z value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['key', 'value', 'z key', 'z value'])

            t.strictSame(transformIterators(i1, i2, true), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('extra attribute at end <-> an attribute (priority: right)', t => {
            const i1 = new Iterator([ createRetain(2, ['key', 'value', 'z key', 'z value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['z key', 'z value'])

            t.strictSame(transformIterators(i1, i2, false), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('extra attribute at start <-> an attribute (priority: left)', t => {
            const i1 = new Iterator([ createRetain(2, ['a key', 'a value', 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['a key', 'a value', 'key', 'value'])

            t.strictSame(transformIterators(i1, i2, true), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.test('extra attribute at start <-> an attribute (priority: right)', t => {
            const i1 = new Iterator([ createRetain(2, ['a key', 'a value', 'key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
            const transformedOperation = createRetain(1, ['a key', 'a value'])

            t.strictSame(transformIterators(i1, i2, false), transformedOperation)
            t.equal(i1.index, 1)
            t.equal(i1.offset, 0)
            t.equal(i2.index, 0)
            t.equal(i2.offset, 2)
            t.end()
        })

        t.end()
    })

    t.end()
})
