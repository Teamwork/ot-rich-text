const Iterator = require('./Iterator')
const {
    isInsert, isInsertText, isRetain, isDelete,
    getLength,
    merge, composeIterators, transformIterators
 } = require('./Operation')

function create(snapshot) {
    return Array.isArray(snapshot) ? snapshot : []
}

// Compose op1 and op2 to produce a new operation.
// The new operation must subsume the behaviour of op1 and op2.
// Specifically, apply(apply(snapshot, op1), op2) == apply(snapshot, compose(op1, op2)).
// Note: transforming by a composed operation is NOT guaranteed to produce the same result as transforming by each operation in order.
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

// Transform op1 by op2. Return the new op1.
// Side is either 'left' or 'right'. It exists to break ties,
// for example if two operations insert at the same position in a string.
// If side === 'left', operation1 is considered to happen "first".
// Both op1 and op2 must not be modified by transform.
// Transform must conform to Transform Property 1. That is,
// apply(apply(snapshot, op1), transform(op2, op1, 'left')) == apply(apply(snapshot, op2), transform(op1, op2, 'right')).
function transform(operation1, operation2, side) {
    const operation1First = side === 'left'
    const iterator1 = new Iterator(operations1)
    const iterator2 = new Iterator(operations2)
    const newOperations = []
    let newOperation = transformIterators(iterator1, iterator2, operation1First)

    while (newOperation != null) {
        append(newOperations, newOperation)
        newOperation = transformIterators(iterator1, iterator2, operation1First)
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
    append,
    transform
}
