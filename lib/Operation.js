const fastDiff = require('fast-diff')
const Iterator = require('./Iterator')
const Operation = require('./Action')
const {
    createRetain,
    isInsert, isInsertText, isRetain, isDelete,
    getLength, hasAttributes, getText, getNodeId, areOperationsEqual,
    merge, composeIterators, transformIterators, diffIterators
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

    while (newOperation !== null) {
        append(newOperations, newOperation)
        newOperation = composeIterators(iterator1, iterator2)
    }

    return chop(newOperations)
}

// Apply an operation to a document snapshot to produce a new snapshot.
function apply(operations1, operations2) {
    const iterator1 = new Iterator(operations1)
    const iterator2 = new Iterator(operations2)
    const newOperations = []
    let newOperation = composeIterators(iterator1, iterator2)

    while (newOperation !== null && isInsert(newOperation)) {
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
    const operation1HasPriority = side === 'left'
    const iterator1 = new Iterator(operation1)
    const iterator2 = new Iterator(operation2)
    const newOperations = []
    let newOperation = transformIterators(iterator1, iterator2, operation1HasPriority)

    while (newOperation !== null) {
        append(newOperations, newOperation)
        newOperation = transformIterators(iterator1, iterator2, operation1HasPriority)
    }

    return chop(newOperations)
}

// Transform the specified cursor position by the provided delta.
// If isOwnDelta is true, this function returns the final editing position of the provided delta.
// If isOwnDelta is false, the cursor position moves with the content to its immediate left.
function transformCursor(cursor, delta, isOwnDelta) {
    isOwnDelta = !!isOwnDelta
    const iterator = new Iterator(delta)
    let offset = 0
    let action = iterator.action

    while (action !== null && offset <= cursor) {
        const length = getLength(action)

        if (isDelete(action)) {
            if (length < cursor - offset) {
                cursor -= length
            } else {
                cursor = offset
            }

        } else if (isInsert(action) && (offset < cursor || isOwnDelta)) {
            cursor += length
            offset += length

        } else {
            offset += length
        }

        iterator.next(length)
        action = iterator.action
    }

    return cursor
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
        operations[operationsLength] = newOperation
    } else {
        const lastIndex = operationsLength - 1
        const lastOperation = operations[lastIndex]

        // It doesn't matter, if we insert or delete first at the same index,
        // so we consistently insert first,
        // so that we have more opportunities for merging operations.
        if (isDelete(lastOperation) && isInsert(newOperation)) {
            if (operationsLength === 1) {
                operations[0] = newOperation
                operations[operationsLength] = lastOperation
            } else {
                const lastButOneIndex = lastIndex - 1
                const lastButOneOperation = operations[lastButOneIndex]

                const mergedOperation = merge(lastButOneOperation, newOperation)

                if (mergedOperation !== null) {
                    operations[lastButOneIndex] = mergedOperation
                } else {
                    operations[lastIndex] = newOperation
                    operations[operationsLength] = lastOperation
                }
            }
        } else {
            const mergedOperation = merge(lastOperation, newOperation)

            if (mergedOperation !== null) {
                operations[lastIndex] = mergedOperation
            } else {
                operations[operationsLength] = newOperation
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

// Returns a 2 element array, where each element is a list of operations representing
// a difference between `delta1` and `delta2`.
// The first list of operations converts `delta2` to `delta1`, when applied.
// The second list of operations converts `delta1` to `delta2`, when applied.
function diffX(delta1, delta2) {
    const result1 = []
    const result2 = []

    if (delta1 === delta2) {
        return [ result1, result2 ]
    }

    let startIndex1 = 0
    let startIndex2 = 0
    let endIndex1 = delta1.length - 1
    let endIndex2 = delta2.length - 1
    let commonPrefixLength = 0
    let differingContent1 = ''
    let differingContent2 = ''

    // calculate common prefix length
    while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
        const operation1 = delta1[startIndex1]

        if (!isInsert(operation1)) {
            throw new Error('not an "insert" operation')
        }

        if (!areOperationsEqual(operation1, delta2[startIndex2])) {
            break
        }

        ++startIndex1
        ++startIndex2
        commonPrefixLength += getLength(operation1)
    }

    // skip common suffix
    while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
        const operation1 = delta1[endIndex1]

        if (!isInsert(operation1)) {
            throw new Error('not an "insert" operation')
        }

        if (!areOperationsEqual(operation1, delta2[endIndex2])) {
            break
        }

        --endIndex1
        --endIndex2
    }

    // create iterators and set them to the first differing operations
    const iterator1 = new Iterator(delta1)
    iterator1.offset = 0
    iterator1.index = startIndex1
    iterator1.next(0)

    const iterator2 = new Iterator(delta2)
    iterator2.offset = 0
    iterator2.index = startIndex2
    iterator2.next(0)

    // calculate differingContent1
    while (startIndex1 <= endIndex1) {
        const operation1 = delta1[startIndex1++]

        if (!isInsert(operation1)) {
            throw new Error('not an "insert" operation')
        }

        differingContent1 += isInsertText(operation1) ? getText(operation1) : getNodeId(operation1)
    }

    // calculate differingContent2
    while (startIndex2 <= endIndex2) {
        const operation2 = delta2[startIndex2++]

        if (!isInsert(operation2)) {
            throw new Error('not an "insert" operation')
        }

        differingContent2 += isInsertText(operation2) ? getText(operation2) : getNodeId(operation2)
    }

    const stringDiff = fastDiff(differingContent1, differingContent2)
    const append1 = operation => append(result1, operation)
    const append2 = operation => append(result2, operation)

    if (commonPrefixLength > 0) {
        const retain = createRetain(commonPrefixLength)
        append1(retain)
        append2(retain)
    }

    for (let i = 0, l = stringDiff.length; i < l; ++i) {
        const diffItem = stringDiff[i]

        diffIterators(iterator1, iterator2, diffItem[0], diffItem[1], append1, append2)
    }

    return [ chop(result1), chop(result2) ]
}

module.exports = {
    create,
    compose,
    apply,
    transform,
    transformCursor,
    append,
    chop,
    validate,
    normalize,
    diffX
}
