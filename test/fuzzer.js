const assert = require('chai').assert
const fuzzer = require('ot-fuzzer')
const type = require('../lib/type')
const Iterator = require('../lib/Iterator')
const { append } = require('../lib/Operation')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete,
    isInsert, getLength, getAttributesIndex,
    slice, clone
} = require('../lib/Action')

const randomItemFactory = list => () => list[fuzzer.randomInt(list.length)]

const randomWord = () => fuzzer.randomWord()
const randomNodeId = () => String.fromCharCode(0xE000, fuzzer.randomInt(6400))
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
const randomInsertText = () => createInsertText(randomWord(), randomAttributes())
const randomInsertOpen = () => createInsertOpen(randomNodeId() + randomBlockNodeName(), randomAttributes())
const randomInsertClose = () => createInsertClose(randomNodeId() + randomBlockNodeName(), randomAttributes())
const randomInsertEmbed = () => createInsertEmbed(randomNodeId() + randomEmbedNodeName(), randomAttributes())

const getSnapshotLength = snapshot => {
    let length = 0

    for (let i = 0, l = snapshot.length; i < l; ++i) {
        const action = snapshot[i]

        if (!isInsert(action)) {
            console.error(snapshot)
            throw new Error('snapshot should only have inserts')
        }

        length += getLength(action)
    }

    return length
}

const appendFromIterator = (snapshot, iterator) => (count, attributes) => {
    while (count > 0) {
        const { action, offset } = iterator
        const actionLength = getLength(action)
        const remaining = actionLength - offset
        const length = Math.min(remaining, count)
        let newAction = slice(action, offset, length, actionLength)

        if (attributes && attributes.length > 0) {
            // copy the action without attributes
            newAction = clone(newAction, true)

            let i1 = getAttributesIndex(action) // `action` attributes index
            let i2 = 0 // `attributes` index
            let i3 = newAction.length // `newAction` attributes index
            const l1 = action.length
            const l2 = attributes.length

            while (i1 < l1 || i2 < l2) {
                if (i1 >= l1) {
                    if (attributes[i2 + 1] != null) {
                        newAction[i3++] = attributes[i2++]
                        newAction[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }

                } else if (i2 >= l2) {
                    newAction[i3++] = action[i1++]
                    newAction[i3++] = action[i1++]

                } else if (action[i1] === attributes[i2]) {
                    if (attributes[i2 + 1] != null) {
                        newAction[i3++] = attributes[i2++]
                        newAction[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }
                    i1 += 2

                } else if (action[i1] < attributes[i2]) {
                    newAction[i3++] = action[i1++]
                    newAction[i3++] = action[i1++]

                } else {
                    if (attributes[i2 + 1] != null) {
                        newAction[i3++] = attributes[i2++]
                        newAction[i3++] = attributes[i2++]
                    } else {
                        i2 += 2
                    }
                }
            }
        }

        append(snapshot, newAction)
        iterator.next(length)
        count -= length
    }
}

const generateRandomOperation = snapshot => {
    const length = getSnapshotLength(snapshot)
    const snapshotIterator = new Iterator(snapshot)
    const operation = []
    const newSnapshot = []
    const addToOperation = action => append(operation, action)
    const addToSnapshot = action => append(newSnapshot, action)
    const addToOperationAndSnapshot = action => {
        addToOperation(action)
        addToSnapshot(action)
    }
    const keepInSnapshot = appendFromIterator(newSnapshot, snapshotIterator)
    let remaining = length

    do {
        const offset = fuzzer.randomInt(Math.min(remaining, 5) + 1)

        addToOperation(createRetain(offset))
        keepInSnapshot(offset)
        remaining -= offset

        switch (fuzzer.randomInt(7 + Math.floor(length / 100))) {
            case 0: // insert text
                addToOperationAndSnapshot(randomInsertText())
                break

            case 1: // insert open
                addToOperationAndSnapshot(randomInsertOpen())
                break

            case 2: // insert close
                addToOperationAndSnapshot(randomInsertClose())
                break

            case 3: // insert embed
                addToOperationAndSnapshot(randomInsertEmbed())
                break

            case 4: // retain
            case 5:
                const retainCount = Math.min(remaining, fuzzer.randomInt(4) + 1)
                const attributes = randomAttributes(true)

                addToOperation(createRetain(retainCount, attributes))
                keepInSnapshot(retainCount, attributes)
                remaining -= retainCount
                break

            default: // delete
                const deleteCount = Math.min(remaining, fuzzer.randomInt(4) + 1)

                addToOperation(createDelete(deleteCount))
                snapshotIterator.next(deleteCount)
                remaining -= deleteCount
                break
        }

    } while (remaining > 0 && fuzzer.randomReal() < 0.95)

    keepInSnapshot(remaining)

    return [ operation, newSnapshot ]
}

describe('fuzzer', function () {
    it('passes fuzz tests', function () {
        this.timeout(0)
        fuzzer(type, generateRandomOperation, 100)
    })
})
