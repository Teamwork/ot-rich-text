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

const randomItemFactory = list => () => list[fuzzer.randomInt(list.length)]

const randomWord = () => fuzzer.randomWord()
const randomNodeContent = () =>
    // a completely random character
    fuzzer.randomReal() < 0.5 ? String.fromCharCode(fuzzer.randomInt(0x10000)) :
    // a character in Unicode Private Use Area - a valid character we expect
    fuzzer.randomReal() < 0.5 ? String.fromCharCode(0xE000 + fuzzer.randomInt(6400)) :
    // a character which will likely conflict with text while performing diff
    fuzzer.randomReal() < 0.5 ? String.fromCharCode(48 + fuzzer.randomInt(80)) :
    // completely invalid content - not 1 character
    randomWord()
const randomVersion = () => fuzzer.randomInt(3)
const randomUser = randomItemFactory([ '', 'Mary', 'John' ])
const randomBlockNodeName = randomItemFactory([ '', 'BLOCKQUOTE', 'DIV', 'P' ])
const randomEmbedNodeName = randomItemFactory([ '', 'BR', 'IMG', 'HR' ])
const randomAttributeName = randomItemFactory([ '', 'style[color]', 'href', 'title', 'BOLD' ])
const randomAttributeValue = randomItemFactory([ '', 'red', 'http://www.example.com', 'This is a link', 'TRUE' ])
const randomAttributes = (allowNull) => {
    allowNull = !!allowNull
    const count = fuzzer.randomInt(5)
    const attributeNames = new Array(count)

    for (let i = 0; i < count; ++i) {
        attributeNames[i] = randomAttributeName()
    }

    attributeNames.sort()

    const attributes = new Array(count * 2)

    for (let i = 0; i < count; ++i) {
        attributes[i << 1] = attributeNames[i]
        attributes[(i << 1) + 1] = allowNull && fuzzer.randomReal() < 0.2 ? null : randomAttributeValue()
    }

    return attributes
}
const randomInsertText = () => createInsertText(randomWord(), randomVersion(), randomUser(), randomAttributes())
const randomInsertOpen = () => createInsertOpen(randomNodeContent(), randomVersion(), randomUser(), randomBlockNodeName(), randomAttributes())
const randomInsertClose = () => createInsertClose(randomNodeContent(), randomVersion(), randomUser(), randomBlockNodeName(), randomAttributes())
const randomInsertEmbed = () => createInsertEmbed(randomNodeContent(), randomVersion(), randomUser(), randomEmbedNodeName(), randomAttributes())

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
    const base = 6 + Math.floor(remaining / 100)
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
            case 0: // insert text
                addToDeltaAndSnapshot(randomInsertText())
                break
            case 1: // insert open
                addToDeltaAndSnapshot(randomInsertOpen())
                break
            case 2: // insert close
                addToDeltaAndSnapshot(randomInsertClose())
                break
            case 3: // insert embed
                addToDeltaAndSnapshot(randomInsertEmbed())
                break
            default: // delete
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
