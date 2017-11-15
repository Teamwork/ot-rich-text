const tap = require('tap')
const fuzzer = require('ot-fuzzer')
const type = require('../lib/type')
const Iterator = require('../lib/Iterator')
const { append } = require('../lib/Delta')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, getLength, getAttributesIndex,
    slice, copyOperation
} = require('../lib/Operation')

const randomItemFactory = list => () => list[fuzzer.randomInt(list.length)]

const randomWord = () => fuzzer.randomWord()
const randomVersion = () => fuzzer.randomInt(3)
const randomUser = randomItemFactory([ '', 'Mary', 'John' ])
const randomBlockNodeName = randomItemFactory([ '', 'BLOCKQUOTE', 'DIV', 'P' ])
const randomEmbedNodeName = randomItemFactory([ '', 'BR', 'IMG', 'HR' ])
const randomAttributeName = randomItemFactory([ '', 'style[color]', 'href', 'title', 'BOLD' ])
const randomAttributeValue = randomItemFactory([ '', 'red', 'http://www.example.com', 'This is a link', 'TRUE' ])
const randomAttributes = (allowNull) => {
    allowNull = !!allowNull
    const count = fuzzer.randomInt(3) + 1
    const attributeNames = new Array(count)

    for (let i = 0; i < count;) {
        const attributeName = randomAttributeName()

        if (attributeNames.indexOf(attributeName) < 0) {
            attributeNames[i++] = attributeName
        }
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
const randomInsertOpen = () => createInsertOpen(randomBlockNodeName(), randomVersion(), randomUser(), randomAttributes())
const randomInsertClose = () => createInsertClose(randomBlockNodeName(), randomVersion(), randomUser(), randomAttributes())
const randomInsertEmbed = () => createInsertEmbed(randomEmbedNodeName(), randomVersion(), randomUser(), randomAttributes())

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

const appendFromIterator = (snapshot, iterator) => (count, attributes) => {
    while (count > 0) {
        const { operation, offset } = iterator
        const operationLength = getLength(operation)
        const remaining = operationLength - offset
        const length = Math.min(remaining, count)
        let newOperation = slice(operation, offset, length, operationLength)

        if (attributes && attributes.length > 0) {
            // copy the operation without attributes
            newOperation = copyOperation(newOperation, true)

            let i1 = getAttributesIndex(operation) // `operation` attributes index
            let i2 = 0 // `attributes` index
            let i3 = newOperation.length // `newOperation` attributes index
            const l1 = operation.length
            const l2 = attributes.length

            while (i1 < l1 || i2 < l2) {
                if (i1 >= l1) {
                    if (attributes[i2 + 1] != null) {
                        newOperation[i3++] = attributes[i2++]
                        newOperation[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }

                } else if (i2 >= l2) {
                    newOperation[i3++] = operation[i1++]
                    newOperation[i3++] = operation[i1++]

                } else if (operation[i1] === attributes[i2]) {
                    if (attributes[i2 + 1] != null) {
                        newOperation[i3++] = attributes[i2++]
                        newOperation[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }
                    i1 += 2

                } else if (operation[i1] < attributes[i2]) {
                    newOperation[i3++] = operation[i1++]
                    newOperation[i3++] = operation[i1++]

                } else {
                    if (attributes[i2 + 1] != null) {
                        newOperation[i3++] = attributes[i2++]
                        newOperation[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }
                }
            }
        }

        append(snapshot, newOperation)
        iterator.next(length)
        count -= length
    }
}

const generateRandomOperation = snapshot => {
    const length = getSnapshotLength(snapshot)
    const snapshotIterator = new Iterator(snapshot)
    const delta = []
    const newSnapshot = []
    const addToDelta = operation => append(delta, operation)
    const addToSnapshot = operation => append(newSnapshot, operation)
    const addToDeltaAndSnapshot = operation => {
        addToDelta(operation)
        addToSnapshot(operation)
    }
    const keepInSnapshot = appendFromIterator(newSnapshot, snapshotIterator)
    let remaining = length

    do {
        const offset = fuzzer.randomInt(Math.min(remaining, 5) + 1)

        addToDelta(createRetain(offset))
        keepInSnapshot(offset)
        remaining -= offset

        switch (fuzzer.randomInt(7 + Math.floor(length / 100))) {
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

            case 4: // retain
            case 5:
                const retainCount = Math.min(remaining, fuzzer.randomInt(4) + 1)
                const attributes = randomAttributes(true)

                addToDelta(createRetain(retainCount, attributes))
                keepInSnapshot(retainCount, attributes)
                remaining -= retainCount
                break

            default: // delete
                const deleteCount = Math.min(remaining, fuzzer.randomInt(4) + 1)

                addToDelta(createDelete(deleteCount))
                snapshotIterator.next(deleteCount)
                remaining -= deleteCount
                break
        }

    } while (remaining > 0 && fuzzer.randomReal() < 0.95)

    keepInSnapshot(remaining)

    return [ delta, newSnapshot ]
}

tap.test('fuzzer', t => {
    fuzzer(type, generateRandomOperation, 100)
    t.end()
})
