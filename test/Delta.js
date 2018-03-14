const tap = require('tap')
const Delta = require('../lib/Delta')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
} = require('../lib/Operation')

tap.test('create', t => {
    const snapshot = []

    t.equal(Delta.create(snapshot), snapshot)
    t.type(Delta.create(), Array)
    t.end()
})

tap.test('validate', t => {
    t.type(Delta.validate({ length: 0 }), Error, 'not an array')
    t.type(Delta.validate(null), Error, 'not an array')
    t.type(Delta.validate(undefined), Error, 'not an array')
    t.type(Delta.validate('insert'), Error, 'not an array')
    t.type(Delta.validate([ createRetain(0) ]), Error, 'invalid operation at 0')
    t.type(Delta.validate([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'invalid operation at 2')
    t.equal(Delta.validate([]), null)
    t.equal(Delta.validate([ createRetain(1), createDelete(1), createInsertText('a') ]), null)
    t.end()
})

tap.test('normalize', t => {
    t.throws(() => Delta.normalize({ length: 0 }), Error, 'not an array')
    t.throws(() => Delta.normalize(null), Error, 'not an array')
    t.throws(() => Delta.normalize(undefined), Error, 'not an array')
    t.throws(() => Delta.normalize('insert'), Error, 'not an array')
    t.throws(() => Delta.normalize([ createRetain(0) ]), Error, 'invalid operation at 0')
    t.throws(() => Delta.normalize([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'invalid operation at 2')
    Delta.normalize([])
    Delta.normalize([ createRetain(1), createDelete(1), createInsertText('a') ])
    t.end()
})

tap.test('append', t => {
    t.test('left empty, right insert (text)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertText('hello')), operations)
        t.strictSame(operations, [ createInsertText('hello') ])
        t.end()
    })
    t.test('left empty, right insert (open)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertOpen('\uE000DIV')), operations)
        t.strictSame(operations, [ createInsertOpen('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right insert (close)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertClose('\uE000DIV')), operations)
        t.strictSame(operations, [ createInsertClose('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right insert (embed)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed('\uE000DIV')), operations)
        t.strictSame(operations, [ createInsertEmbed('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right retain', t => {
        const operations = []
        t.equal(Delta.append(operations, createRetain(5)), operations)
        t.strictSame(operations, [ createRetain(5) ])
        t.end()
    })
    t.test('left empty, right delete', t => {
        const operations = []
        t.equal(Delta.append(operations, createDelete(5)), operations)
        t.strictSame(operations, [ createDelete(5) ])
        t.end()
    })

    t.test('left empty, right insert (empty)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertText('')), operations)
        t.strictSame(operations, [])
        t.end()
    })

    t.test('left retain, right retain', t => {
        const operations = [ createRetain(5) ]
        t.equal(Delta.append(operations, createRetain(7)), operations)
        t.strictSame(operations, [ createRetain(12) ])
        t.end()
    })

    t.test('left delete, right delete', t => {
        const operations = [ createDelete(5) ]
        t.equal(Delta.append(operations, createDelete(7)), operations)
        t.strictSame(operations, [ createDelete(12) ])
        t.end()
    })

    t.test('left insert text, right insert text', t => {
        const operations = [ createInsertText('Hello', ['key', 'value']) ]
        t.equal(Delta.append(operations, createInsertText(' World', ['key', 'value'])), operations)
        t.strictSame(operations, [ createInsertText('Hello World', ['key', 'value']) ])
        t.end()
    })

    t.test('left insert embed, right insert embed', t => {
        const operations = [ createInsertEmbed('\uE000DIV', ['key', 'value']) ]
        t.equal(Delta.append(operations, createInsertEmbed('\uE000DIV', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createInsertEmbed('\uE000DIV', ['key', 'value'])
        ])
        t.end()
    })

    t.test('left delete, right insert text', t => {
        const operations = [ createDelete(5) ]
        t.equal(Delta.append(operations, createInsertText('hello', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert text', t => {
        const operations = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
        t.equal(Delta.append(operations, createInsertText(' world', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello world', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert embed', t => {
        const operations = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
        t.equal(Delta.append(operations, createInsertEmbed('\uE000DIV', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello', ['key', 'value']),
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('many', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed('\uE000DIV', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('Hello', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText(' World', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('!!!', ['key', 'value2'])), operations)
        t.equal(Delta.append(operations, createRetain(5)), operations)
        t.equal(Delta.append(operations, createDelete(3)), operations)
        t.equal(Delta.append(operations, createDelete(4)), operations)
        t.strictSame(operations, [
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createInsertText('Hello World', ['key', 'value']),
            createInsertText('!!!', ['key', 'value2']),
            createRetain(5),
            createDelete(7)
        ])
        t.end()
    })

    t.end()
})

tap.test('chop', t => {
    t.strictSame(Delta.chop(
        [ createInsertText('hello') ]),
        [ createInsertText('hello') ])
    t.strictSame(Delta.chop(
        [ createInsertText('hello'), createInsertText('hello') ]),
        [ createInsertText('hello'), createInsertText('hello') ])
    t.strictSame(Delta.chop(
        [ createInsertText('hello'), createRetain(5) ]),
        [ createInsertText('hello') ])
    t.strictSame(Delta.chop(
        [ createRetain(5) ]),
        [])
    t.strictSame(Delta.chop(
        [ createRetain(5), createInsertText('hello') ]),
        [ createRetain(5), createInsertText('hello') ])
    t.strictSame(Delta.chop(
        [ createRetain(5, ['key', 'value']) ]),
        [ createRetain(5, ['key', 'value']) ])

    t.end()
})

tap.test('compose', t => {
    const insertText1 = createInsertText('hello', ['key', 'value'])
    const insertText2 = createInsertText(' world', ['key', 'value'])
    const insertText3 = createInsertText('hello world', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed('\uE000DIV')
    const insertEmbed2 = createInsertEmbed('\uE000DIV')
    const retain1 = createRetain(5)
    const retain2 = createRetain(8)
    const retain3 = createRetain(2)
    const retain4 = createRetain(3)
    const delete1 = createDelete(6)
    const delete2 = createDelete(3)
    const delete3 = createDelete(9)

    t.strictSame(Delta.compose([], []), [])

    t.strictSame(Delta.compose(
        [],
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]),
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ])

    t.strictSame(Delta.compose(
        [ delete1, delete2 ],
        [ insertText1, insertText2 ]),
        [ insertText3, delete3 ])

    t.strictSame(Delta.compose(
        [ insertText2, retain1, insertEmbed1 ],
        [ insertText1, retain2, insertEmbed2 ]),
        [ insertText3, retain3, insertEmbed2, retain4, insertEmbed1 ])

    t.strictSame(Delta.compose(
        [ createRetain(5) ],
        [ createRetain(5) ]),
        [],
        'Should remove trailing retain')

    t.strictSame(Delta.compose(
        [ createRetain(5, ['key', 'value']) ],
        [ createRetain(5) ]),
        [ createRetain(5, ['key', 'value']) ],
        'Should keep trailing retain with attributes')

    t.strictSame(Delta.compose(
        [ createRetain(5, ['key', 'value']) ],
        [ createRetain(5), createDelete(6) ]),
        [ createRetain(5, ['key', 'value']), createDelete(6) ],
        'Should keep trailing delete')

    t.end()
})

tap.test('apply', t => {
    const insertText1 = createInsertText('hello', ['key', 'value'])
    const insertText2 = createInsertText(' world', ['key', 'value'])
    const insertText3 = createInsertText('hello world', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed('\uE000BR')
    const insertEmbed2 = createInsertEmbed('\uE000IMG')
    const retain1 = createRetain(6)
    const retain2 = createRetain(8)
    const delete1 = createDelete(6)
    const delete2 = createDelete(8)

    t.strictSame(Delta.apply([], []), [])

    t.strictSame(Delta.apply(
        [],
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]),
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ])

    t.strictSame(Delta.apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, retain1, insertEmbed2 ]),
        [ insertText3, insertEmbed2, insertEmbed1 ])

    t.strictSame(Delta.apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, delete1, insertEmbed2 ]),
        [ insertText1, insertEmbed2, insertEmbed1 ])

    t.strictSame(Delta.apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, retain2, insertEmbed2 ]),
        [ insertText3, insertEmbed1 ])

    t.strictSame(Delta.apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, delete2, insertEmbed2 ]),
        [ insertText1 ])

    t.end()
})

tap.test('transform', t => {
    const insertText1 = createInsertText('hello', ['key', 'value'])
    const insertText2 = createInsertText(' world', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed('\uE000DIV')
    const insertEmbed2 = createInsertEmbed('\uE000DIV')
    const retain1 = createRetain(5)
    const retain2 = createRetain(8)
    const retain3 = createRetain(11)
    const retain4 = createRetain(1)
    const retain5 = createRetain(6)
    const delete1 = createDelete(6)
    const delete2 = createDelete(3)

    t.strictSame(Delta.transform([], [], 'left'), [])
    t.strictSame(Delta.transform([], [], 'right'), [])

    t.strictSame(Delta.transform(
        [ insertText1, retain1, delete1, insertEmbed1 ],
        [ insertText2, retain2, insertEmbed2 ],
        'left'),
        [
            insertText1, // comes first because of the priority
            retain3, // insertText2 (6 characters) + retain1 (5 characters) & retain2 (first 5 characters) -> merged by append
            delete2, // delete1 (first 3 characters) & retain2 (remaining 3 chars)
            retain4, // insertText2 (1 character)
            insertEmbed1, // moved before delete1 (remaining 3 characters) by append
            delete2 // delete1 (remaining 3 characters)
        ])

    t.strictSame(Delta.transform(
        [ insertText1, retain1, delete1, insertEmbed1 ],
        [ insertText2, retain2, insertEmbed2 ],
        'right'),
        [
            retain5, // insertText2 (6 characters) retained first, because of priority
            insertText1, // comes second because of the priority
            retain1, // retain1 (5 characters) & retain2 (first 5 characters)
            delete2, // delete1 (first 3 characters) & retain2 (remaining 3 chars)
            retain4, // insertText2 (1 character)
            insertEmbed1, // moved before delete1 (remaining 3 characters) by append
            delete2 // delete1 (remaining 3 characters)
        ])

    t.strictSame(Delta.transform(
        [ createRetain(5) ],
        [ createRetain(5) ],
        'left'),
        [],
        'Should remove trailing retain')

    t.strictSame(Delta.transform(
        [ createRetain(5) ],
        [ createRetain(5) ],
        'right'),
        [],
        'Should remove trailing retain')

    t.strictSame(Delta.transform(
        [ createRetain(5, ['key', 'value']) ],
        [ createRetain(5) ],
        'left'),
        [ createRetain(5, ['key', 'value']) ],
        'Should keep trailing retain with attributes')

    t.end()
})

tap.test('transformCursor', t => {
    t.equal(Delta.transformCursor(0, [], true), 0)
    t.equal(Delta.transformCursor(0, [], false), 0)
    t.equal(Delta.transformCursor(0, [ createInsertText('ab') ], true), 2)
    t.equal(Delta.transformCursor(0, [ createInsertText('ab') ], false), 0)
    t.equal(Delta.transformCursor(0, [ createDelete(2) ], true), 0)
    t.equal(Delta.transformCursor(0, [ createDelete(2) ], false), 0)
    t.equal(Delta.transformCursor(0, [ createRetain(2) ], true), 0)
    t.equal(Delta.transformCursor(0, [ createRetain(2) ], false), 0)

    t.equal(Delta.transformCursor(5, [], true), 5)
    t.equal(Delta.transformCursor(5, [], false), 5)
    t.equal(Delta.transformCursor(5, [ createInsertText('ab') ], true), 7)
    t.equal(Delta.transformCursor(5, [ createInsertText('ab') ], false), 7)
    t.equal(Delta.transformCursor(5, [ createDelete(2) ], true), 3)
    t.equal(Delta.transformCursor(5, [ createDelete(2) ], false), 3)
    t.equal(Delta.transformCursor(5, [ createRetain(2) ], true), 5)
    t.equal(Delta.transformCursor(5, [ createRetain(2) ], false), 5)

    t.equal(Delta.transformCursor(5, [
        createRetain(5), createInsertText('abc'), createInsertText('def')
    ], true), 11)
    t.equal(Delta.transformCursor(5, [
        createRetain(5), createInsertText('abc'), createInsertText('def')
    ], false), 5)
    t.equal(Delta.transformCursor(5, [
        createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
    ], true), 8)
    t.equal(Delta.transformCursor(5, [
        createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
    ], false), 5)

    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(1), createRetain(3)
    ], true), 4)
    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(1), createRetain(3)
    ], false), 4)
    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(2), createRetain(3)
    ], true), 3)
    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(2), createRetain(3)
    ], false), 3)
    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(3), createRetain(3)
    ], true), 3)
    t.equal(Delta.transformCursor(5, [
        createRetain(3), createDelete(3), createRetain(3)
    ], false), 3)

    t.end()
})

tap.test('diffX', t => {
    t.throws(() => Delta.diffX(
        [ createRetain(1) ],
        []
    ), Error)
    t.throws(() => Delta.diffX(
        [ createDelete(1) ],
        []
    ), Error)
    t.throws(() => Delta.diffX(
        [],
        [ createRetain(1) ]
    ), Error)
    t.throws(() => Delta.diffX(
        [],
        [ createDelete(1) ]
    ), Error)

    t.throws(() => Delta.diffX(
        [ createRetain(1) ],
        [ createInsertText('a') ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createDelete(1) ],
        [ createInsertText('a') ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createInsertText('a') ],
        [ createRetain(1) ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createInsertText('a') ],
        [ createDelete(1) ]
    ), Error)

    t.throws(() => Delta.diffX(
        [ createInsertText('a'), createRetain(1) ],
        [ createInsertText('b'), createInsertText('a') ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createInsertText('a'), createDelete(1) ],
        [ createInsertText('b'), createInsertText('a') ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createInsertText('a'), createInsertText('a') ],
        [ createInsertText('b'), createRetain(1) ]
    ), Error)
    t.throws(() => Delta.diffX(
        [ createInsertText('a'), createInsertText('a') ],
        [ createInsertText('b'), createDelete(1) ]
    ), Error)

    const testDiffImpl = (delta1, delta2) => {
        const [ result1, result2 ] = Delta.diffX(delta1, delta2)

        t.strictSame(Delta.apply(delta1, result2), delta2)
        t.strictSame(Delta.apply(delta2, result1), delta1)
    }

    const testDiff = (delta1, delta2) => {
        testDiffImpl(delta1, delta2)
        testDiffImpl(delta2, delta1)
    }

    const delta = []
    testDiff(delta, delta)
    testDiff([], [])

    testDiff([
        createInsertText('abc'),
        createInsertOpen('\uE000DIV'),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertClose('\uE000DIV')
    ], [])

    testDiff([
        createInsertText('abc')
    ], [
        createInsertText('a'),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('abc', [ 'blah', 'blah!' ])
    ], [
        createInsertText('abc', [ 'hello', 'world' ])
    ])

    testDiff([
        createInsertText('a', [ 'blah', 'blah!' ]),
        createInsertText('b'),
        createInsertText('c', [ 'hello', 'world' ])
    ], [
        createInsertText('abc', [ 'hello', 'world' ])
    ])

    testDiff([
        createInsertText('a', [ 'blah', 'blah!', 'hello', 'world' ]),
        createInsertText('b'),
        createInsertText('c', [ 'hello', 'world' ])
    ], [
        createInsertText('abc', [ 'a', 'p', 'blah', '', 'hello', 'world' ])
    ])

    testDiff([
        createInsertText('a'),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image2.png' ]),
        createInsertText('c')
    ], [
        createInsertText('a'),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('a'),
        createInsertEmbed('\uE000BR'),
        createInsertText('c')
    ], [
        createInsertText('a'),
        createInsertEmbed('\uE000IMG'),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('aef sefef '),
        createInsertEmbed('\uE000BR'),
        createInsertText('c')
    ], [
        createInsertText('aef'),
        createInsertEmbed('\uE000IMG'),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('aef sefef '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c')
    ], [
        createInsertText('aef'),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image2.png', 'zzz', '' ]),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c')
    ], [
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c')
    ])

    testDiff([
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c'),
        createInsertEmbed('\uE000BR')
    ], [
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c'),
        createInsertEmbed('\uE000HR')
    ])

    testDiff([
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c'),
        createInsertEmbed('\uE000BR', [ 'hello', 'world' ])
    ], [
        createInsertText('abc '),
        createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
        createInsertText('c'),
        createInsertEmbed('\uE000BR', [ 'hello', 'world!!!' ])
    ])

    t.end()
})
