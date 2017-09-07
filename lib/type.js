const Iterator = require('./Iterator')
const Operation = require('./Operation')
const {
    ACTION, CONTENT, VERSION, AUTHOR, ATTRIBUTES,
    ACTION_INSERT_TEXT, ACTION_INSERT_OBJECT, ACTION_RETAIN, ACTION_DELETE
} = Operation

function create(snapshot) {
    return Array.isArray(snapshot) ? snapshot : []
}

function apply(snapshot, delta) {
    const snapshotIterator = new Iterator(snapshot)
    const deltaIterator = new Iterator(delta)
    const newSnapshot = []

    return newSnapshot
}

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    apply
}
