const Iterator = require('./Iterator')
const {
    isInsert, isInsertText, isRetain, isDelete,
    getLength,
    merge, composeIterators
 } = require('./Operation')

function create(snapshot) {
    return Array.isArray(snapshot) ? snapshot : []
}

function compose(operations1, operations2) {
    const iterator1 = new Iterator(operations1)
    const iterator2 = new Iterator(operations2)
    const newOperations = []
    let newOperation = composeIterators(iterator1, iterator2)

    while (newOperation != null) {
        append(newOperations, newOperation)
        newOperation = composeIterators(iterator1, iterator2)
    }

    return newOperations
}

// Appends `newOperation` to `operations`.
function append(operations, newOperation) {
    const length = getLength(newOperation)

    if (length === 0) {
        // takes care of invalid and empty operations
        return operations
    }

    const operationsLength = operations.length

    if (operationsLength === 0) {
        operations.push(newOperation)
    } else {
        const lastIndex = operationsLength - 1
        const lastOperation = operations[lastIndex]

        // It doesn't matter, if we insert or delete first at the same index,
        // so we consistently insert first,
        // so that we have more opportunities for merging operations.
        if (isDelete(lastOperation) && isInsert(newOperation)) {
            if (operationsLength === 1) {
                operations[0] = newOperation
                operations.push(lastOperation)
            } else {
                const lastButOneIndex = lastIndex - 1
                const lastButOneOperation = operations[lastButOneIndex]

                const mergedOperation = merge(lastButOneOperation, newOperation)

                if (mergedOperation != null) {
                    operations[lastButOneIndex] = mergedOperation
                } else {
                    operations[lastIndex] = newOperation
                    operations.push(lastOperation)
                }
            }
        } else {
            const mergedOperation = merge(lastOperation, newOperation)

            if (mergedOperation != null) {
                operations[lastIndex] = mergedOperation
            } else {
                operations.push(newOperation)
            }
        }
    }

    return operations
}

module.exports = {
    create,
    compose,
    append
}
