const tap = require('tap')
const type = require('../lib/type')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    INVALID_OPERATION
} = require('../lib/Operation')
const objectContent = '\uE000DIV'

tap.test('name', t => {
    t.equal(type.name, 'ot-rich-text')
    t.end()
})

tap.test('uri', t => {
    t.equal(type.uri, 'https://github.com/Teamwork/ot-rich-text')
    t.end()
})

tap.test('create', t => {
    const snapshot = []

    t.equal(type.create(snapshot), snapshot)
    t.type(type.create(), Array)
    t.end()
})

tap.test('append', t => {
    t.test('left empty, right insert (text)', t => {
        const operations = []
        t.equal(type.append(operations, createInsertText('hello')), operations)
        t.strictSame(operations, [ createInsertText('hello') ])
        t.end()
    })
    t.test('left empty, right insert (open)', t => {
        const operations = []
        t.equal(type.append(operations, createInsertOpen(objectContent)), operations)
        t.strictSame(operations, [ createInsertOpen(objectContent) ])
        t.end()
    })
    t.test('left empty, right insert (close)', t => {
        const operations = []
        t.equal(type.append(operations, createInsertClose(objectContent)), operations)
        t.strictSame(operations, [ createInsertClose(objectContent) ])
        t.end()
    })
    t.test('left empty, right insert (embed)', t => {
        const operations = []
        t.equal(type.append(operations, createInsertEmbed(objectContent)), operations)
        t.strictSame(operations, [ createInsertEmbed(objectContent) ])
        t.end()
    })
    t.test('left empty, right retain', t => {
        const operations = []
        t.equal(type.append(operations, createRetain(5)), operations)
        t.strictSame(operations, [ createRetain(5) ])
        t.end()
    })
    t.test('left empty, right delete', t => {
        const operations = []
        t.equal(type.append(operations, createDelete(5)), operations)
        t.strictSame(operations, [ createDelete(5) ])
        t.end()
    })
    t.test('left empty, right invalid', t => {
        const operations = []
        t.equal(type.append(operations, INVALID_OPERATION), operations)
        t.strictSame(operations, [])
        t.end()
    })

    t.test('left empty, right insert (empty)', t => {
        const operations = []
        t.equal(type.append(operations, createInsertText()), operations)
        t.strictSame(operations, [])
        t.end()
    })

    t.test('left retain, right retain', t => {
        const operations = [ createRetain(5) ]
        t.equal(type.append(operations, createRetain(7)), operations)
        t.strictSame(operations, [ createRetain(12) ])
        t.end()
    })

    t.test('left delete, right delete', t => {
        const operations = [ createDelete(5, 1, 'user') ]
        t.equal(type.append(operations, createDelete(7, 1, 'user')), operations)
        t.strictSame(operations, [ createDelete(12, 1, 'user') ])
        t.end()
    })

    t.test('left insert text, right insert text', t => {
        const operations = [ createInsertText('Hello', 1, 'user', 'key', 'value') ]
        t.equal(type.append(operations, createInsertText(' World', 1, 'user', 'key', 'value')), operations)
        t.strictSame(operations, [ createInsertText('Hello World', 1, 'user', 'key', 'value') ])
        t.end()
    })

    t.test('left insert embed, right insert embed', t => {
        const operations = [ createInsertEmbed(objectContent, 1, 'user', 'key', 'value') ]
        t.equal(type.append(operations, createInsertEmbed(objectContent, 1, 'user', 'key', 'value')), operations)
        t.strictSame(operations, [
            createInsertEmbed(objectContent, 1, 'user', 'key', 'value'),
            createInsertEmbed(objectContent, 1, 'user', 'key', 'value')
        ])
        t.end()
    })

    t.test('many', t => {
        const operations = []
        t.equal(type.append(operations, createInsertEmbed(objectContent, 1, 'user', 'key', 'value')), operations)
        t.equal(type.append(operations, createInsertText('Hello', 1, 'user', 'key', 'value')), operations)
        t.equal(type.append(operations, createInsertText(' World', 1, 'user', 'key', 'value')), operations)
        t.equal(type.append(operations, createInsertText('!!!', 2, 'user', 'key', 'value')), operations)
        t.equal(type.append(operations, createRetain(5)), operations)
        t.equal(type.append(operations, createDelete(3, 5, 'user')), operations)
        t.equal(type.append(operations, createDelete(4, 5, 'user')), operations)
        t.strictSame(operations, [
            createInsertEmbed(objectContent, 1, 'user', 'key', 'value'),
            createInsertText('Hello World', 1, 'user', 'key', 'value'),
            createInsertText('!!!', 2, 'user', 'key', 'value'),
            createRetain(5),
            createDelete(7, 5, 'user')
        ])
        t.end()
    })

    t.end()
})

tap.test('apply', t => {
    t.equal(type.apply, type.compose)
    t.end()
})

tap.test('compose', t => {
    t.test('left empty, right insert', t => {
        const insertText1 = createInsertText('hello')
        const insertObject1 = createInsertEmbed(objectContent)
        const insertText2 = createInsertText('world')
        const insertObject2 = createInsertEmbed(objectContent)

        const operations = type.compose([], [ insertText1, insertObject1, insertText2, insertObject2 ])

        t.strictSame(operations, [ insertText1, insertObject1, insertText2, insertObject2 ])
        t.end()
    })

    t.end()
})
