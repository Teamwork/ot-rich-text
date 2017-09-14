const tap = require('tap')
const Delta = require('../lib/Delta')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
} = require('../lib/Operation')
const nodeContent = '\uE000'

tap.test('create', t => {
    const snapshot = []

    t.equal(Delta.create(snapshot), snapshot)
    t.type(Delta.create(), Array)
    t.end()
})

tap.test('append', t => {
    t.test('left empty, right insert (text)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertText('hello', 1, 'user')), operations)
        t.strictSame(operations, [ createInsertText('hello', 1, 'user') ])
        t.end()
    })
    t.test('left empty, right insert (open)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertOpen(nodeContent, 1, 'user', 'DIV')), operations)
        t.strictSame(operations, [ createInsertOpen(nodeContent, 1, 'user', 'DIV') ])
        t.end()
    })
    t.test('left empty, right insert (close)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertClose(nodeContent, 1, 'user', 'DIV')), operations)
        t.strictSame(operations, [ createInsertClose(nodeContent, 1, 'user', 'DIV') ])
        t.end()
    })
    t.test('left empty, right insert (embed)', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed(nodeContent, 1, 'user', 'DIV')), operations)
        t.strictSame(operations, [ createInsertEmbed(nodeContent, 1, 'user', 'DIV') ])
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
        t.equal(Delta.append(operations, createInsertText('', 1, 'user')), operations)
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
        const operations = [ createInsertText('Hello', 1, 'user', ['key', 'value']) ]
        t.equal(Delta.append(operations, createInsertText(' World', 1, 'user', ['key', 'value'])), operations)
        t.strictSame(operations, [ createInsertText('Hello World', 1, 'user', ['key', 'value']) ])
        t.end()
    })

    t.test('left insert embed, right insert embed', t => {
        const operations = [ createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value']) ]
        t.equal(Delta.append(operations, createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value']),
            createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value'])
        ])
        t.end()
    })

    t.test('left delete, right insert text', t => {
        const operations = [ createDelete(5) ]
        t.equal(Delta.append(operations, createInsertText('hello', 1, 'user', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello', 1, 'user', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert text', t => {
        const operations = [ createInsertText('hello', 1, 'user', ['key', 'value']), createDelete(5) ]
        t.equal(Delta.append(operations, createInsertText(' world', 1, 'user', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello world', 1, 'user', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('left insert text and delete, right insert embed', t => {
        const operations = [ createInsertText('hello', 1, 'user', ['key', 'value']), createDelete(5) ]
        t.equal(Delta.append(operations, createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value'])), operations)
        t.strictSame(operations, [
            createInsertText('hello', 1, 'user', ['key', 'value']),
            createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value']),
            createDelete(5)
        ])
        t.end()
    })

    t.test('many', t => {
        const operations = []
        t.equal(Delta.append(operations, createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('Hello', 1, 'user', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText(' World', 1, 'user', ['key', 'value'])), operations)
        t.equal(Delta.append(operations, createInsertText('!!!', 1, 'user', ['key', 'value2'])), operations)
        t.equal(Delta.append(operations, createRetain(5)), operations)
        t.equal(Delta.append(operations, createDelete(3)), operations)
        t.equal(Delta.append(operations, createDelete(4)), operations)
        t.strictSame(operations, [
            createInsertEmbed(nodeContent, 1, 'user', 'DIV', ['key', 'value']),
            createInsertText('Hello World', 1, 'user', ['key', 'value']),
            createInsertText('!!!', 1, 'user', ['key', 'value2']),
            createRetain(5),
            createDelete(7)
        ])
        t.end()
    })

    t.end()
})

tap.test('compose', t => {
    const insertText1 = createInsertText('hello', 1, 'user', ['key', 'value'])
    const insertText2 = createInsertText(' world', 1, 'user', ['key', 'value'])
    const insertText3 = createInsertText('hello world', 1, 'user', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed(nodeContent, 1, 'user', 'DIV')
    const insertEmbed2 = createInsertEmbed(nodeContent, 1, 'user', 'DIV')
    const retain1 = createRetain(5)
    const retain2 = createRetain(8)
    const retain3 = createRetain(2)
    const retain4 = createRetain(3)
    const delete1 = createDelete(6)
    const delete2 = createDelete(3)
    const delete3 = createDelete(9)

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

    t.end()
})

tap.test('transform', t => {
    const insertText1 = createInsertText('hello', 1, 'user', ['key', 'value'])
    const insertText2 = createInsertText(' world', 1, 'user', ['key', 'value'])
    const insertEmbed1 = createInsertEmbed(nodeContent, 1, 'user', 'DIV')
    const insertEmbed2 = createInsertEmbed(nodeContent, 1, 'user', 'DIV')
    const retain1 = createRetain(5)
    const retain2 = createRetain(8)
    const retain3 = createRetain(11)
    const retain4 = createRetain(1)
    const retain5 = createRetain(6)
    const delete1 = createDelete(6)
    const delete2 = createDelete(3)

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

    t.end()
})
