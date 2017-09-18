const Iterator = require('./Iterator')
const Operation = require('./Operation')
const {
    isInsert, isInsertText, isRetain, isDelete,
    getLength, hasAttributes,
    merge, composeIterators, transformIterators
} = Operation
const validateOperation = Operation.validate

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

    return chop(newOperations)
}

// Transform op1 by op2. Return the new op1.
// Side is either 'left' or 'right'. It exists to break ties,
// for example if two operations insert at the same position in a string.
// If side === 'left', operation1 is considered to happen "first".
// Both op1 and op2 must not be modified by transform.
// Transform must conform to Transform Property 1. That is,
// apply(apply(snapshot, op1), transform(op2, op1, 'left')) == apply(apply(snapshot, op2), transform(op1, op2, 'right')).
function transform(operation1, operation2, side) {
    const operation1HasPriority = side === 'left'
    const iterator1 = new Iterator(operation1)
    const iterator2 = new Iterator(operation2)
    const newOperations = []
    let newOperation = transformIterators(iterator1, iterator2, operation1HasPriority)

    while (newOperation != null) {
        append(newOperations, newOperation)
        newOperation = transformIterators(iterator1, iterator2, operation1HasPriority)
    }

    return chop(newOperations)
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

// Remove trailing retain, if it does not have attributes.
function chop(operations) {
    const operationsLength = operations.length

    if (operationsLength > 0) {
        const lastIndex = operationsLength - 1
        const operation = operations[lastIndex]

        if (isRetain(operation) && !hasAttributes(operation)) {
            operations.length = lastIndex
        }
    }

    return operations
}

// Returns null, if the `delta` is valid. Otherwise returns an error.
function validate(delta) {
    if (!Array.isArray(delta)) {
        return new Error('delta must be an array')
    }

    const length = delta.length

    for (let i = 0; i < length; ++i) {
        const error = validateOperation(delta[i])

        if (error !== null) {
            return new Error(`Invalid operation at index ${i}: ${error.message}`)
        }
    }

    return null
}

// The deltas this library produces are already normalized, so no modifications
// are needed, however, we do take the opportunity to check that the delta is valid
// and throw an Error, if it isn't.
function normalize(delta) {
    const error = validate(delta)

    if (error !== null) {
        throw error
    }

    return delta
}

module.exports = {
    create,
    compose,
    transform,
    append,
    chop,
    validate,
    normalize
}
