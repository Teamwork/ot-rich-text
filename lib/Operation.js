// Each operation is represented by an array.
// The constants below determine what data can be found at each array index.
//
// The attributes are appended to the operation array.
// Each attribute occupies 2 indexes. The first is the attribute name and the second is the attribute value.
// The attributes must be sorted in the ascending order by the attribute name.
// Attribute names and values must both be strings, except for operations (as oposed to document snapshots),
// where the attibute value may be `null`, which is interpreted as an instruction to remove the attribute,
// when the operation is applied.

// number, ACTION_*
const ACTION = 0

// ACTION_INSERT_TEXT -> string, plain text
// ACTION_INSERT_(OPEN|CLOSE|EMBED) -> string, a tag name in upper case
// ACTION_(RETAIN|DELETE) -> number, number of characters to retain or delete
const CONTENT = 1

// ACTION_RETAIN
const RETAIN_ATTRIBUTES = 2

// ACTION_INSERT
const VERSION = 2
const AUTHOR = 3
const INSERT_ATTRIBUTES = 4

const ACTION_DELETE = -1
const ACTION_RETAIN = 0
const ACTION_INSERT_TEXT = 1
const ACTION_INSERT_OPEN = 2
const ACTION_INSERT_CLOSE = 3
const ACTION_INSERT_EMBED = 4

const copyOperation = (operation, skipAttributes) => {
    let limit = operation.length

    if (skipAttributes) {
        switch (operation[ACTION]) {
            case ACTION_INSERT_TEXT:
            case ACTION_INSERT_OPEN:
            case ACTION_INSERT_CLOSE:
            case ACTION_INSERT_EMBED:
                if (INSERT_ATTRIBUTES < limit) {
                    limit = INSERT_ATTRIBUTES
                }
                break
            case ACTION_RETAIN:
                if (RETAIN_ATTRIBUTES < limit) {
                    limit = RETAIN_ATTRIBUTES
                }
                break
        }
    }

    const newOperation = new Array(limit)

    for (let i = 0; i < limit; ++i) {
        newOperation[i] = operation[i]
    }

    return newOperation
}

const createInsert = action => (content, version, author, attributes) => {
    let operationIndex = 4
    let attributeIndex = 0
    const attributesLength = attributes ? attributes.length : 0
    const operation = new Array(operationIndex + attributesLength)

    operation[ACTION] = action
    operation[CONTENT] = content
    operation[VERSION] = version
    operation[AUTHOR] = author

    while (attributeIndex < attributesLength) {
        operation[operationIndex++] = attributes[attributeIndex++]
    }

    return operation
}

const createInsertText = createInsert(ACTION_INSERT_TEXT)
const createInsertOpen = createInsert(ACTION_INSERT_OPEN)
const createInsertClose = createInsert(ACTION_INSERT_CLOSE)
const createInsertEmbed = createInsert(ACTION_INSERT_EMBED)

const createRetain = (content, attributes) => {
    const attributesLength = attributes ? attributes.length : 0
    const operation = new Array(2 + attributesLength)
    operation[ACTION] = ACTION_RETAIN
    operation[CONTENT] = content

    let operationIndex = 2
    let attributeIndex = 0

    while (attributeIndex < attributesLength) {
        operation[operationIndex++] = attributes[attributeIndex++]
    }

    return operation
}

const createDelete = content => [ ACTION_DELETE, content ]

const validateLength = (operation, length) => {
    if (operation.length !== length) {
        return new Error(`operation.length must be ${length}`)
    }

    return null
}

const validateMinLength = (operation, minLength) => {
    if (operation.length < minLength) {
        return new Error(`operation.length must be at least ${minLength}`)
    }

    return null
}

const validateContentNumber = operation => {
    const content = operation[CONTENT]

    if (typeof content !== 'number' || content <= 0 || !isFinite(content) || Math.floor(content) !== content) {
        return new Error('content must be a positive integer')
    }

    return null
}

const validateContentText = operation => {
    const content = operation[CONTENT]

    if (typeof content !== 'string' || content === '') {
        return new Error('content must be a non-empty string')
    }

    return null
}

const validateVersion = operation => {
    const version = operation[VERSION]

    if (typeof version !== 'number' || version < 0 || !isFinite(version) || Math.floor(version) !== version) {
        return new Error('version must be a non-negative integer')
    }

    return null
}

const validateAuthor = operation => {
    const author = operation[AUTHOR]

    if (typeof author !== 'string') {
        return new Error('author must be a string')
    }

    return null
}

const validateAttributes = (operation, index, allowNull) => {
    const length = operation.length

    if ((length - index) & 1) {
        return new Error('missing value for the last attribute')
    }

    for (let i = index; i < length; i += 2) {
        const name = operation[i]
        const value = operation[i + 1]

        if (typeof name !== 'string') {
            return new Error('attribute name must be a string')
        }

        if (!(typeof value === 'string' || (allowNull && value === null))) {
            return new Error(`attribute value must be a string${ allowNull ? ' or null' : '' }`)
        }

        if (i > index && operation[i - 2] >= name) {
            return new Error('duplicate or not sorted attribute')
        }
    }

    return null
}

// Returns null, if the operation is valid. Otherwise returns an error.
const validate = operation => {
    if (!Array.isArray(operation)) {
        return new Error('operation must be an array')
    }

    switch (operation[ACTION]) {
        case ACTION_DELETE:
            return validateLength(operation, 2) ||
                validateContentNumber(operation)

        case ACTION_RETAIN:
            return validateMinLength(operation, 2) ||
                validateContentNumber(operation) ||
                validateAttributes(operation, 2, true)

        case ACTION_INSERT_TEXT:
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return validateMinLength(operation, 4) ||
                validateContentText(operation) ||
                validateVersion(operation) ||
                validateAuthor(operation) ||
                validateAttributes(operation, 4, false)

        default:
            return new Error('unknown operation type')
    }
}

const getContent = operation => operation[CONTENT]
const setContent = (operation, content) => { operation[CONTENT] = content; return operation }
const getAttributes = operation => {
    const operationLength = operation.length
    let operationIndex = getAttributesIndex(operation)

    const attributes = new Array(operationLength - operationIndex)
    let attributesIndex = 0

    while (operationIndex < operationLength) {
        attributes[attributesIndex++] = operation[operationIndex++]
        attributes[attributesIndex++] = operation[operationIndex++]
    }

    return attributes
}

const isDelete = operation => operation[ACTION] === ACTION_DELETE
const isRetain = operation => operation[ACTION] === ACTION_RETAIN
const isInsert = operation => ACTION_INSERT_TEXT <= operation[ACTION] && operation[ACTION] <= ACTION_INSERT_EMBED

const isInsertText = operation => operation[ACTION] === ACTION_INSERT_TEXT
const isInsertOpen = operation => operation[ACTION] === ACTION_INSERT_OPEN
const isInsertClose = operation => operation[ACTION] === ACTION_INSERT_CLOSE
const isInsertEmbed = operation => operation[ACTION] === ACTION_INSERT_EMBED

const getAttributesIndex = operation => {
    switch (operation[ACTION]) {
        case ACTION_INSERT_TEXT:
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return INSERT_ATTRIBUTES
        case ACTION_RETAIN:
            return RETAIN_ATTRIBUTES
        default:
            return operation.length
    }
}

const hasAttributes = operation =>
    operation.length > getAttributesIndex(operation)

const getLength = operation => {
    switch (operation[ACTION]) {
        case ACTION_INSERT_TEXT:
            return operation[CONTENT].length
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return 1
        default:
            return operation[CONTENT]
    }
}

const slice = (operation, offset, count, length) => {
    if (offset === 0 && count === length) {
        // takes care of insert open/close/embed
        return operation
    } else if (isInsertText(operation)) {
        // takes care of insert text
        return setContent(copyOperation(operation, false), getContent(operation).substr(offset, count))
    } else {
        // it must be retain or delete
        return setContent(copyOperation(operation, false), count)
    }
}

const merge = (operation1, operation2) => {
    const length = operation1.length

    if (length !== operation2.length) {
        return null
    }

    const action = operation1[ACTION]

    if (action !== operation2[ACTION]) {
        return null
    }

    switch (action) {
        case ACTION_INSERT_TEXT:
        case ACTION_DELETE:
        case ACTION_RETAIN:
            for (let i = CONTENT + 1; i < length; ++i) {
                if (operation1[i] !== operation2[i]) {
                    return null
                }
            }
            return setContent(copyOperation(operation1, false), getContent(operation1) + getContent(operation2))

        default:
            return null
    }
}

const areOperationsEqual = (operation1, operation2) => {
    const length = operation1.length

    if (operation2.length !== length) {
        return false
    }

    for (let i = 0; i < length; ++i) {
        if (operation1[i] !== operation2[i]) {
            return false
        }
    }

    return true
}

const areActionsEqual = (operation1, operation2) =>
    operation1[ACTION] === operation2[ACTION]

const areAttributesEqual = (operation1, operation2) => {
    let i1 = getAttributesIndex(operation1)
    let i2 = getAttributesIndex(operation2)
    const length = operation1.length

    if (length - i1 !== operation2.length - i2) {
        return false
    }

    while (i1 < length) {
        if (operation1[i1++] !== operation2[i2++]) {
            return false
        }
    }

    return true
}

// Composes up to 2 operations tracked by the iterators.
// Advances the iterators past the composed operations.
// Returns a new operation, or null, if the iterators have been exhausted.
const composeIterators = (iterator1, iterator2) => {
    do {
        const operation1 = iterator1.operation
        const operation2 = iterator2.operation

        if (operation1 === null) {
            if (operation2 === null) {
                return null
            }

            const length = getLength(operation2)
            const offset = iterator2.offset
            const remaining = length - offset
            iterator2.next(remaining)
            return slice(operation2, offset, remaining, length)
        }

        if (operation2 === null) {
            const length = getLength(operation1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(operation1, offset, remaining, length)
        }

        if (isInsert(operation2)) {
            const length = getLength(operation2)
            const offset = iterator2.offset
            const remaining = length - offset
            iterator2.next(remaining)
            return slice(operation2, offset, remaining, length)

        }

        if (isDelete(operation1)) {
            const length = getLength(operation1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(operation1, offset, remaining, length)
        }

        const length1 = getLength(operation1)
        const length2 = getLength(operation2)
        const offset1 = iterator1.offset
        const offset2 = iterator2.offset
        const remaining1 = length1 - offset1
        const remaining2 = length2 - offset2
        const length = remaining1 < remaining2 ? remaining1 : remaining2

        iterator1.next(length)
        iterator2.next(length)

        if (isRetain(operation2)) {
            // `operation1` must be INSERT or RETAIN

            if (operation2.length <= RETAIN_ATTRIBUTES || areAttributesEqual(operation1, operation2)) {
                // no attribute changes
                return slice(operation1, offset1, length, length1)
            }

            const newOperation = copyOperation(operation1, true)

            if (isRetain(newOperation)) {
                newOperation[CONTENT] = length
            } else if (isInsertText(newOperation)) {
                newOperation[CONTENT] = newOperation[CONTENT].substr(offset1, length)
            }

            const keepNull = isRetain(operation1)
            let i1 = newOperation.length // attribute index in operation1
            let i2 = RETAIN_ATTRIBUTES // attribute index in operation2
            let i3 = newOperation.length // attribute index in newOperation
            let l1 = operation1.length
            let l2 = operation2.length

            // compose the attributes
            while (i1 < l1 && i2 < l2) {
                if (operation1[i1] === operation2[i2]) {
                    // the same attribute name in both operations
                    i1 += 2
                    if (operation2[i2 + 1] !== null || keepNull) {
                        newOperation[i3++] = operation2[i2++]
                        newOperation[i3++] = operation2[i2++]
                    } else {
                        i2 += 2
                    }

                } else if (operation1[i1] < operation2[i2]) {
                    // an attribute from operation1 is not present in operation2
                    if (operation1[i1 + 1] !== null || keepNull) {
                        newOperation[i3++] = operation1[i1++]
                        newOperation[i3++] = operation1[i1++]
                    } else {
                        i1 += 2
                    }

                } else {
                    // an attribute from operation2 is not present in operation1
                    if (operation2[i2 + 1] !== null || keepNull) {
                        newOperation[i3++] = operation2[i2++]
                        newOperation[i3++] = operation2[i2++]
                    } else {
                        i2 += 2
                    }
                }
            }

            while (i2 < l2) {
                // only operation2 attributes left
                if (operation2[i2 + 1] !== null || keepNull) {
                    newOperation[i3++] = operation2[i2++]
                    newOperation[i3++] = operation2[i2++]
                } else {
                    i2 += 2
                }

            }

            while (i1 < l1) {
                // only operation1 attributes left
                if (operation1[i1 + 1] !== null || keepNull) {
                    newOperation[i3++] = operation1[i1++]
                    newOperation[i3++] = operation1[i1++]
                } else {
                    i1 += 2
                }

            }

            return newOperation
        }

        if (isDelete(operation2) && isRetain(operation1)) {
            return slice(operation2, offset2, length, length2)
        }

        // `operation2` must be DELETE and `operation1` must be INSERT, so they
        // cancel each other out and we can move on the the next operation.
    } while (true)
}

// Transforms up to 2 operations tracked by the iterators.
// Advances the iterators past the transformed operations.
// Returns a new operation, or null, if the iterator1 has been exhausted.
const transformIterators = (iterator1, iterator2, operation1HasPriority) => {
    do {
        const operation1 = iterator1.operation
        const operation2 = iterator2.operation

        if (operation1 === null) {
            return null
        }

        if (operation2 === null) {
            const length = getLength(operation1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(operation1, offset, remaining, length)
        }

        if (operation1HasPriority && isInsert(operation1)) {
            const length = getLength(operation1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(operation1, offset, remaining, length)
        }

        if (isInsert(operation2)) {
            const remaining = getLength(operation2) - iterator2.offset
            iterator2.next(remaining)
            return createRetain(remaining)
        }

        if (isInsert(operation1)) {
            const length = getLength(operation1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(operation1, offset, remaining, length)
        }

        const length1 = getLength(operation1)
        const length2 = getLength(operation2)
        const offset1 = iterator1.offset
        const offset2 = iterator2.offset
        const remaining1 = length1 - offset1
        const remaining2 = length2 - offset2
        const length = remaining1 < remaining2 ? remaining1 : remaining2

        iterator1.next(length)
        iterator2.next(length)

        if (isDelete(operation2)) {
            // operation1 must be retain or delete - either way it's redundant
            continue
        }

        if (isDelete(operation1)) {
            return slice(operation1, offset1, length, length1)
        }

        // operation1 and operation2 must be retain
        if (operation1HasPriority) {
            return slice(operation1, offset1, length, length1)
        }

        const newOperation = createRetain(length)
        let i1 = RETAIN_ATTRIBUTES // operation1 attribute index
        let i2 = RETAIN_ATTRIBUTES // operation2 attribute index
        let i3 = RETAIN_ATTRIBUTES // newOperation attribute index
        const l1 = operation1.length
        const l2 = operation2.length

        while (i1 < l1) {
            if (i2 >= l2) {
                // no more attributes in operation2
                newOperation[i3++] = operation1[i1++]
                newOperation[i3++] = operation1[i1++]

            } else if (operation1[i1] === operation2[i2]) {
                // attribute already set in operation2, which has priority
                i1 += 2
                i2 += 2

            } else if (operation1[i1] < operation2[i2]) {
                // attribute from operation1 is not present in operation2
                newOperation[i3++] = operation1[i1++]
                newOperation[i3++] = operation1[i1++]
            } else {
                // attribute from operation2 is not present in operation1
                i2 += 2
            }
        }

        return newOperation
    } while (true)
}

// Computes the difference between the 2 iterators based on the hints provided by the
// `diffType` and `diffContent` params. Emits the results through `delta1Callback` and `delta2Callback`.
//
// `iterator1`: enumerates the first list of operations
// `iterator2`: enumerates the second list of operations
// `diffType`:
//    1: `diffContent` present only in iterator2
//    0: `diffContent` present in both interator1 and iterator2
//   -1: `diffContent` present only in iterator1
// `diffContent` the content of the text difference between the iterators
// `delta1Callback`: called with an operation which would convert the content of iterator2 to the content of iterator1, when applied
// `delta2Callback`: called with an operation which would convert the content of iterator1 to the content of iterator2, when applied
const diffIterators = (iterator1, iterator2, diffType, diffContent, delta1Callback, delta2Callback) => {
    let diffLength = diffContent.length

    switch (diffType) {
        case 0: // `diffContent` present in both iterator1 and iterator2
            let pendingRetain = 0

            while (diffLength > 0) {
                const operation1 = iterator1.operations[iterator1.index]
                const length1 = getLength(operation1)
                const offset1 = iterator1.offset
                const remaining1 = length1 - offset1
                const operation2 = iterator2.operations[iterator2.index]
                const length2 = getLength(operation2)
                const offset2 = iterator2.offset
                const remaining2 = length2 - offset2
                const length =
                    (diffLength <= remaining1 && diffLength <= remaining2) ? diffLength :
                    (remaining1 <= diffLength && remaining1 <= remaining2) ? remaining1 :
                    remaining2

                diffLength -= length
                iterator1.next(length)
                iterator2.next(length)

                if (operation1[ACTION] === operation2[ACTION] &&
                    (isInsertText(operation1) ?
                        operation1[CONTENT].substr(offset1, length) === operation2[CONTENT].substr(offset2, length) :
                        operation1[CONTENT] === operation2[CONTENT]) &&
                    operation1[VERSION] === operation2[VERSION] &&
                    operation1[AUTHOR] === operation2[AUTHOR]
                ) {
                    if (areAttributesEqual(operation1, operation2)) {
                        // This is the most common case in practice,
                        // so it must be optimized as much as possible.
                        pendingRetain += length

                    } else {
                        if (pendingRetain > 0) {
                            const deltaRetain = createRetain(pendingRetain)
                            delta1Callback(deltaRetain)
                            delta2Callback(deltaRetain)
                            pendingRetain = 0
                        }

                        const retain1 = createRetain(length)
                        const retain2 = createRetain(length)
                        let i1 = getAttributesIndex(operation1) // attribute index for operation1
                        let i2 = i1 // attribute index for operation2
                        let i3 = RETAIN_ATTRIBUTES // attribute index for retain1
                        let i4 = RETAIN_ATTRIBUTES // attribute index for retain2
                        const l1 = operation1.length
                        const l2 = operation2.length

                        while (i1 < l1 && i2 < l2) {
                            if (operation1[i1] === operation2[i2]) {
                                // the same name
                                if (operation1[i1 + 1] === operation2[i2 + 1]) {
                                    // the same value
                                    i1 += 2
                                    i2 += 2
                                } else {
                                    // different values
                                    retain1[i3++] = operation1[i1++]
                                    retain1[i3++] = operation1[i1++]
                                    retain2[i4++] = operation2[i2++]
                                    retain2[i4++] = operation2[i2++]
                                }

                            } else if (operation1[i1] < operation2[i2]) {
                                // attribute only in operation1
                                const name = operation1[i1++]
                                const value = operation1[i1++]

                                retain1[i3++] = name
                                retain1[i3++] = value
                                retain2[i4++] = name
                                retain2[i4++] = null

                            } else {
                                // attribute only in operation2
                                const name = operation2[i2++]
                                const value = operation2[i2++]

                                retain1[i3++] = name
                                retain1[i3++] = null
                                retain2[i4++] = name
                                retain2[i4++] = value
                            }
                        }

                        while (i2 < l2) {
                            // only operation2 attributes left
                            const name = operation2[i2++]
                            const value = operation2[i2++]

                            retain1[i3++] = name
                            retain1[i3++] = null
                            retain2[i4++] = name
                            retain2[i4++] = value

                        }

                        while (i1 < l1) {
                            // only operation1 attributes left
                            const name = operation1[i1++]
                            const value = operation1[i1++]

                            retain1[i3++] = name
                            retain1[i3++] = value
                            retain2[i4++] = name
                            retain2[i4++] = null

                        }

                        delta1Callback(retain1)
                        delta2Callback(retain2)
                    }

                } else {
                    if (pendingRetain > 0) {
                        const deltaRetain = createRetain(pendingRetain)
                        delta1Callback(deltaRetain)
                        delta2Callback(deltaRetain)
                        pendingRetain = 0
                    }

                    const deltaDelete = createDelete(length)
                    delta1Callback(slice(operation1, offset1, length, length1))
                    delta1Callback(deltaDelete)
                    delta2Callback(slice(operation2, offset2, length, length2))
                    delta2Callback(deltaDelete)
                }
            }

            if (pendingRetain > 0) {
                const deltaRetain = createRetain(pendingRetain)
                delta1Callback(deltaRetain)
                delta2Callback(deltaRetain)
                pendingRetain = 0
            }

            break

        case 1: // `diffContent` present only in iterator2
            delta1Callback(createDelete(diffLength))

            while (diffLength > 0) {
                const operation2 = iterator2.operations[iterator2.index]
                const length2 = getLength(operation2)
                const offset2 = iterator2.offset
                const remaining2 = length2 - offset2
                const length = diffLength <= remaining2 ? diffLength : remaining2

                diffLength -= length
                iterator2.next(length)

                delta2Callback(slice(operation2, offset2, length, length2))
            }
            break

        case -1: // `diffContent` present only in iterator1
            delta2Callback(createDelete(diffLength))

            while (diffLength > 0) {
                const operation1 = iterator1.operations[iterator1.index]
                const length1 = getLength(operation1)
                const offset1 = iterator1.offset
                const remaining1 = length1 - offset1
                const length = diffLength <= remaining1 ? diffLength : remaining1

                diffLength -= length
                iterator1.next(length)

                delta1Callback(slice(operation1, offset1, length, length1))
            }
            break
    }
}

module.exports = {
    createInsertText,
    createInsertOpen,
    createInsertClose,
    createInsertEmbed,
    createRetain,
    createDelete,
    copyOperation,
    validate,

    getContent,
    getAttributes,

    isDelete,
    isRetain,
    isInsert,

    isInsertText,
    isInsertOpen,
    isInsertClose,
    isInsertEmbed,

    areOperationsEqual,
    areActionsEqual,
    areAttributesEqual,
    getAttributesIndex,
    hasAttributes,
    getLength,
    slice,
    merge,
    composeIterators,
    transformIterators,
    diffIterators
}
