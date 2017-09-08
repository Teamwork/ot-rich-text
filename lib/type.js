const Iterator = require('./Iterator')
const {
    setContent, getContent,
    isInsert, isInsertText, isRetain, isDelete,
    getLength,
    merge
 } = require('./Operation')

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

// Appends `operation` to `operations`.
function append(operations, operation) {
    const length = getLength(operation)

    if (length === 0) {
        // takes care of invalid and empty operations
        return operations
    }

    const operationsLength = operations.length

    if (operationsLength === 0) {
        operations.push(operation)
    } else {
        const lastIndex = operationsLength - 1
        const lastOperation = operations[lastIndex]
        const mergedOperation = merge(lastOperation, operation)

        if (mergedOperation != null) {
            operations[lastIndex] = mergedOperation
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
