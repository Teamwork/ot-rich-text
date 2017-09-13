const tap = require('tap')
const Delta = require('../lib/Delta')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
} = require('../lib/Operation')
const objectContent = '\uE000DIV'

tap.test('create', t => {
    const snapshot = []

    t.equal(Delta.create(snapshot), snapshot)
    t.type(Delta.create(), Array)
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
        t.equal(Delta.append(operations, createInsertOpen(objectContent)), operations)
        t.strictSame(operations, [ createInsertOpen(objectContent) ])
        t.end()
    })
    t.test('left empty, right insert (close)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertClose(objectContent)), operations)
        t.strictSame(operations, [ createInsertClose(objectContent) ])
        t.end()
    })
    t.test('left empty, right insert (embed)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed(objectContent)), operations)
        t.strictSame(operations, [ createInsertEmbed(objectContent) ])
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
        t.equal(Delta.append(operations, createInsertText()), operations)
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
        const operations = [ createInsertEmbed(objectContent, ['key', 'value']) ]
        t.equal(Delta.append(operations, createInsertEmbed(objectContent, ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertEmbed(objectContent, ['key', 'value']),
            createInsertEmbed(objectContent, ['key', 'value'])
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
        t.equal(Delta.append(operations, createInsertEmbed(objectContent, ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello', ['key', 'value']),
            createInsertEmbed(objectContent, ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('many', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed(objectContent, ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('Hello', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText(' World', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('!!!', ['key', 'value2'])), operations)
        t.equal(Delta.append(operations, createRetain(5)), operations)
        t.equal(Delta.append(operations, createDelete(3)), operations)
        t.equal(Delta.append(operations, createDelete(4)), operations)
        t.strictSame(operations, [
            createInsertEmbed(objectContent, ['key', 'value']),
            createInsertText('Hello World', ['key', 'value']),
            createInsertText('!!!', ['key', 'value2']),
            createRetain(5),
            createDelete(7)
        ])
        t.end()
    })

    t.end()
})

tap.test('compose', t => {
    // TODO compose 2 longer deltas

    const insertText1 = createInsertText('hello', ['key', 'value'])
    const insertText2 = createInsertText(' world', ['key', 'value'])
    const insertText3 = createInsertText('hello world', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed(objectContent)
    const insertEmbed2 = createInsertEmbed(objectContent)
    const retain1 = createRetain(5)
    const retain2 = createRetain(8)
    const delete1 = createDelete(6)
    const delete2 = createDelete(3)
    const delete3 = createDelete(9)

    t.test('left empty, right insert', t => {
        const left = []
        const right = [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]
        const expected = [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]

        t.strictSame(Delta.compose(left, right), expected)
        t.end()
    })

    t.test('left delete, right insert', t => {
        const left = [ delete1, delete2 ]
        const right = [ insertText1, insertText2 ]
        const expected = [ insertText3, delete3 ]

        t.strictSame(Delta.compose(left, right), expected)
        t.end()
    })

    t.end()
})