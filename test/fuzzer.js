const tap = require('tap')
const fuzzer = require('ot-fuzzer')
const type = require('../lib/type')
const Iterator = require('../lib/Iterator')
const { append } = require('../lib/Delta')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, getLength,
    slice
} = require('../lib/Operation')

const randomWord = () => fuzzer.randomWord()

const randomVersion = () => fuzzer.randomInt(3)

const users = [ '', 'Mary', 'John' ]
const randomUser = () => users[fuzzer.randomInt(3)]

const randomInsertText = () => createInsertText(randomWord(), randomVersion(), randomUser())

const getSnapshotLength = snapshot => {
    let length = 0

    for (let i = 0, l = snapshot.length; i < l; ++i) {
        const operation = snapshot[i]

        if (!isInsert(operation)) {
            console.error(snapshot)
            throw new Error('snapshot should only have inserts')
        }

        length += getLength(operation)
    }

    return length
}

const appendFromIterator = (newSnapshot, snapshotIterator) => count => {
    while (count > 0) {
        const operation = snapshotIterator.operation
        const offset = snapshotIterator.offset
        const length = Math.min(snapshotIterator.remaining, count)

        append(newSnapshot, slice(operation, offset, length))
        snapshotIterator.next(length)
        count -= length
    }
}

const generateRandomOperation = snapshot => {
    let remaining = getSnapshotLength(snapshot)
    const snapshotIterator = new Iterator(snapshot)
    const base = 2 + Math.floor(remaining / 100)
    const delta = []
    const newSnapshot = []
    const addToDelta = operation => append(delta, operation)
    const addToSnapshot = operation => append(newSnapshot, operation)
    const addToDeltaAndSnapshot = operation => {
        addToDelta(operation)
        addToSnapshot(operation)
    }
    const keepInSnapshot = appendFromIterator(newSnapshot, snapshotIterator)

    do {
        const modificationIndex = fuzzer.randomInt(Math.min(remaining, 5) + 1)
        remaining -= modificationIndex
        const modificationLength = Math.min(remaining, fuzzer.randomInt(4) + 1)

        addToDelta(createRetain(modificationIndex))
        keepInSnapshot(modificationIndex)

        switch (fuzzer.randomInt(base)) {
            case 0: // insert plain text
                addToDeltaAndSnapshot(randomInsertText())
                break
            default:
                addToDelta(createDelete(modificationLength))
                snapshotIterator.next(modificationLength)
                remaining -= modificationLength
        }

    } while (remaining > 0 && fuzzer.randomInt(2) > 0)

    keepInSnapshot(remaining)

    return [ delta, newSnapshot ]
}

tap.test('fuzzer', t => {
    fuzzer(type, generateRandomOperation, 100)
    t.end()
})
