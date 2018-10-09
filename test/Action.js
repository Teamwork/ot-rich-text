const assert = require('chai').assert
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, isInsertText, isInsertOpen, isInsertClose, isInsertEmbed, isRetain, isDelete,
    getCount, getText, getNodeIdAndName, getNodeId, getNodeName, getAttributes, getAttribute, getLength, clone,
    validate, areEqual, areTypesEqual, areAttributesEqual, getAttributesIndex, hasAttributes,
    slice, merge, composeIterators, transformIterators, setAttribute
} = require('../src/Action')
const Iterator = require('../src/Iterator')

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

describe('Action', function () {

    describe('getCount', function () {
        it('basic tests', function () {
            assert.strictEqual(getCount(retain), 1)
            assert.strictEqual(getCount(del), 2)
        })
    })

    describe('getText', function () {
        it('basic tests', function () {
            assert.strictEqual(getText(insertText), 'hello')
        })
    })

    describe('getNodeIdAndName', function () {
        it('basic tests', function () {
            assert.strictEqual(getNodeIdAndName(insertOpen), '\uE000DIV')
            assert.strictEqual(getNodeIdAndName(insertClose), '\uE000DIV')
            assert.strictEqual(getNodeIdAndName(insertEmbed), '\uE000DIV')
        })
    })

    describe('getNodeName', function () {
        it('basic tests', function () {
            assert.strictEqual(getNodeName(insertOpen), 'DIV')
            assert.strictEqual(getNodeName(insertClose), 'DIV')
            assert.strictEqual(getNodeName(insertEmbed), 'DIV')
        })
    })

    describe('getNodeId', function () {
        it('basic tests', function () {
            assert.strictEqual(getNodeId(insertOpen), '\uE000')
            assert.strictEqual(getNodeId(insertClose), '\uE000')
            assert.strictEqual(getNodeId(insertEmbed), '\uE000')
        })
    })

    describe('getAttributes', function () {
        it('with no attributes', function () {
            assert.deepEqual(getAttributes(retain), [])
            assert.deepEqual(getAttributes(del), [])
            assert.deepEqual(getAttributes(insertText), [])
            assert.deepEqual(getAttributes(insertOpen), [])
            assert.deepEqual(getAttributes(insertClose), [])
            assert.deepEqual(getAttributes(insertEmbed), [])
        })
        it('with one attribute', function () {
            assert.deepEqual(getAttributes(retainWithAttributes), ['key', 'value'])
            assert.deepEqual(getAttributes(insertTextWithAttributes), ['key', 'value'])
            assert.deepEqual(getAttributes(insertOpenWithAttributes), ['key', 'value'])
            assert.deepEqual(getAttributes(insertCloseWithAttributes), ['key', 'value'])
            assert.deepEqual(getAttributes(insertEmbedWithAttributes), ['key', 'value'])
        })
        it('with many attributes', function () {
            assert.deepEqual(
                getAttributes(createRetain(1, [ 'more', 'attributes', 'nullValue', null, 'yet another', 'one' ])),
                [ 'more', 'attributes', 'nullValue', null, 'yet another', 'one' ])
        })
        it('with filter and no attributes', function () {
            assert.deepEqual(getAttributes(retain, [ 'key' ]), [])
            assert.deepEqual(getAttributes(del, [ 'key' ]), [])
            assert.deepEqual(getAttributes(insertText, [ 'key' ]), [])
            assert.deepEqual(getAttributes(insertOpen, [ 'key' ]), [])
            assert.deepEqual(getAttributes(insertClose, [ 'key' ]), [])
            assert.deepEqual(getAttributes(insertEmbed, [ 'key' ]), [])
        })
        it('with filter and one attribute', function () {
            assert.deepEqual(getAttributes(retainWithAttributes, [ 'key' ]), ['key', 'value'])
            assert.deepEqual(getAttributes(insertTextWithAttributes, [ 'key' ]), ['key', 'value'])
            assert.deepEqual(getAttributes(insertOpenWithAttributes, [ 'key' ]), ['key', 'value'])
            assert.deepEqual(getAttributes(insertCloseWithAttributes, [ 'key' ]), ['key', 'value'])
            assert.deepEqual(getAttributes(insertEmbedWithAttributes, [ 'key' ]), ['key', 'value'])
        })
        it('with empty filter and no attributes', function () {
            assert.deepEqual(getAttributes(retainWithAttributes, []), [])
            assert.deepEqual(getAttributes(insertTextWithAttributes, []), [])
            assert.deepEqual(getAttributes(insertOpenWithAttributes, []), [])
            assert.deepEqual(getAttributes(insertCloseWithAttributes, []), [])
            assert.deepEqual(getAttributes(insertEmbedWithAttributes, []), [])
        })
        it('with filter and many attributes', function () {
            assert.deepEqual(
                getAttributes(
                    createRetain(1, [ 'more', 'attributes', 'nullValue', null, 'won\'t be found', '', 'yet another', 'one' ]),
                    [ 'aaa', 'nullValue', 'ppp', 'yet another', 'zzz' ]
                ),
                [ 'nullValue', null, 'yet another', 'one' ]
            )
        })
        describe('flexibleMatch', function () {
            it('with valid pattern but no flexibleMatch', function () {
                assert.deepEqual(
                    getAttributes(
                        createRetain(1, [ 'a', '1', 'exact:', '2', 'pattern:abc', '3', 'pattern:xyz', '4', 'z', '5' ]),
                        [ 'exact:', 'pattern:' ]
                    ),
                    [ 'exact:', '2' ]
                )
            })
            it('with valid pattern and flexibleMatch', function () {
                assert.deepEqual(
                    getAttributes(
                        createRetain(1, [ 'a', '1', 'exact:', '2', 'pattern:abc', '3', 'pattern:xyz', '4', 'z', '5' ]),
                        [ 'exact:', 'pattern:' ],
                        true
                    ),
                    [ 'exact:', '2', 'pattern:abc', '3', 'pattern:xyz', '4', ]
                )
            })
            it('with invalid pattern and flexibleMatch', function () {
                assert.deepEqual(
                    getAttributes(
                        createRetain(1, [ 'a', '1', 'prefix:abc', '2', 'z', '5' ]),
                        [ 'prefix' ],
                        true
                    ),
                    []
                )
            })
        })
    })

    describe('getAttribute', function () {
        it('with no attributes', function () {
            assert.deepEqual(getAttribute(retain, 'key'), undefined)
            assert.deepEqual(getAttribute(del, 'key'), undefined)
            assert.deepEqual(getAttribute(insertText, 'key'), undefined)
            assert.deepEqual(getAttribute(insertOpen, 'key'), undefined)
            assert.deepEqual(getAttribute(insertClose, 'key'), undefined)
            assert.deepEqual(getAttribute(insertEmbed, 'key'), undefined)
        })
        it('with one attribute', function () {
            assert.deepEqual(getAttribute(retainWithAttributes, 'key'), 'value')
            assert.deepEqual(getAttribute(insertTextWithAttributes, 'key'), 'value')
            assert.deepEqual(getAttribute(insertOpenWithAttributes, 'key'), 'value')
            assert.deepEqual(getAttribute(insertCloseWithAttributes, 'key'), 'value')
            assert.deepEqual(getAttribute(insertEmbedWithAttributes, 'key'), 'value')
        })
        it('with many attributes', function () {
            assert.deepEqual(getAttribute(createRetain(4), 'key'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'key', null ]), 'key'), null)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'a'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'b'), 'c')
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'c'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'k'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'key'), 'value')
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'keys'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'x'), undefined)
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'y'), 'z')
            assert.deepEqual(getAttribute(createRetain(4, [ 'b', 'c', 'key', 'value', 'y', 'z' ]), 'z'), undefined)
        })
    })

    describe('isRetain', function () {
        it('basic tests', function () {
            assert.strictEqual(isRetain(retain), true)
            assert.strictEqual(isRetain(del), false)
            assert.strictEqual(isRetain(insertText), false)
            assert.strictEqual(isRetain(insertOpen), false)
            assert.strictEqual(isRetain(insertClose), false)
            assert.strictEqual(isRetain(insertEmbed), false)
        })
    })

    describe('isDelete', function () {
        it('basic tests', function () {
            assert.strictEqual(isDelete(retain), false)
            assert.strictEqual(isDelete(del), true)
            assert.strictEqual(isDelete(insertText), false)
            assert.strictEqual(isDelete(insertOpen), false)
            assert.strictEqual(isDelete(insertClose), false)
            assert.strictEqual(isDelete(insertEmbed), false)
        })
    })

    describe('isInsert', function () {
        it('basic tests', function () {
            assert.strictEqual(isInsert(retain), false)
            assert.strictEqual(isInsert(del), false)
            assert.strictEqual(isInsert(insertText), true)
            assert.strictEqual(isInsert(insertOpen), true)
            assert.strictEqual(isInsert(insertClose), true)
            assert.strictEqual(isInsert(insertEmbed), true)
        })
    })

    describe('isInsertText', function () {
        it('basic tests', function () {
            assert.strictEqual(isInsertText(retain), false)
            assert.strictEqual(isInsertText(del), false)
            assert.strictEqual(isInsertText(insertText), true)
            assert.strictEqual(isInsertText(insertOpen), false)
            assert.strictEqual(isInsertText(insertClose), false)
            assert.strictEqual(isInsertText(insertEmbed), false)
        })
    })

    describe('isInsertOpen', function () {
        it('basic tests', function () {
            assert.strictEqual(isInsertOpen(retain), false)
            assert.strictEqual(isInsertOpen(del), false)
            assert.strictEqual(isInsertOpen(insertText), false)
            assert.strictEqual(isInsertOpen(insertOpen), true)
            assert.strictEqual(isInsertOpen(insertClose), false)
            assert.strictEqual(isInsertOpen(insertEmbed), false)
        })
    })

    describe('isInsertClose', function () {
        it('basic tests', function () {
            assert.strictEqual(isInsertClose(retain), false)
            assert.strictEqual(isInsertClose(del), false)
            assert.strictEqual(isInsertClose(insertText), false)
            assert.strictEqual(isInsertClose(insertOpen), false)
            assert.strictEqual(isInsertClose(insertClose), true)
            assert.strictEqual(isInsertClose(insertEmbed), false)
        })
    })

    describe('isInsertEmbed', function () {
        it('basic tests', function () {
            assert.strictEqual(isInsertEmbed(retain), false)
            assert.strictEqual(isInsertEmbed(del), false)
            assert.strictEqual(isInsertEmbed(insertText), false)
            assert.strictEqual(isInsertEmbed(insertOpen), false)
            assert.strictEqual(isInsertEmbed(insertClose), false)
            assert.strictEqual(isInsertEmbed(insertEmbed), true)
        })
    })

    describe('getAttributesIndex', function () {
        it('with no attributes', function () {
            assert.strictEqual(getAttributesIndex(retain), 2)
            assert.strictEqual(getAttributesIndex(del), 2)
            assert.strictEqual(getAttributesIndex(insertText), 2)
            assert.strictEqual(getAttributesIndex(insertOpen), 2)
            assert.strictEqual(getAttributesIndex(insertClose), 2)
            assert.strictEqual(getAttributesIndex(insertEmbed), 2)
        })
        it('with some attributes', function () {
            assert.strictEqual(getAttributesIndex(retainWithAttributes), 2)
            assert.strictEqual(getAttributesIndex(insertTextWithAttributes), 2)
            assert.strictEqual(getAttributesIndex(insertOpenWithAttributes), 2)
            assert.strictEqual(getAttributesIndex(insertCloseWithAttributes), 2)
            assert.strictEqual(getAttributesIndex(insertEmbedWithAttributes), 2)
        })
    })

    describe('hasAttributes', function () {
        it('with no attributes', function () {
            assert.strictEqual(hasAttributes(retain), false)
            assert.strictEqual(hasAttributes(del), false)
            assert.strictEqual(hasAttributes(insertText), false)
            assert.strictEqual(hasAttributes(insertOpen), false)
            assert.strictEqual(hasAttributes(insertClose), false)
            assert.strictEqual(hasAttributes(insertEmbed), false)
        })
        it('with some attributes', function () {
            assert.strictEqual(hasAttributes(retainWithAttributes), true)
            assert.strictEqual(hasAttributes(insertTextWithAttributes), true)
            assert.strictEqual(hasAttributes(insertOpenWithAttributes), true)
            assert.strictEqual(hasAttributes(insertCloseWithAttributes), true)
            assert.strictEqual(hasAttributes(insertEmbedWithAttributes), true)
        })
    })

    describe('clone', function () {
        it('with attributes', function () {
            assert.deepEqual(clone(
                createInsertText('hello', ['key', 'value']), false),
                createInsertText('hello', ['key', 'value']))
            assert.deepEqual(clone(
                createInsertOpen('\uE000DIV', ['key', 'value']), false),
                createInsertOpen('\uE000DIV', ['key', 'value']))
            assert.deepEqual(clone(
                createInsertClose('\uE000DIV', ['key', 'value']), false),
                createInsertClose('\uE000DIV', ['key', 'value']))
            assert.deepEqual(clone(
                createInsertEmbed('\uE000DIV', ['key', 'value']), false),
                createInsertEmbed('\uE000DIV', ['key', 'value']))
            assert.deepEqual(clone(
                createRetain(5, ['key', 'value']), false),
                createRetain(5, ['key', 'value']))
            assert.deepEqual(clone(
                createDelete(6), false),
                createDelete(6))
        })

        it('without attributes', function () {
            assert.deepEqual(clone(
                createInsertText('hello', ['key', 'value']), true),
                createInsertText('hello'))
            assert.deepEqual(clone(
                createInsertOpen('\uE000DIV', ['key', 'value']), true),
                createInsertOpen('\uE000DIV'))
            assert.deepEqual(clone(
                createInsertClose('\uE000DIV', ['key', 'value']), true),
                createInsertClose('\uE000DIV'))
            assert.deepEqual(clone(
                createInsertEmbed('\uE000DIV', ['key', 'value']), true),
                createInsertEmbed('\uE000DIV'))
            assert.deepEqual(clone(
                createRetain(5, ['key', 'value']), true),
                createRetain(5))
            assert.deepEqual(clone(
                createDelete(6), true),
                createDelete(6))
        })
    })

    describe('setAttribute', function () {
        it('basic tests', function () {
            assert.deepEqual(
                setAttribute(createInsertText('Test', []), 'name', 'value'),
                createInsertText('Test', [ 'name', 'value' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'name', 'blah' ]), 'name', 'value'),
                createInsertText('Test', [ 'name', 'value' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'a', 'b', 'name', 'blah' ]), 'name', 'value'),
                createInsertText('Test', [ 'a', 'b', 'name', 'value' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'name', 'blah', 'x', 'y' ]), 'name', 'value'),
                createInsertText('Test', [ 'name', 'value', 'x', 'y' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'a', 'b' ]), 'name', 'value'),
                createInsertText('Test', [ 'a', 'b', 'name', 'value' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'x', 'y' ]), 'name', 'value'),
                createInsertText('Test', [ 'name', 'value', 'x', 'y' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'x', '1', 'y', '2', 'z', '3' ]), 'name', 'value'),
                createInsertText('Test', [ 'name', 'value', 'x', '1', 'y', '2', 'z', '3' ]))
            assert.deepEqual(
                setAttribute(createInsertText('Test', [ 'a', 'A', 'b', 'B', 'c', 'C', 'x', '1', 'y', '2', 'z', '3' ]), 'name', 'value'),
                createInsertText('Test', [ 'a', 'A', 'b', 'B', 'c', 'C', 'name', 'value', 'x', '1', 'y', '2', 'z', '3' ]))
        })
    })

    describe('validate', function () {
        it('basic', function () {
            assert.instanceOf(validate(null), Error, 'not an array: null')
            assert.instanceOf(validate(undefined), Error, 'not an array: null')
            assert.instanceOf(validate({ 0: 0, 1: 1, length: 2 }), Error, 'not an array: an object pretending to be a "retain" action')
            assert.instanceOf(validate(['0', 5]), Error, 'invalid action')
            assert.instanceOf(validate([-2, 5]), Error, 'unsupported action')
            assert.instanceOf(validate([ -1 ]), Error, 'too short for delete')
            assert.instanceOf(validate([ 0 ]), Error, 'too short for retain')
            assert.instanceOf(validate([ 1 ]), Error, 'too short for insert text')
            assert.instanceOf(validate([ 2 ]), Error, 'too short for insert open')
            assert.instanceOf(validate([ 3 ]), Error, 'too short for insert close')
            assert.instanceOf(validate([ 4 ]), Error, 'too short for insert embed')
        })

        it('delete', function () {
            assert.instanceOf(validate(createDelete('1')), Error, 'content not a number')
            assert.instanceOf(validate(createDelete(0)), Error, '0 content')
            assert.instanceOf(validate(createDelete(-1)), Error, 'negative content')
            assert.instanceOf(validate(createDelete(1.01)), Error, 'content not int')
            assert.instanceOf(validate(createDelete(Infinity)), Error, 'content not finite')
            assert.instanceOf(validate(createDelete(1).concat([1])), Error, 'action too long')
            assert.strictEqual(validate(createDelete(1)), null)
        })

        it('retain', function () {
            assert.instanceOf(validate(createRetain('1')), Error, 'content not a number')
            assert.instanceOf(validate(createRetain(0)), Error, '0 content')
            assert.instanceOf(validate(createRetain(-1)), Error, 'negative content')
            assert.instanceOf(validate(createRetain(1.01)), Error, 'content not int')
            assert.instanceOf(validate(createRetain(Infinity)), Error, 'content not finite')
            assert.instanceOf(validate(createRetain(1, [ '1' ])), Error, 'no attribute value')
            assert.instanceOf(validate(createRetain(1, [ 1, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createRetain(1, [ null, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createRetain(1, [ '1', 1 ])), Error, 'attribute value not a string and not null')
            assert.instanceOf(validate(createRetain(1, [ 'b', null, 'a', null ])), Error, 'attributes not sorted by name')
            assert.instanceOf(validate(createRetain(1, [ 'a', null, 'a', null ])), Error, 'duplicate attribute name')
            assert.instanceOf(validate(createRetain(1, [ 'a', null, 'b', null, 'a', null ])), Error, 'attributes not sorted by name')
            assert.strictEqual(validate(createRetain(1)), null)
            assert.strictEqual(validate(createRetain(1, [ '1', '1' ])), null)
            assert.strictEqual(validate(createRetain(1, [ '1', null ])), null)
            assert.strictEqual(validate(createRetain(1, [ '', null, '1', null, 'a', '', 'ab', 'b' ])), null)
            assert.strictEqual(validate(createRetain(1, [ 'a', null, 'b', null ])), null)
        })

        it('insertText', function () {
            assert.instanceOf(validate(createInsertText(1)), Error, 'content not a string')
            assert.instanceOf(validate(createInsertText('')), Error, 'content empty')
            assert.instanceOf(validate(createInsertText('a', [ '1' ])), Error, 'no attribute value')
            assert.instanceOf(validate(createInsertText('a', [ 1, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertText('a', [ null, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertText('a', [ '1', 1 ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertText('a', [ '1', null ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertText('a', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.instanceOf(validate(createInsertText('a', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
            assert.instanceOf(validate(createInsertText('a', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.strictEqual(validate(createInsertText('a')), null)
            assert.strictEqual(validate(createInsertText('a', [ '1', '1' ])), null)
            assert.strictEqual(validate(createInsertText('a', [ '1', '' ])), null)
            assert.strictEqual(validate(createInsertText('a', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
            assert.strictEqual(validate(createInsertText('a', [ 'a', '', 'b', '' ])), null)
        })

        it('insertOpen', function () {
            assert.instanceOf(validate(createInsertOpen(1)), Error, 'content not a string')
            assert.instanceOf(validate(createInsertOpen('')), Error, 'content empty')
            assert.instanceOf(validate(createInsertOpen('\uE000')), Error, 'node name missing')
            assert.instanceOf(validate(createInsertOpen('P')), Error, 'node name missing and node ID invalid "P"')
            assert.instanceOf(validate(createInsertOpen('DIV')), Error, 'node ID invalid "D"')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ '1' ])), Error, 'no attribute value')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
            assert.instanceOf(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.strictEqual(validate(createInsertOpen('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertOpen('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertOpen('\uE000DIV', [ '1', '1' ])), null)
            assert.strictEqual(validate(createInsertOpen('\uE000DIV', [ '1', '' ])), null)
            assert.strictEqual(validate(createInsertOpen('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
            assert.strictEqual(validate(createInsertOpen('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        })

        it('insertClose', function () {
            assert.instanceOf(validate(createInsertClose(1)), Error, 'content not a string')
            assert.instanceOf(validate(createInsertClose('')), Error, 'content empty')
            assert.instanceOf(validate(createInsertClose('\uE000')), Error, 'node name missing')
            assert.instanceOf(validate(createInsertClose('P')), Error, 'node name missing and node ID invalid "P"')
            assert.instanceOf(validate(createInsertClose('DIV')), Error, 'node ID invalid "D"')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ '1' ])), Error, 'no attribute value')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
            assert.instanceOf(validate(createInsertClose('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.strictEqual(validate(createInsertClose('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertClose('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertClose('\uE000DIV', [ '1', '1' ])), null)
            assert.strictEqual(validate(createInsertClose('\uE000DIV', [ '1', '' ])), null)
            assert.strictEqual(validate(createInsertClose('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
            assert.strictEqual(validate(createInsertClose('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        })

        it('insertEmbed', function () {
            assert.instanceOf(validate(createInsertEmbed(1)), Error, 'content not a string')
            assert.instanceOf(validate(createInsertEmbed('')), Error, 'content empty')
            assert.instanceOf(validate(createInsertEmbed('\uE000')), Error, 'node name missing')
            assert.instanceOf(validate(createInsertEmbed('P')), Error, 'node name missing and node ID invalid "P"')
            assert.instanceOf(validate(createInsertEmbed('DIV')), Error, 'node ID invalid "D"')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ '1' ])), Error, 'no attribute value')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ 1, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ null, '1' ])), Error, 'attribute name not a string')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ '1', 1 ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ '1', null ])), Error, 'attribute value not a string')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'a', '' ])), Error, 'duplicate attribute name')
            assert.instanceOf(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'b', '', 'a', '' ])), Error, 'attributes not sorted by name')
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV')), null)
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV', [ '1', '1' ])), null)
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV', [ '1', '' ])), null)
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV', [ '', '', '1', '', 'a', '', 'ab', 'b' ])), null)
            assert.strictEqual(validate(createInsertEmbed('\uE000DIV', [ 'a', '', 'b', '' ])), null)
        })
    })

    describe('areEqual', function () {
        it('basic tests', function () {
            assert.strictEqual(areEqual(
                createInsertText('a', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertText('a', [ 'key1', 'value1', 'key2', 'value2' ] )
            ), true)
            assert.strictEqual(areEqual(
                createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
            ), true)
            assert.strictEqual(areEqual(
                createInsertClose('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertClose('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
            ), true)
            assert.strictEqual(areEqual(
                createInsertEmbed('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertEmbed('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] )
            ), true)
            assert.strictEqual(areEqual(
                createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] ),
                createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] )
            ), true)
            assert.strictEqual(areEqual(
                createDelete(5),
                createDelete(5)
            ), true)
            assert.strictEqual(areEqual(
                createDelete(5),
                createRetain(5)
            ), false)
            assert.strictEqual(areEqual(
                createDelete(5),
                createDelete(6)
            ), false)
            assert.strictEqual(areEqual(
                createRetain(5, [ 'key1', 'value1' ] ),
                createRetain(5, [ 'key1', 'value1', 'key2', 'value2' ] )
            ), false)
            assert.strictEqual(areEqual(
                createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertOpen('\uE000DIV', [ 'key1', 'value1', 'key2', 'value2' ] )
            ), false)
            assert.strictEqual(areEqual(
                createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value2' ] ),
                createInsertOpen('\uE000P', [ 'key1', 'value1', 'key2', 'value3' ] )
            ), false)
        })
    })

    describe('areTypesEqual', function () {
        it('basic tests', function () {
            assert.strictEqual(areTypesEqual(
                createInsertText('abc', ['a', 'b']),
                createInsertText('xyz', ['c', 'd'])
            ), true)
            assert.strictEqual(areTypesEqual(
                createInsertOpen('\uE000P', ['a', 'b']),
                createInsertOpen('\uE000DIV', ['c', 'd'])
            ), true)
            assert.strictEqual(areTypesEqual(
                createInsertClose('\uE000P', ['a', 'b']),
                createInsertClose('\uE000DIV', ['c', 'd'])
            ), true)
            assert.strictEqual(areTypesEqual(
                createInsertEmbed('\uE000BR', ['a', 'b']),
                createInsertEmbed('\uE000HR', ['c', 'd'])
            ), true)
            assert.strictEqual(areTypesEqual(
                createRetain(4, ['a', 'b']),
                createRetain(5, ['c', 'd'])
            ), true)
            assert.strictEqual(areTypesEqual(
                createDelete(4),
                createDelete(5)
            ), true)
            assert.strictEqual(areTypesEqual(
                createRetain(4),
                createDelete(5)
            ), false)
            assert.strictEqual(areTypesEqual(
                createRetain(4),
                createDelete(4)
            ), false)
            assert.strictEqual(areTypesEqual(
                createInsertOpen('\uE000P', ['a', 'b']),
                createInsertClose('\uE000DIV', ['c', 'd'])
            ), false)
        })
    })

    describe('areAttributesEqual', function () {
        it('insertText', function () {
            assert.strictEqual(areAttributesEqual(
                createInsertText('a'),
                createInsertText('b')
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a', ['key', 'value']),
                createInsertText('b', ['key', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a', ['key', 'value', 'key2', null]),
                createInsertText('b', ['key', 'value', 'key2', null])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a', ['key', 'value']),
                createInsertText('b')
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a'),
                createInsertText('b', ['key', 'value'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a', ['key', 'value1']),
                createInsertText('b', ['key', 'value2'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertText('a', ['key1', 'value']),
                createInsertText('b', ['key2', 'value'])
            ), false)
        })
        it('retain', function () {
            assert.strictEqual(areAttributesEqual(
                createRetain(1),
                createRetain(2)
            ), true)
            assert.strictEqual(areAttributesEqual(
                createRetain(1, ['key', 'value']),
                createRetain(2, ['key', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createRetain(1, ['key', 'value', 'key2', null]),
                createRetain(2, ['key', 'value', 'key2', null])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createRetain(1, ['key', 'value']),
                createRetain(2)
            ), false)
            assert.strictEqual(areAttributesEqual(
                createRetain(1),
                createRetain(2, ['key', 'value'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createRetain(1, ['key', 'value1']),
                createRetain(2, ['key', 'value2'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createRetain(1, ['key1', 'value']),
                createRetain(2, ['key2', 'value'])
            ), false)
        })
        it('insertEmbed', function () {
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV'),
                createInsertEmbed('\uE000P')
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV', ['key', 'value']),
                createInsertEmbed('\uE000P', ['key', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV', ['key', 'value', 'key2', null]),
                createInsertEmbed('\uE000P', ['key', 'value', 'key2', null])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV', ['key', 'value']),
                createInsertEmbed('\uE000P')
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV'),
                createInsertEmbed('\uE000P', ['key', 'value'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV', ['key', 'value1']),
                createInsertEmbed('\uE000P', ['key', 'value2'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertEmbed('\uE000DIV', ['key1', 'value']),
                createInsertEmbed('\uE000P', ['key2', 'value'])
            ), false)
        })
        it('mix', function () {
            assert.strictEqual(areAttributesEqual(
                createInsertText('hello', ['key1', 'value']),
                createInsertEmbed('\uE000P', ['key1', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertText('hello', ['key1', 'value']),
                createRetain(2, ['key1', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createRetain(5, ['key1', 'value']),
                createInsertEmbed('\uE000P', ['key1', 'value'])
            ), true)
            assert.strictEqual(areAttributesEqual(
                createInsertText('hello', ['key1', 'value1']),
                createInsertEmbed('\uE000P', ['key1', 'value2'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createInsertText('hello', ['key1', 'value1']),
                createRetain(2, ['key1', 'value2'])
            ), false)
            assert.strictEqual(areAttributesEqual(
                createRetain(5, ['key1', 'value1']),
                createInsertEmbed('\uE000P', ['key1', 'value2'])
            ), false)
        })
    })

    describe('getLength', function () {
        it('basic tests', function () {
            assert.strictEqual(getLength(createInsertText('hello')), 5)
            assert.strictEqual(getLength(createInsertOpen('\uE000DIV')), 1)
            assert.strictEqual(getLength(createInsertClose('\uE000DIV')), 1)
            assert.strictEqual(getLength(createInsertEmbed('\uE000DIV')), 1)
            assert.strictEqual(getLength(createRetain(5)), 5)
            assert.strictEqual(getLength(createDelete(5)), 5)

            assert.strictEqual(getLength(createInsertText('')), 0)
            assert.strictEqual(getLength(createInsertOpen('\uE000')), 1)
            assert.strictEqual(getLength(createInsertClose('\uE000')), 1)
            assert.strictEqual(getLength(createInsertEmbed('\uE000')), 1)
            assert.strictEqual(getLength(createRetain(0)), 0)
            assert.strictEqual(getLength(createRetain(-1)), -1)
            assert.strictEqual(getLength(createDelete(0)), 0)
            assert.strictEqual(getLength(createDelete(-1)), -1)
        })
    })

    describe('merge', function () {
        it('basic tests', function () {
            assert.deepEqual(merge(createRetain(2), createRetain(5)), createRetain(7))
            assert.deepEqual(merge(createRetain(0), createRetain(0)), createRetain(0))
            assert.deepEqual(merge(createDelete(3), createDelete(8)), createDelete(11))
            assert.deepEqual(merge(createDelete(3), createDelete(8)), createDelete(11, 5, 'user'))
            assert.deepEqual(merge(
                createInsertText('Hello'),
                createInsertText(' World')),
                createInsertText('Hello World'))
            assert.deepEqual(merge(
                createInsertText('Hello', ['attributeName', 'attributeValue']),
                createInsertText(' World', ['attributeName', 'attributeValue'])),
                createInsertText('Hello World', ['attributeName', 'attributeValue']))

            assert.strictEqual(merge(createRetain(1), createDelete(1)), null, 'Different actions')
            assert.strictEqual(merge(createInsertOpen('\uE000DIV'), createInsertClose('\uE000DIV')), null, 'Different insert actions')
            assert.strictEqual(merge(createInsertOpen('\uE000DIV'), createInsertOpen('\uE000DIV')), null, 'Insert open')
            assert.strictEqual(merge(createInsertClose('\uE000DIV'), createInsertClose('\uE000DIV')), null, 'Insert close')
            assert.strictEqual(merge(createInsertEmbed('\uE000DIV'), createInsertEmbed('\uE000DIV')), null, 'Insert embed')
            assert.strictEqual(
                merge(
                    createInsertText('hello', ['attributeName', 'attributeValue']),
                    createInsertText('hello')
                ),
                null,
                'Different attribute lengths')
            assert.strictEqual(
                merge(
                    createInsertText('hello', ['attributeName', 'attributeValue1']),
                    createInsertText('hello', ['attributeName', 'attributeValue2'])
                ),
                null,
                'Different attributes')
        })
    })

    describe('slice', function () {

        it('retain', function () {
            assert.deepEqual(
                slice(createRetain(5, ['key', 'value']), 0, 5, 5),
                createRetain(5, ['key', 'value']))
            assert.deepEqual(
                slice(createRetain(5, ['key', 'value']), 0, 2, 5),
                createRetain(2, ['key', 'value']))
            assert.deepEqual(
                slice(createRetain(5, ['key', 'value']), 1, 2, 5),
                createRetain(2, ['key', 'value']))
            assert.deepEqual(
                slice(createRetain(5, ['key', 'value']), 2, 3, 5),
                createRetain(3, ['key', 'value']))
        })

        it('delete', function () {
            assert.deepEqual(
                slice(createDelete(5), 0, 5, 5),
                createDelete(5))
            assert.deepEqual(
                slice(createDelete(5), 0, 2, 5),
                createDelete(2))
            assert.deepEqual(
                slice(createDelete(5), 1, 2, 5),
                createDelete(2))
            assert.deepEqual(
                slice(createDelete(5), 2, 3, 5),
                createDelete(3))
        })

        it('insert text', function () {
            assert.deepEqual(
                slice(createInsertText('hello', ['key', 'value']), 0, 5, 5),
                createInsertText('hello', ['key', 'value']))
            assert.deepEqual(
                slice(createInsertText('hello', ['key', 'value']), 0, 2, 5),
                createInsertText('he', ['key', 'value']))
            assert.deepEqual(
                slice(createInsertText('hello', ['key', 'value']), 1, 2, 5),
                createInsertText('el', ['key', 'value']))
            assert.deepEqual(
                slice(createInsertText('hello', ['key', 'value']), 2, 3, 5),
                createInsertText('llo', ['key', 'value']))
        })

        it('insert open', function () {
            assert.deepEqual(
                slice(createInsertOpen('\uE000DIV', ['key', 'value']), 0, 1, 1),
                createInsertOpen('\uE000DIV', ['key', 'value']))
        })

        it('insert close', function () {
            assert.deepEqual(
                slice(createInsertClose('\uE000DIV', ['key', 'value']), 0, 1, 1),
                createInsertClose('\uE000DIV', ['key', 'value']))
        })

        it('insert embed', function () {
            assert.deepEqual(
                slice(createInsertEmbed('\uE000DIV', ['key', 'value']), 0, 1, 1),
                createInsertEmbed('\uE000DIV', ['key', 'value']))
        })
    })

    describe('composeIterators', function () {
        it('iterator1 and iterator2 empty', function () {
            const i1 = new Iterator([])
            const i2 = new Iterator([])
            const composedAction = null

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 empty', function () {
            const i1 = new Iterator([])
            const i2 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const composedAction = createInsertText('ello', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator2 empty', function () {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([])
            const composedAction = createInsertText('ello', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 delete, iterator2 insert', function () {
            const i1 = new Iterator([ createDelete(5) ]).next(1)
            const i2 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const composedAction = createInsertText('ello', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 1)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 delete, iterator2 retain', function () {
            const i1 = new Iterator([ createDelete(5) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(1)
            const composedAction = createDelete(4)

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 1)
        })

        it('iterator1 retain (with attributes), iterator2 retain (no attributes)', function () {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9) ]).next(2)
            const composedAction = createRetain(4, ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 6)
        })

        it('iterator1 retain (with attributes), iterator2 retain (the same atrributes)', function () {
            const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedAction = createRetain(4, ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 6)
        })

        it('iterator1 retain (no attributes), iterator2 retain (with attributes)', function () {
            const i1 = new Iterator([ createRetain(5) ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedAction = createRetain(4, ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 6)
        })

        it('iterator1 insert text (no attributes), iterator2 retain (with attributes)', function () {
            const i1 = new Iterator([ createInsertText('hello') ]).next(1)
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedAction = createInsertText('ello', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 6)
        })

        it('iterator1 insert text (no attributes), iterator2 retain (with attributes)', function () {
            const i1 = new Iterator([ createInsertText('hello') ]).next(1)
            const i2 = new Iterator([ createRetain(4, ['key', 'value']) ]).next(2)
            const composedAction = createInsertText('el', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 3)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 insert embed (no attributes), iterator2 retain (with attributes)', function () {
            const i1 = new Iterator([ createInsertEmbed('\uE000DIV') ])
            const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
            const composedAction = createInsertEmbed('\uE000DIV', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 3)
        })

        describe('attributes (retain+retain)', function () {
            it('iterator1 retain (with attributes), iterator2 retain (extra atrributes at start)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['anotherKey', 'anotherValue', 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (with attributes), iterator2 retain (extra atrributes at end)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(2)
                const composedAction = createRetain(4, ['key', 'value', 'z-anotherKey', 'anotherValue'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (extra attributes at start), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createRetain(5, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['anotherKey', 'anotherValue', 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (with attributes at end), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['key', 'value', 'z-anotherKey', 'anotherValue'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at start)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['anotherKey', null, 'key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['anotherKey', null, 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (with attributes), iterator2 retain (extra null atrributes at end)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', null]) ]).next(2)
                const composedAction = createRetain(4, ['key', 'value', 'z-anotherKey', null])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (extra null attributes at start), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createRetain(5, ['anotherKey', null, 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['anotherKey', null, 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (extra null attributes at end), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value', 'z-anotherKey', null]) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createRetain(4, ['key', 'value', 'z-anotherKey', null])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 retain (with attributes), iterator2 retain (with null atrributes)', function () {
                const i1 = new Iterator([ createRetain(5, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', null]) ]).next(2)
                const composedAction = createRetain(4, ['key', null])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
        })

        describe('attributes (insert+retain)', function () {
            it('iterator1 insert (with attributes), iterator2 retain (extra atrributes at start)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['anotherKey', 'anotherValue', 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (with attributes), iterator2 retain (extra atrributes at end)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value', 'z-anotherKey', 'anotherValue'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (extra attributes at start), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['anotherKey', 'anotherValue', 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['anotherKey', 'anotherValue', 'key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (with attributes at end), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value', 'z-anotherKey', 'anotherValue']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value', 'z-anotherKey', 'anotherValue'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at start)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['anotherKey', null, 'key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (with attributes), iterator2 retain (extra null atrributes at end)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value', 'z-anotherKey', null]) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (extra null attributes at start), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['anotherKey', null, 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (extra null attributes at end), iterator2 retain (with atrributes)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value', 'z-anotherKey', null]) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', 'value']) ]).next(2)
                const composedAction = createInsertText('ello', ['key', 'value'])

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
            it('iterator1 insert (with attributes), iterator2 retain (with null atrributes)', function () {
                const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(9, ['key', null]) ]).next(2)
                const composedAction = createInsertText('ello')

                assert.deepEqual(composeIterators(i1, i2), composedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 6)
            })
        })

        it('iterator1 retain, iterator2 delete (longer action)', function () {
            const i1 = new Iterator([ createRetain(5) ]).next(1)
            const i2 = new Iterator([ createDelete(8) ]).next(2)
            const composedAction = createDelete(4)

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 6)
        })

        it('iterator1 retain, iterator2 delete (shorter action)', function () {
            const i1 = new Iterator([ createRetain(5) ]).next(1)
            const i2 = new Iterator([ createDelete(3) ]).next(1)
            const composedAction = createDelete(2)

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 3)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 insert, iterator2 delete (longer action)', function () {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createDelete(8) ]).next(1)
            const composedAction = createDelete(3)

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 insert, iterator2 delete (shorter action)', function () {
            const i1 = new Iterator([ createInsertText('hello', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createDelete(3) ]).next(1)
            const composedAction = createInsertText('lo', ['key', 'value'])

            assert.deepEqual(composeIterators(i1, i2), composedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })
    })

    describe('transformIterators', function () {
        it('iterator1 insert, iterator2 insert (priority: left)', function () {
            const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createInsertText('xyz', ['key', 'value']) ]).next(1)
            const transformedAction = createInsertText('bc', ['key', 'value'])

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 1)
        })

        it('iterator1 insert, iterator2 insert (priority: right)', function () {
            const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createInsertText('xyz', ['key', 'value']) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 1)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 insert, iterator2 retain (priority: left)', function () {
            const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const transformedAction = createInsertText('bc', ['key', 'value'])

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 1)
        })

        it('iterator1 insert, iterator2 retain (priority: right)', function () {
            const i1 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const i2 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
            const transformedAction = createInsertText('bc', ['key', 'value'])

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 1)
        })

        it('iterator1 delete, iterator2 insert (priority: left)', function () {
            const i1 = new Iterator([ createDelete(5) ]).next(1)
            const i2 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 1)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 delete, iterator2 insert (priority: right)', function () {
            const i1 = new Iterator([ createDelete(5) ]).next(1)
            const i2 = new Iterator([ createInsertText('abc', ['key', 'value']) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 1)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 retain, iterator2 delete (priority: left)', function () {
            const i1 = new Iterator([ createRetain(5) ]).next(1)
            const i2 = new Iterator([ createDelete(8) ]).next(1)
            const transformedAction = null

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 5)
        })

        it('iterator1 retain, iterator2 delete (priority: right)', function () {
            const i1 = new Iterator([ createRetain(5) ]).next(1)
            const i2 = new Iterator([ createDelete(8) ]).next(1)
            const transformedAction = null

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 5)
        })

        it('iterator1 retain, iterator2 delete (priority: left)', function () {
            const i1 = new Iterator([ createRetain(6) ]).next(1)
            const i2 = new Iterator([ createDelete(4) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 retain, iterator2 delete (priority: right)', function () {
            const i1 = new Iterator([ createRetain(6) ]).next(1)
            const i2 = new Iterator([ createDelete(4) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 delete, iterator2 retain (priority: left)', function () {
            const i1 = new Iterator([ createDelete(4) ]).next(1)
            const i2 = new Iterator([ createRetain(6) ]).next(1)
            const transformedAction = createDelete(3)

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 4)
        })

        it('iterator1 delete, iterator2 retain (priority: right)', function () {
            const i1 = new Iterator([ createDelete(4) ]).next(1)
            const i2 = new Iterator([ createRetain(3) ]).next(1)
            const transformedAction = createDelete(2)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 3)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 retain, iterator2 retain (priority: left)', function () {
            const i1 = new Iterator([ createRetain(4) ]).next(1)
            const i2 = new Iterator([ createRetain(6) ]).next(1)
            const transformedAction = createRetain(3)

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 4)
        })

        it('iterator1 retain, iterator2 retain (priority: right)', function () {
            const i1 = new Iterator([ createRetain(4) ]).next(1)
            const i2 = new Iterator([ createRetain(6) ]).next(1)
            const transformedAction = createRetain(3)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 1)
            assert.strictEqual(i1.offset, 0)
            assert.strictEqual(i2.index, 0)
            assert.strictEqual(i2.offset, 4)
        })

        it('iterator1 retain, iterator2 retain (priority: left)', function () {
            const i1 = new Iterator([ createRetain(4) ]).next(1)
            const i2 = new Iterator([ createRetain(3) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 3)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        it('iterator1 retain, iterator2 retain (priority: right)', function () {
            const i1 = new Iterator([ createRetain(4) ]).next(1)
            const i2 = new Iterator([ createRetain(3) ]).next(1)
            const transformedAction = createRetain(2)

            assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
            assert.strictEqual(i1.index, 0)
            assert.strictEqual(i1.offset, 3)
            assert.strictEqual(i2.index, 1)
            assert.strictEqual(i2.offset, 0)
        })

        describe('iterator1 retain, iterator2 retain (attributes)', function () {
            it('an attribute <-> the same attribute (priority: left)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['key', 'value'])

                assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('an attribute <-> the same attribute (priority: right)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1)

                assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('an attribute <-> extra attribute at end (priority: left)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value', 'z key', 'z value']) ]).next(1)
                const transformedAction = createRetain(1, ['key', 'value'])

                assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('an attribute <-> extra attribute at end (priority: right)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value', 'z key', 'z value']) ]).next(1)
                const transformedAction = createRetain(1)

                assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('an attribute <-> extra attribute at start (priority: left)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['a key', 'a value', 'key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['key', 'value'])

                assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('an attribute <-> extra attribute at start (priority: right)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['a key', 'a value', 'key', 'value']) ]).next(1)
                const transformedAction = createRetain(1)

                assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('extra attribute at end <-> an attribute (priority: left)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value', 'z key', 'z value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['key', 'value', 'z key', 'z value'])

                assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('extra attribute at end <-> an attribute (priority: right)', function () {
                const i1 = new Iterator([ createRetain(2, ['key', 'value', 'z key', 'z value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['z key', 'z value'])

                assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('extra attribute at start <-> an attribute (priority: left)', function () {
                const i1 = new Iterator([ createRetain(2, ['a key', 'a value', 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['a key', 'a value', 'key', 'value'])

                assert.deepEqual(transformIterators(i1, i2, true), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })

            it('extra attribute at start <-> an attribute (priority: right)', function () {
                const i1 = new Iterator([ createRetain(2, ['a key', 'a value', 'key', 'value']) ]).next(1)
                const i2 = new Iterator([ createRetain(3, ['key', 'value']) ]).next(1)
                const transformedAction = createRetain(1, ['a key', 'a value'])

                assert.deepEqual(transformIterators(i1, i2, false), transformedAction)
                assert.strictEqual(i1.index, 1)
                assert.strictEqual(i1.offset, 0)
                assert.strictEqual(i2.index, 0)
                assert.strictEqual(i2.offset, 2)
            })
        })
    })
})
