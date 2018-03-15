const tap = require('tap')
const {
    create, validate, append, normalize, diffX, compose, transform, transformCursor, apply, chop
} = require('../lib/Operation')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
} = require('../lib/Action')

tap.test('create', t => {
    const snapshot = []

    t.equal(create(snapshot), snapshot)
    t.type(create(), Array)
    t.end()
})

tap.test('validate', t => {
    t.type(validate({ length: 0 }), Error, 'not an array')
    t.type(validate(null), Error, 'not an array')
    t.type(validate(undefined), Error, 'not an array')
    t.type(validate('insert'), Error, 'not an array')
    t.type(validate([ createRetain(0) ]), Error, 'invalid action at 0')
    t.type(validate([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'invalid action at 2')
    t.equal(validate([]), null)
    t.equal(validate([ createRetain(1), createDelete(1), createInsertText('a') ]), null)
    t.end()
})

tap.test('normalize', t => {
    t.throws(() => normalize({ length: 0 }), Error, 'not an array')
    t.throws(() => normalize(null), Error, 'not an array')
    t.throws(() => normalize(undefined), Error, 'not an array')
    t.throws(() => normalize('insert'), Error, 'not an array')
    t.throws(() => normalize([ createRetain(0) ]), Error, 'invalid action at 0')
    t.throws(() => normalize([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'invalid action at 2')
    normalize([])
    normalize([ createRetain(1), createDelete(1), createInsertText('a') ])
    t.end()
})

tap.test('append', t => {
    t.test('left empty, right insert (text)', t => {
        const operation = []
        t.equal(append(operation, createInsertText('hello')), operation)
        t.strictSame(operation, [ createInsertText('hello') ])
        t.end()
    })
    t.test('left empty, right insert (open)', t => {
        const operation = []
        t.equal(append(operation, createInsertOpen('\uE000DIV')), operation)
        t.strictSame(operation, [ createInsertOpen('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right insert (close)', t => {
        const operation = []
        t.equal(append(operation, createInsertClose('\uE000DIV')), operation)
        t.strictSame(operation, [ createInsertClose('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right insert (embed)', t => {
        const operation = []
        t.equal(append(operation, createInsertEmbed('\uE000DIV')), operation)
        t.strictSame(operation, [ createInsertEmbed('\uE000DIV') ])
        t.end()
    })
    t.test('left empty, right retain', t => {
        const operation = []
        t.equal(append(operation, createRetain(5)), operation)
        t.strictSame(operation, [ createRetain(5) ])
        t.end()
    })
    t.test('left empty, right delete', t => {
        const operation = []
        t.equal(append(operation, createDelete(5)), operation)
        t.strictSame(operation, [ createDelete(5) ])
        t.end()
    })

    t.test('left empty, right insert (empty)', t => {
        const operation = []
        t.equal(append(operation, createInsertText('')), operation)
        t.strictSame(operation, [])
        t.end()
    })

    t.test('left retain, right retain', t => {
        const operation = [ createRetain(5) ]
        t.equal(append(operation, createRetain(7)), operation)
        t.strictSame(operation, [ createRetain(12) ])
        t.end()
    })

    t.test('left delete, right delete', t => {
        const operation = [ createDelete(5) ]
        t.equal(append(operation, createDelete(7)), operation)
        t.strictSame(operation, [ createDelete(12) ])
        t.end()
    })

    t.test('left insert text, right insert text', t => {
        const operation = [ createInsertText('Hello', ['key', 'value']) ]
        t.equal(append(operation, createInsertText(' World', ['key', 'value'])), operation)
        t.strictSame(operation, [ createInsertText('Hello World', ['key', 'value']) ])
        t.end()
    })

    t.test('left insert embed, right insert embed', t => {
        const operation = [ createInsertEmbed('\uE000DIV', ['key', 'value']) ]
        t.equal(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
        t.strictSame(operation, [
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createInsertEmbed('\uE000DIV', ['key', 'value'])
        ])
        t.end()
    })

    t.test('left delete, right insert text', t => {
        const operation = [ createDelete(5) ]
        t.equal(append(operation, createInsertText('hello', ['key', 'value'])), operation)
        t.strictSame(operation, [
            createInsertText('hello', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert text', t => {
        const operation = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
        t.equal(append(operation, createInsertText(' world', ['key', 'value'])), operation)
        t.strictSame(operation, [
            createInsertText('hello world', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert embed', t => {
        const operation = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
        t.equal(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
        t.strictSame(operation, [
            createInsertText('hello', ['key', 'value']),
            createInsertEmbed('\uE000DIV', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('many', t => {
        const operation = []
        t.equal(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
        t.equal(append(operation, createInsertText('Hello', ['key', 'value'])), operation)
        t.equal(append(operation, createInsertText(' World', ['key', 'value'])), operation)
        t.equal(append(operation, createInsertText('!!!', ['key', 'value2'])), operation)
        t.equal(append(operation, createRetain(5)), operation)
        t.equal(append(operation, createDelete(3)), operation)
        t.equal(append(operation, createDelete(4)), operation)
        t.strictSame(operation, [
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
    t.strictSame(chop(
        [ createInsertText('hello') ]),
        [ createInsertText('hello') ])
    t.strictSame(chop(
        [ createInsertText('hello'), createInsertText('hello') ]),
        [ createInsertText('hello'), createInsertText('hello') ])
    t.strictSame(chop(
        [ createInsertText('hello'), createRetain(5) ]),
        [ createInsertText('hello') ])
    t.strictSame(chop(
        [ createRetain(5) ]),
        [])
    t.strictSame(chop(
        [ createRetain(5), createInsertText('hello') ]),
        [ createRetain(5), createInsertText('hello') ])
    t.strictSame(chop(
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

    t.strictSame(compose([], []), [])

    t.strictSame(compose(
        [],
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]),
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ])

    t.strictSame(compose(
        [ delete1, delete2 ],
        [ insertText1, insertText2 ]),
        [ insertText3, delete3 ])

    t.strictSame(compose(
        [ insertText2, retain1, insertEmbed1 ],
        [ insertText1, retain2, insertEmbed2 ]),
        [ insertText3, retain3, insertEmbed2, retain4, insertEmbed1 ])

    t.strictSame(compose(
        [ createRetain(5) ],
        [ createRetain(5) ]),
        [],
        'Should remove trailing retain')

    t.strictSame(compose(
        [ createRetain(5, ['key', 'value']) ],
        [ createRetain(5) ]),
        [ createRetain(5, ['key', 'value']) ],
        'Should keep trailing retain with attributes')

    t.strictSame(compose(
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

    t.strictSame(apply([], []), [])

    t.strictSame(apply(
        [],
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]),
        [ insertText1, insertEmbed1, insertText2, insertEmbed2 ])

    t.strictSame(apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, retain1, insertEmbed2 ]),
        [ insertText3, insertEmbed2, insertEmbed1 ])

    t.strictSame(apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, delete1, insertEmbed2 ]),
        [ insertText1, insertEmbed2, insertEmbed1 ])

    t.strictSame(apply(
        [ insertText2, insertEmbed1 ],
        [ insertText1, retain2, insertEmbed2 ]),
        [ insertText3, insertEmbed1 ])

    t.strictSame(apply(
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

    t.strictSame(transform([], [], 'left'), [])
    t.strictSame(transform([], [], 'right'), [])

    t.strictSame(transform(
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

    t.strictSame(transform(
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

    t.strictSame(transform(
        [ createRetain(5) ],
        [ createRetain(5) ],
        'left'),
        [],
        'Should remove trailing retain')

    t.strictSame(transform(
        [ createRetain(5) ],
        [ createRetain(5) ],
        'right'),
        [],
        'Should remove trailing retain')

    t.strictSame(transform(
        [ createRetain(5, ['key', 'value']) ],
        [ createRetain(5) ],
        'left'),
        [ createRetain(5, ['key', 'value']) ],
        'Should keep trailing retain with attributes')

    t.end()
})

tap.test('transformCursor', t => {
    t.equal(transformCursor(0, [], true), 0)
    t.equal(transformCursor(0, [], false), 0)
    t.equal(transformCursor(0, [ createInsertText('ab') ], true), 2)
    t.equal(transformCursor(0, [ createInsertText('ab') ], false), 0)
    t.equal(transformCursor(0, [ createDelete(2) ], true), 0)
    t.equal(transformCursor(0, [ createDelete(2) ], false), 0)
    t.equal(transformCursor(0, [ createRetain(2) ], true), 0)
    t.equal(transformCursor(0, [ createRetain(2) ], false), 0)

    t.equal(transformCursor(5, [], true), 5)
    t.equal(transformCursor(5, [], false), 5)
    t.equal(transformCursor(5, [ createInsertText('ab') ], true), 7)
    t.equal(transformCursor(5, [ createInsertText('ab') ], false), 7)
    t.equal(transformCursor(5, [ createDelete(2) ], true), 3)
    t.equal(transformCursor(5, [ createDelete(2) ], false), 3)
    t.equal(transformCursor(5, [ createRetain(2) ], true), 5)
    t.equal(transformCursor(5, [ createRetain(2) ], false), 5)

    t.equal(transformCursor(5, [
        createRetain(5), createInsertText('abc'), createInsertText('def')
    ], true), 11)
    t.equal(transformCursor(5, [
        createRetain(5), createInsertText('abc'), createInsertText('def')
    ], false), 5)
    t.equal(transformCursor(5, [
        createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
    ], true), 8)
    t.equal(transformCursor(5, [
        createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
    ], false), 5)

    t.equal(transformCursor(5, [
        createRetain(3), createDelete(1), createRetain(3)
    ], true), 4)
    t.equal(transformCursor(5, [
        createRetain(3), createDelete(1), createRetain(3)
    ], false), 4)
    t.equal(transformCursor(5, [
        createRetain(3), createDelete(2), createRetain(3)
    ], true), 3)
    t.equal(transformCursor(5, [
        createRetain(3), createDelete(2), createRetain(3)
    ], false), 3)
    t.equal(transformCursor(5, [
        createRetain(3), createDelete(3), createRetain(3)
    ], true), 3)
    t.equal(transformCursor(5, [
        createRetain(3), createDelete(3), createRetain(3)
    ], false), 3)

    t.end()
})

tap.test('diffX', t => {
    t.throws(() => diffX(
        [ createRetain(1) ],
        []
    ), Error)
    t.throws(() => diffX(
        [ createDelete(1) ],
        []
    ), Error)
    t.throws(() => diffX(
        [],
        [ createRetain(1) ]
    ), Error)
    t.throws(() => diffX(
        [],
        [ createDelete(1) ]
    ), Error)

    t.throws(() => diffX(
        [ createRetain(1) ],
        [ createInsertText('a') ]
    ), Error)
    t.throws(() => diffX(
        [ createDelete(1) ],
        [ createInsertText('a') ]
    ), Error)
    t.throws(() => diffX(
        [ createInsertText('a') ],
        [ createRetain(1) ]
    ), Error)
    t.throws(() => diffX(
        [ createInsertText('a') ],
        [ createDelete(1) ]
    ), Error)

    t.throws(() => diffX(
        [ createInsertText('a'), createRetain(1) ],
        [ createInsertText('b'), createInsertText('a') ]
    ), Error)
    t.throws(() => diffX(
        [ createInsertText('a'), createDelete(1) ],
        [ createInsertText('b'), createInsertText('a') ]
    ), Error)
    t.throws(() => diffX(
        [ createInsertText('a'), createInsertText('a') ],
        [ createInsertText('b'), createRetain(1) ]
    ), Error)
    t.throws(() => diffX(
        [ createInsertText('a'), createInsertText('a') ],
        [ createInsertText('b'), createDelete(1) ]
    ), Error)

    const testDiffImpl = (operation1, operation2) => {
        const [ result1, result2 ] = diffX(operation1, operation2)

        t.strictSame(apply(operation1, result2), operation2)
        t.strictSame(apply(operation2, result1), operation1)
    }

    const testDiff = (operation1, operation2) => {
        testDiffImpl(operation1, operation2)
        testDiffImpl(operation2, operation1)
    }

    const operation = []
    testDiff(operation, operation)
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
