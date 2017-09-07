const tap = require('tap')
const type = require('../lib/type')

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
