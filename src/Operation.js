
const fastDiff = require('fast-diff')
const Iterator = require('./Iterator')
const {
    createRetain,
    isInsert, isInsertText, isRetain, isDelete,
    getLength, hasAttributes, getText, getNodeId, areEqual, areTypesEqual,
    merge, composeIterators, transformIterators, diffIterators,
    validate: validateAction
} = require('./Action')

function create(actions) {
    return Array.isArray(actions) ? actions : []
}

function isNoop(operation) {
    return operation.length === 0
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

// Composes 2 operations but only if the "shape" of the new operation is the
// same as the "shape" of operation1.
function composeSimilar(operation1, operation2) {
    const newOperation = compose(operation1, operation2)
    let index = 0
    const length = operation1.length
    let newIndex = 0
    const newLength = newOperation.length

    // Skip leading "retain" actions
    while (index < length && isRetain(operation1[index])) {
        ++index
    }

    while (newIndex < newLength && isRetain(newOperation[newIndex])) {
        ++newIndex
    }

    // Operations are not similar, if they have a different number of actions
    // following the leading retain actions.
    if (length - index !== newLength - newIndex) {
        return null
    }

    // Operations are not similar, if they have differnt action types
    // following the leading retain actions.
    while (index < length) {
        if (!areTypesEqual(operation1[index++], newOperation[newIndex++])) {
            return null
        }
    }

    return newOperation
}

// Apply an operation to a snapshot to produce a new snapshot.
function apply(snapshot, operation) {
    const iterator1 = new Iterator(snapshot)
    const iterator2 = new Iterator(operation)
    const newSnapshot = []
    let action = composeIterators(iterator1, iterator2)

    while (action !== null && isInsert(action)) {
        append(newSnapshot, action)
        action = composeIterators(iterator1, iterator2)
    }

    return newSnapshot
}

// Apply an operation to a snapshot to produce a new snapshot and
// an inverted operation.
function applyAndInvert(snapshot, operation) {
    const editingPosition = !isNoop(operation) && isRetain(operation[0]) ?
            getLength(operation[0]) : 0
    const newSnapshot = apply(snapshot, operation)
    const diffs = diffX(snapshot, newSnapshot, {
        oldRange: { index: editingPosition, length: 0 },
        newRange: { index: editingPosition, length: 0 }
    })
    const invertedOperation = diffs[0]

    return [ newSnapshot, invertedOperation ]
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
// `editLocation` is optional and provides a hint to the diffing algorithm,
// so that it can return the expected diff out of the set of valid diffs.
// The first operation converts `snapshot2` to `snapshot1`, when applied.
// The second operation converts `snapshot1` to `snapshot2`, when applied.
function diffX(snapshot1, snapshot2, editLocation) {
    let oldRange = null
    let newRange = null

    if (typeof editLocation === 'number') {
        oldRange = { index: editLocation | 0, length: 0 }
        editLocation = { oldRange, newRange }
    } else if (
        editLocation &&
        (oldRange = editLocation.oldRange || null)
    ) {
        oldRange = { index: oldRange.index | 0, length: oldRange.length | 0 }
        if (
            (newRange = editLocation.newRange || null)
        ) {
            newRange = { index: newRange.index | 0, length: newRange.length | 0 }
        }
        editLocation = { oldRange, newRange }
    } else {
        editLocation = null
    }

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

        commonPrefixLength += getLength(action1)
        ++startIndex1
        ++startIndex2
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

    if (oldRange) {
        if (commonPrefixLength > 0) {
            oldRange.index -= commonPrefixLength
        }
        if (oldRange.index < 0) {
            oldRange.length += oldRange.index
            oldRange.index = 0
        }
        if (oldRange.length < 0) {
            oldRange.length = 0
        }
        if (oldRange.index > differingContent1.length) {
            oldRange.index = differingContent1.length
        }
        if (oldRange.index + oldRange.length > differingContent1.length) {
            oldRange.length = differingContent1.length - oldRange.index
        }
    }

    if (newRange) {
        if (commonPrefixLength > 0) {
            newRange.index -= commonPrefixLength
        }
        if (newRange.index < 0) {
            newRange.length += newRange.index
            newRange.index = 0
        }
        if (newRange.length < 0) {
            newRange.length = 0
        }
        if (newRange.index > differingContent2.length) {
            newRange.index = differingContent2.length
        }
        if (newRange.index + newRange.length > differingContent2.length) {
            newRange.length = differingContent2.length - newRange.index
        }
    }

    const stringDiff = fastDiff(differingContent1, differingContent2, editLocation)
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
    return isValidPresence(presence) ? presence : { u: '', c: 0, s: [] }
}

function transformPresence(presence, operation, isOwnOperation) {
    const user = presence.u
    const change = presence.c
    const selections = presence.s
    const newSelections = new Array(selections.length)

    for (let i = 0, l = selections.length; i < l; ++i) {
        const selection = selections[i]
        const newStart = transformCursor(selection[0], operation, isOwnOperation)
        const newEnd = selection[0] === selection[1] ? newStart :
            transformCursor(selection[1], operation, isOwnOperation)
        newSelections[i] = [ newStart, newEnd ]
    }

    return {
        u: user,
        c: change,
        s: newSelections
    }
}

function comparePresence(presence1, presence2) {
    if (presence1 === presence2) {
        return true
    }

    if (
        presence1 == null ||
        presence2 == null ||
        presence1.u !== presence2.u ||
        presence1.c !== presence2.c ||
        presence1.s.length !== presence2.s.length
    ) {
        return false
    }

    for (let i = 0, l = presence1.s.length; i < l; ++i) {
        if (presence1.s[i][0] !== presence2.s[i][0] || presence1.s[i][1] !== presence2.s[i][1]) {
            return false
        }
    }

    return true
}

function isValidPresence(presence) {
    if (
        presence == null ||
        typeof presence.u !== 'string' ||
        typeof presence.c !== 'number' ||
        !isFinite(presence.c) ||
        Math.floor(presence.c) !== presence.c ||
        !Array.isArray(presence.s)
    ) {
        return false
    }

    const selections = presence.s

    for (let i = 0, l = selections.length; i < l; ++i) {
        const selection = selections[i]

        if (
            !Array.isArray(selection) ||
            selection.length !== 2 ||
            selection[0] !== (selection[0] | 0) ||
            selection[1] !== (selection[1] | 0)
        ) {
            return false
        }
    }

    return true
}

module.exports = {
    create,
    isNoop,
    compose,
    composeSimilar,
    apply,
    applyAndInvert,
    transform,
    transformCursor,
    append,
    chop,
    validate,
    normalize,
    diffX,
    createPresence,
    transformPresence,
    comparePresence,
    isValidPresence
}
