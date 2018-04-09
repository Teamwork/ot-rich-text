const fastDiff = require('fast-diff')
const Iterator = require('./Iterator')
const {
    createRetain,
    isInsert, isInsertText, isRetain, isDelete,
    getLength, hasAttributes, getText, getNodeId, areEqual,
    merge, composeIterators, transformIterators, diffIterators,
    validate: validateAction
} = require('./Action')

function create(actions) {
    return Array.isArray(actions) ? actions : []
}

// Compose op1 and op2 to produce a new operation.
// The new operation must subsume the behaviour of op1 and op2.
// Specifically, apply(apply(snapshot, op1), op2) == apply(snapshot, compose(op1, op2)).
// Note: transforming by a composed operation is NOT guaranteed to produce the same result as transforming by each operation in order.
function compose(operation1, operation2) {
    const iterator1 = new Iterator(operation1)
    const iterator2 = new Iterator(operation2)
    const newOperation = []
    let action = composeIterators(iterator1, iterator2)

    while (action !== null) {
        append(newOperation, action)
        action = composeIterators(iterator1, iterator2)
    }

    return chop(newOperation)
}

// Apply an operation to a snapshot to produce a new snapshot.
function apply(snapshot, operation) {
    const iterator1 = new Iterator(snapshot)
    const iterator2 = new Iterator(operation)
    const newOperation = []
    let action = composeIterators(iterator1, iterator2)

    while (action !== null && isInsert(action)) {
        append(newOperation, action)
        action = composeIterators(iterator1, iterator2)
    }

    return newOperation
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
    const newOperation = []
    let action = transformIterators(iterator1, iterator2, operation1HasPriority)

    while (action !== null) {
        append(newOperation, action)
        action = transformIterators(iterator1, iterator2, operation1HasPriority)
    }

    return chop(newOperation)
}

// Transform the specified cursor position by the provided operation.
// If isOwnOperation is true, this function returns the final editing position of the provided operation.
// If isOwnOperation is false, the cursor position moves with the content to its immediate left.
function transformCursor(cursor, operation, isOwnOperation) {
    cursor = cursor | 0
    isOwnOperation = !!isOwnOperation
    const iterator = new Iterator(operation)
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

        } else if (isInsert(action) && (offset < cursor || isOwnOperation)) {
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

// Appends `action` to `operation`.
function append(operation, action) {
    const length = getLength(action)

    if (length === 0) {
        // takes care of invalid and empty actions
        return operation
    }

    const operationLength = operation.length

    if (operationLength === 0) {
        operation[operationLength] = action
    } else {
        const lastIndex = operationLength - 1
        const lastAction = operation[lastIndex]

        // It doesn't matter, if we insert or delete first at the same index,
        // so we consistently insert first,
        // so that we have more opportunities for merging actions.
        if (isDelete(lastAction) && isInsert(action)) {
            if (operationLength === 1) {
                operation[0] = action
                operation[operationLength] = lastAction
            } else {
                const lastButOneIndex = lastIndex - 1
                const lastButOneAction = operation[lastButOneIndex]
                const mergedAction = merge(lastButOneAction, action)

                if (mergedAction !== null) {
                    operation[lastButOneIndex] = mergedAction
                } else {
                    operation[lastIndex] = action
                    operation[operationLength] = lastAction
                }
            }
        } else {
            const mergedAction = merge(lastAction, action)

            if (mergedAction !== null) {
                operation[lastIndex] = mergedAction
            } else {
                operation[operationLength] = action
            }
        }
    }

    return operation
}

// Remove trailing retain, if it does not have attributes.
function chop(operation) {
    const operationLength = operation.length

    if (operationLength > 0) {
        const lastIndex = operationLength - 1
        const action = operation[lastIndex]

        if (isRetain(action) && !hasAttributes(action)) {
            operation.length = lastIndex
        }
    }

    return operation
}

// Returns null, if the `operation` is valid. Otherwise returns an error.
function validate(operation) {
    if (!Array.isArray(operation)) {
        return new Error('operation must be an array')
    }

    for (let i = 0, l = operation.length; i < l; ++i) {
        const error = validateAction(operation[i])

        if (error !== null) {
            return new Error(`Invalid action at index ${i}: ${error.message}`)
        }
    }

    return null
}

// The operations this library produces are already normalized, so no modifications
// are needed, however, we do take the opportunity to check that the operation is valid
// and throw an Error, if it isn't.
function normalize(operation) {
    const error = validate(operation)

    if (error !== null) {
        throw error
    }

    return operation
}

// Returns a 2 element array, where each element is an operation representing
// a difference between `snapshot1` and `snapshot2`.
// The first operation converts `snapshot2` to `snapshot1`, when applied.
// The second operation converts `snapshot1` to `snapshot2`, when applied.
function diffX(snapshot1, snapshot2) {
    const result1 = []
    const result2 = []

    if (snapshot1 === snapshot2) {
        return [ result1, result2 ]
    }

    let startIndex1 = 0
    let startIndex2 = 0
    let endIndex1 = snapshot1.length - 1
    let endIndex2 = snapshot2.length - 1
    let commonPrefixLength = 0
    let differingContent1 = ''
    let differingContent2 = ''

    // calculate common prefix length
    while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
        const action1 = snapshot1[startIndex1]

        if (!isInsert(action1)) {
            throw new Error('not an "insert" operation')
        }

        if (!areEqual(action1, snapshot2[startIndex2])) {
            break
        }

        ++startIndex1
        ++startIndex2
        commonPrefixLength += getLength(action1)
    }

    // skip common suffix
    while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
        const action1 = snapshot1[endIndex1]

        if (!isInsert(action1)) {
            throw new Error('not an "insert" operation')
        }

        if (!areEqual(action1, snapshot2[endIndex2])) {
            break
        }

        --endIndex1
        --endIndex2
    }

    // create iterators and set them to the first differing operations
    const iterator1 = new Iterator(snapshot1)
    iterator1.offset = 0
    iterator1.index = startIndex1
    iterator1.next(0)

    const iterator2 = new Iterator(snapshot2)
    iterator2.offset = 0
    iterator2.index = startIndex2
    iterator2.next(0)

    // calculate differingContent1
    while (startIndex1 <= endIndex1) {
        const action = snapshot1[startIndex1++]

        if (!isInsert(action)) {
            throw new Error('not an "insert" action')
        }

        differingContent1 += isInsertText(action) ? getText(action) : getNodeId(action)
    }

    // calculate differingContent2
    while (startIndex2 <= endIndex2) {
        const action = snapshot2[startIndex2++]

        if (!isInsert(action)) {
            throw new Error('not an "insert" action')
        }

        differingContent2 += isInsertText(action) ? getText(action) : getNodeId(action)
    }

    const stringDiff = fastDiff(differingContent1, differingContent2)
    const append1 = action => append(result1, action)
    const append2 = action => append(result2, action)

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

function createPresence(presence) {
    return presence ? {
        u: '' + presence.u,
        s: presence.s | 0,
        e: presence.e | 0
    } : {
        u: '', // [u]ser Id
        s: 0, // selection [s]tart
        e: 0 // selection [e]nd
    }
}

function transformPresence(presence, operation, isOwnOperation) {
    return {
        u: presence.u,
        s: transformCursor(presence.s, operation, isOwnOperation),
        e: transformCursor(presence.e, operation, isOwnOperation)
    }
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
    diffX,
    createPresence,
    transformPresence
}
