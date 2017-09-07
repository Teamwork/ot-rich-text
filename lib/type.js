const Iterator = require('./Iterator')
const { isInsert, areEqual } = require('./Operation')

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
function append(operations, operation, offset) {
    const operationsLength = operations.length

    if (operationsLength === 0) {
        if (offset === 0) {
            operations.push(operation)
        } else {
            // TODO
        }
    } else {
        const lastOperation = operations[operationsLength - 1]

        if (areEqual(operation, lastOperation)) {
            // TODO
        } else {
            operations.push(operation)
        }
    }
}

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    compose,
    apply: compose
}
