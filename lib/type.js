const Iterator = require('./Iterator')
const {
    setContent, getContent,
    isInsert, isInsertText, isRetain, isDelete,
    areEqual, getLength,
 } = require('./Operation')

const MAX_INT = ((1 << 31) - 1) | 0

function create(snapshot) {
    return Array.isArray(snapshot) ? snapshot : []
}

function compose(operations1, operations2) {
    const iterator1 = new Iterator(operations1)
    const iterator2 = new Iterator(operations2)
    const newOperations = []
    let operation1 = iterator1.operation
    let operation2 = iterator2.operation

    while (operation1 || operation2) {
        if (operation2 && isInsert(operation2)) {
            append(newOperations, operation2, iterator2.offset)
            iterator2.next(iterator2.remaining)
            operation2 = iterator2.operation
        }
    }

    return newOperations
}

// Appends `operation`, skipping the first `offset` characters, to `operations`.
function append(operations, operation, offset = 0, count = MAX_INT) {
    const length = getLength(operation)
    offset = Math.max(offset, 0) | 0
    offset = Math.min(offset, length) | 0

    const remaining = length - offset
    count = Math.max(count, 0) | 0
    count = Math.min(count, remaining) | 0

    if (count === 0) {
        // invalid operations have length 0, so they end up here too
        return operations
    }

    const operationsLength = operations.length

    if (operationsLength === 0) {
        if (offset === 0 && count === length) {
            // insert open/close/embed operations have length 1, so if they passed
            // the count === 0 test above, then they must end up here.
            operations.push(operation)
        } else if (isInsertText(operation)) {
            operations.push(setContent(operation.slice(0), getContent(operation).substr(offset, count)))
        } else {
            // must be retain or delete
            operations.push(setContent(operation.slice(0), count))
        }
    } else {
        const lastOperation = operations[operationsLength - 1]

        if (areEqual(operation, lastOperation)) {
            // TODO
        } else {
            operations.push(operation)
        }
    }

    return operations
}

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    compose,
    apply: compose,

    append
}
