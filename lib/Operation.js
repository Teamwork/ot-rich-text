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
// ACTION_INSERT_(OPEN|CLOSE|EMBED) -> string, 1 character in the Unicode Private Use Area followed by tag name in upper case
// ACTION_(RETAIN|DELETE) -> number, number of characters to retain or delete
const CONTENT = 1

// ACTION_RETAIN
const RETAIN_ATTRIBUTES = 2

// ACTION_INSERT
const VERSION = 2
const AUTHOR = 3
const INSERT_TEXT_ATTRIBUTES = 4

const NODE_NAME = 4
const INSERT_NODE_ATTRIBUTES = 5

const ACTION_DELETE = 0
const ACTION_RETAIN = 1
const ACTION_INSERT_TEXT = 2
const ACTION_INSERT_OPEN = 3
const ACTION_INSERT_CLOSE = 4
const ACTION_INSERT_EMBED = 5

const MAX_INT = ((1 << 31) - 1) | 0

const copyOperation = (operation, skipAttributes) => {
    let limit = operation.length

    if (skipAttributes) {
        switch (operation[ACTION]) {
            case ACTION_INSERT_TEXT:
                if (INSERT_TEXT_ATTRIBUTES < limit) {
                    limit = INSERT_TEXT_ATTRIBUTES
                }
                break
            case ACTION_INSERT_OPEN:
            case ACTION_INSERT_CLOSE:
            case ACTION_INSERT_EMBED:
                if (INSERT_NODE_ATTRIBUTES < limit) {
                    limit = INSERT_NODE_ATTRIBUTES
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

const createInsertText = (content, attributes) => {
    const attributesLength = attributes ? attributes.length : 0
    const operation = new Array(4 + attributesLength)
    operation[ACTION] = ACTION_INSERT_TEXT
    operation[CONTENT] = content || ''
    operation[VERSION] = 0
    operation[AUTHOR] = ''

    let operationIndex = 4
    let attributeIndex = 0

    while (attributeIndex < attributesLength) {
        operation[operationIndex++] = attributes[attributeIndex++]
    }

    return operation
}

const createInsertNode = (action) => (content, attributes) => {
    const attributesLength = attributes ? attributes.length : 0
    const operation = new Array(5 + attributesLength)
    operation[ACTION] = action
    operation[CONTENT] = content || '' // content ? (content.length === 1 ? content : content.substr(0, 1)) : ''
    operation[VERSION] = 0
    operation[AUTHOR] = ''
    operation[NODE_NAME] = 'DIV'

    let operationIndex = 5
    let attributeIndex = 0

    while (attributeIndex < attributesLength) {
        operation[operationIndex++] = attributes[attributeIndex++]
    }

    return operation
}

const createInsertOpen = createInsertNode(ACTION_INSERT_OPEN)
const createInsertClose = createInsertNode(ACTION_INSERT_CLOSE)
const createInsertEmbed = createInsertNode(ACTION_INSERT_EMBED)

const createRetain = (content, attributes) => {
    const attributesLength = attributes ? attributes.length : 0
    const operation = new Array(2 + attributesLength)
    operation[ACTION] = ACTION_RETAIN
    operation[CONTENT] = content > 0 ? content : 0

    let operationIndex = 2
    let attributeIndex = 0

    while (attributeIndex < attributesLength) {
        operation[operationIndex++] = attributes[attributeIndex++]
    }

    return operation
}

const createDelete = (content) => [ ACTION_DELETE, content > 0 ? content : 0 ]

const getContent = (operation) => operation[CONTENT]
const setContent = (operation, content) => { operation[CONTENT] = content; return operation }

const isDelete = (operation) => operation[ACTION] === ACTION_DELETE
const isRetain = (operation) => operation[ACTION] === ACTION_RETAIN
const isInsert = (operation) => ACTION_INSERT_TEXT <= operation[ACTION] && operation[ACTION] <= ACTION_INSERT_EMBED

const isInsertText = (operation) => operation[ACTION] === ACTION_INSERT_TEXT
const isInsertOpen = (operation) => operation[ACTION] === ACTION_INSERT_OPEN
const isInsertClose = (operation) => operation[ACTION] === ACTION_INSERT_CLOSE
const isInsertEmbed = (operation) => operation[ACTION] === ACTION_INSERT_EMBED

const getLength = (operation) => {
    switch (operation[ACTION]) {
        case ACTION_INSERT_TEXT:
            return getContent(operation).length | 0
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return getContent(operation).length > 1 | 0
        case ACTION_RETAIN:
        case ACTION_DELETE:
            return getContent(operation) | 0
        default:
            return 0
    }
}

const slice = (operation, offset = 0, count = MAX_INT) => {
    if (count <= 0) {
        // wrong count
        return isInsert(operation) ? setContent(copyOperation(operation), '') : setContent(copyOperation(operation), 0)
    }

    const length = getLength(operation)

    if (offset < 0) {
        offset = 0
    }

    if (offset >= length) {
        // takes care of empty operations
        return isInsert(operation) ? setContent(copyOperation(operation), '') : setContent(copyOperation(operation), 0)
    }

    const remaining = length - offset

    if (count > remaining) {
        count = remaining
    }

    if (offset === 0 && count === length) {
        // takes care of insert open/close/embed
        return operation
    } else if (isInsertText(operation)) {
        // takes care of insert text
        return setContent(copyOperation(operation), getContent(operation).substr(offset, count))
    } else {
        // it must be retain or delete
        return setContent(copyOperation(operation), count)
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
            return setContent(copyOperation(operation1), getContent(operation1) + getContent(operation2))

        default:
            return null
    }
}

const areAttributesEqual = (operation1, operation2) => {
    let i1 = isRetain(operation1) ? RETAIN_ATTRIBUTES :
            isInsertText(operation1) ? INSERT_TEXT_ATTRIBUTES :
            INSERT_NODE_ATTRIBUTES
    let i2 = isRetain(operation2) ? RETAIN_ATTRIBUTES :
            isInsertText(operation2) ? INSERT_TEXT_ATTRIBUTES :
            INSERT_NODE_ATTRIBUTES
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

// Composes up to 2 operations tracked by the operators.
// Advances the operators past the composed operations.
// Returns a new operation, or null, if the iterators have been exhausted.
const composeIterators = (iterator1, iterator2) => {
    const operation1 = iterator1.operation
    const operation2 = iterator2.operation

    if (operation1 == null) {
        if (operation2 == null) {
            return null
        }

        const offset = iterator2.offset
        iterator2.next(iterator2.remaining)
        return slice(operation2, offset)
    }

    if (operation2 == null) {
        const offset = iterator1.offset
        iterator1.next(iterator1.remaining)
        return slice(operation1, offset)
    }

    if (isInsert(operation2)) {
        const offset = iterator2.offset
        iterator2.next(iterator2.remaining)
        return slice(operation2, offset)

    }

    if (isDelete(operation1)) {
        const offset = iterator1.offset
        iterator1.next(iterator1.remaining)
        return slice(operation1, offset)
    }

    const length = Math.min(iterator1.remaining, iterator2.remaining)
    const offset1 = iterator1.offset
    const offset2 = iterator2.offset

    iterator1.next(length)
    iterator2.next(length)

    if (isRetain(operation2)) {
        // `operation1` must be INSERT or RETAIN

        if (operation2.length <= RETAIN_ATTRIBUTES || areAttributesEqual(operation1, operation2)) {
            // no attribute changes
            return slice(operation1, offset1, length)
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
        while (i1 < l1 || i2 < l2) {
            if (i1 >= l1) {
                // no more attributes in operation1
                if (operation2[i2 + 1] != null || keepNull) {
                    newOperation[i3++] = operation2[i2++]
                    newOperation[i3++] = operation2[i2++]
                } else {
                    i2 += 2
                }

            } else if (i2 >= l2) {
                // no more attributes in operation2
                if (operation1[i1 + 1] != null || keepNull) {
                    newOperation[i3++] = operation1[i1++]
                    newOperation[i3++] = operation1[i1++]
                } else {
                    i1 += 2
                }

            } else if (operation1[i1] === operation2[i2]) {
                // the same attribute name in both operations
                i1 += 2
                if (operation2[i2 + 1] != null || keepNull) {
                    newOperation[i3++] = operation2[i2++]
                    newOperation[i3++] = operation2[i2++]
                } else {
                    i2 += 2
                }

            } else if (operation1[i1] < operation2[i2]) {
                // an attribute from operation1 is not present in operation2
                if (operation1[i1 + 1] != null || keepNull) {
                    newOperation[i3++] = operation1[i1++]
                    newOperation[i3++] = operation1[i1++]
                } else {
                    i1 += 2
                }

            } else {
                // an attribute from operation2 is not present in operation1
                if (operation2[i2 + 1] != null || keepNull) {
                    newOperation[i3++] = operation2[i2++]
                    newOperation[i3++] = operation2[i2++]
                } else {
                    i2 += 2
                }
            }
        }

        return newOperation
    }

    if (isDelete(operation2) && isRetain(operation1)) {
        return slice(operation2, offset2, length)
    }

    // `operation2` must be DELETE and `operation1` must be INSERT, so they
    // cancel each other out and we can move on the the next operation.
    return composeIterators(iterator1, iterator2)
}

module.exports = {
    createInsertText,
    createInsertOpen,
    createInsertClose,
    createInsertEmbed,
    createRetain,
    createDelete,
    copyOperation,

    getContent,

    isDelete,
    isRetain,
    isInsert,

    isInsertText,
    isInsertOpen,
    isInsertClose,
    isInsertEmbed,

    areAttributesEqual,
    getLength,
    slice,
    merge,
    composeIterators
}
