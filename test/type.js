const tap = require('tap')
const type = require('../lib/type')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
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
