// Each action is represented by an array.
// The constants below determine what data can be found at each array index.
//
// The attributes are appended to the action array.
// Each attribute occupies 2 indexes. The first is the attribute name and the second is the attribute value.
// The attributes must be sorted in the ascending order by the attribute name.
// Attribute names and values must both be strings, except for operations (as oposed to document snapshots),
// where the attibute value may be `null`, which is interpreted as an instruction to remove the attribute,
// when the operation is applied.

// ACTION_* -> number
const TYPE = 0

// ACTION_INSERT_TEXT -> string, plain text
// ACTION_INSERT_(OPEN|CLOSE|EMBED) -> string, a node id and node name
// ACTION_(RETAIN|DELETE) -> number, number of characters to retain or delete
const CONTENT = 1

// ACTION_RETAIN
// ACTION_INSERT_.*
const ATTRIBUTES = 2

// Action types
const ACTION_DELETE = -1
const ACTION_RETAIN = 0
const ACTION_INSERT_TEXT = 1
const ACTION_INSERT_OPEN = 2
const ACTION_INSERT_CLOSE = 3
const ACTION_INSERT_EMBED = 4

const clone = (action, skipAttributes) => {
    const actionLength = action.length
    const limit = skipAttributes && actionLength > ATTRIBUTES ? ATTRIBUTES : actionLength
    const newAction = new Array(limit)

    for (let i = 0; i < limit; ++i) {
        newAction[i] = action[i]
    }

    return newAction
}

const createInsert = type => (content, attributes) => {
    let actionIndex = ATTRIBUTES
    let attributeIndex = 0
    const attributesLength = attributes ? attributes.length : 0
    const action = new Array(actionIndex + attributesLength)

    action[TYPE] = type
    action[CONTENT] = content

    while (attributeIndex < attributesLength) {
        action[actionIndex++] = attributes[attributeIndex++]
    }

    return action
}

const createInsertText = createInsert(ACTION_INSERT_TEXT)
const createInsertOpen = createInsert(ACTION_INSERT_OPEN)
const createInsertClose = createInsert(ACTION_INSERT_CLOSE)
const createInsertEmbed = createInsert(ACTION_INSERT_EMBED)

const createRetain = (content, attributes) => {
    const attributesLength = attributes ? attributes.length : 0
    const action = new Array(2 + attributesLength)
    action[TYPE] = ACTION_RETAIN
    action[CONTENT] = content

    let actionIndex = 2
    let attributeIndex = 0

    while (attributeIndex < attributesLength) {
        action[actionIndex++] = attributes[attributeIndex++]
    }

    return action
}

const createDelete = content => [ ACTION_DELETE, content ]

// Actions should normally be read-only, so this function is intended to be used only right after creating a new
// action before any other code can access it.
const setAttribute = (action, name, value) => {
    let insertAt = ATTRIBUTES
    const actionLength = action.length

    while (insertAt < actionLength && action[insertAt] < name) {
        insertAt += 2
    }

    if (insertAt === actionLength) {
        // add new attribute at the end
        action[insertAt] = name
        action[insertAt + 1] = value
        return action
    }

    if (action[insertAt] === name) {
        // set an existing attribute
        action[insertAt + 1] = value
        return action
    }

    // insert a new attribute
    while (insertAt < actionLength) {
        const previousName = action[insertAt]
        const previousValue = action[insertAt + 1]
        action[insertAt++] = name
        action[insertAt++] = value
        name = previousName
        value = previousValue
    }

    action[insertAt++] = name
    action[insertAt++] = value

    return action
}

const validateLength = (action) => {
    if (action.length !== ATTRIBUTES) {
        return new Error(`action.length must be ${ATTRIBUTES}`)
    }

    return null
}

const validateMinLength = (action) => {
    if (action.length < ATTRIBUTES) {
        return new Error(`action.length must be at least ${ATTRIBUTES}`)
    }

    return null
}

const validateContentNumber = action => {
    const content = action[CONTENT]

    if (typeof content !== 'number' || content <= 0 || !isFinite(content) || Math.floor(content) !== content) {
        return new Error('content must be a positive integer')
    }

    return null
}

const validateContentText = action => {
    const content = action[CONTENT]

    if (typeof content !== 'string' || content === '') {
        return new Error('content must be a non-empty string')
    }

    return null
}

const validateContentNode = action => {
    const content = action[CONTENT]

    if (typeof content !== 'string') {
        return new Error('content must be a string')
    }

    if (content.length < 2) {
        return new Error('content must contain a node ID and node name')
    }

    if (content[0] < '\uE000' || content[0] > '\uF8FF') {
        return new Error('node ID must be a character in the Private Use Area of the Unicode Basic Multilingual Plane')
    }

    return null
}

const validateAttributes = (action, allowNull) => {
    const length = action.length

    if ((length - ATTRIBUTES) & 1) {
        return new Error('missing value for the last attribute')
    }

    for (let i = ATTRIBUTES; i < length; i += 2) {
        const name = action[i]
        const value = action[i + 1]

        if (typeof name !== 'string') {
            return new Error('attribute name must be a string')
        }

        if (!(typeof value === 'string' || (allowNull && value === null))) {
            return new Error(`attribute value must be a string${ allowNull ? ' or null' : '' }`)
        }

        if (i > ATTRIBUTES && action[i - 2] >= name) {
            return new Error('duplicate or not sorted attribute')
        }
    }

    return null
}

// Returns null, if the action is valid. Otherwise returns an error.
const validate = action => {
    if (!Array.isArray(action)) {
        return new Error('action must be an array')
    }

    switch (action[TYPE]) {
        case ACTION_DELETE:
            return validateLength(action) ||
                validateContentNumber(action)

        case ACTION_RETAIN:
            return validateMinLength(action) ||
                validateContentNumber(action) ||
                validateAttributes(action, true)

        case ACTION_INSERT_TEXT:
            return validateMinLength(action) ||
                validateContentText(action) ||
                validateAttributes(action, false)
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return validateMinLength(action) ||
                validateContentNode(action) ||
                validateAttributes(action, false)

        default:
            return new Error('unknown action type')
    }
}

const getCount = action => action[CONTENT] // for retain and delete
const getText = action => action[CONTENT] // for insert text
const getNodeIdAndName = action => action[CONTENT] // for insert node
const getNodeId = action => action[CONTENT][0] // for insert node
const getNodeName = action => action[CONTENT].substring(1) // for insert node
const setContent = (action, content) => { action[CONTENT] = content; return action } // for retain, delete and insert text
const getAttributes = (action, attributeNames) => { // for insert and retain
    if (attributeNames) {
        let i1 = ATTRIBUTES // index for action
        let i2 = 0 // index for attributeNames
        let i3 = 0 // index for attributes
        const l1 = action.length
        const l2 = attributeNames.length
        const attributes = []

        while (i1 < l1 && i2 < l2) {
            if (action[i1] === attributeNames[i2]) {
                attributes[i3++] = action[i1++]
                attributes[i3++] = action[i1++]
                ++i2

            } else if (action[i1] < attributeNames[i2]) {
                i1 += 2 // redundant attribute in action
            } else {
                ++i2 // missing attribute in action
            }
        }

        return attributes
    }

    const actionLength = action.length
    let actionIndex = ATTRIBUTES

    const attributes = new Array(actionLength - actionIndex)
    let attributesIndex = 0

    while (actionIndex < actionLength) {
        attributes[attributesIndex++] = action[actionIndex++]
        attributes[attributesIndex++] = action[actionIndex++]
    }

    return attributes
}

const isDelete = action => action[TYPE] === ACTION_DELETE
const isRetain = action => action[TYPE] === ACTION_RETAIN
const isInsert = action => ACTION_INSERT_TEXT <= action[TYPE] && action[TYPE] <= ACTION_INSERT_EMBED

const isInsertText = action => action[TYPE] === ACTION_INSERT_TEXT
const isInsertOpen = action => action[TYPE] === ACTION_INSERT_OPEN
const isInsertClose = action => action[TYPE] === ACTION_INSERT_CLOSE
const isInsertEmbed = action => action[TYPE] === ACTION_INSERT_EMBED

const getAttributesIndex = action => ATTRIBUTES

const hasAttributes = action =>
    action.length > ATTRIBUTES

const getLength = action => {
    switch (action[TYPE]) {
        case ACTION_INSERT_TEXT:
            return action[CONTENT].length
        case ACTION_INSERT_OPEN:
        case ACTION_INSERT_CLOSE:
        case ACTION_INSERT_EMBED:
            return 1
        default:
            return action[CONTENT]
    }
}

const slice = (action, offset, count, length) => {
    if (offset === 0 && count === length) {
        // takes care of insert open/close/embed
        return action
    } else if (isInsertText(action)) {
        // takes care of insert text
        return setContent(clone(action, false), action[CONTENT].substr(offset, count))
    } else {
        // it must be retain or delete
        return setContent(clone(action, false), count)
    }
}

const merge = (action1, action2) => {
    const length = action1.length

    if (length !== action2.length) {
        return null
    }

    const action = action1[TYPE]

    if (action !== action2[TYPE]) {
        return null
    }

    switch (action) {
        case ACTION_INSERT_TEXT:
        case ACTION_DELETE:
        case ACTION_RETAIN:
            for (let i = CONTENT + 1; i < length; ++i) {
                if (action1[i] !== action2[i]) {
                    return null
                }
            }
            return setContent(clone(action1, false), action1[CONTENT] + action2[CONTENT])

        default:
            return null
    }
}

const areEqual = (action1, action2) => {
    const length = action1.length

    if (action2.length !== length) {
        return false
    }

    for (let i = 0; i < length; ++i) {
        if (action1[i] !== action2[i]) {
            return false
        }
    }

    return true
}

const areTypesEqual = (action1, action2) =>
    action1[TYPE] === action2[TYPE]

const areAttributesEqual = (action1, action2) => {
    let i1 = ATTRIBUTES
    let i2 = ATTRIBUTES
    const length = action1.length

    if (length - i1 !== action2.length - i2) {
        return false
    }

    while (i1 < length) {
        if (action1[i1++] !== action2[i2++]) {
            return false
        }
    }

    return true
}

// Composes up to 2 actions tracked by the iterators.
// Advances the iterators past the composed actions.
// Returns a new action, or null, if the iterators have been exhausted.
const composeIterators = (iterator1, iterator2) => {
    do {
        const action1 = iterator1.action
        const action2 = iterator2.action

        if (action1 === null) {
            if (action2 === null) {
                return null
            }

            const length = getLength(action2)
            const offset = iterator2.offset
            const remaining = length - offset
            iterator2.next(remaining)
            return slice(action2, offset, remaining, length)
        }

        if (action2 === null) {
            const length = getLength(action1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(action1, offset, remaining, length)
        }

        if (isInsert(action2)) {
            const length = getLength(action2)
            const offset = iterator2.offset
            const remaining = length - offset
            iterator2.next(remaining)
            return slice(action2, offset, remaining, length)

        }

        if (isDelete(action1)) {
            const length = getLength(action1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(action1, offset, remaining, length)
        }

        const length1 = getLength(action1)
        const length2 = getLength(action2)
        const offset1 = iterator1.offset
        const offset2 = iterator2.offset
        const remaining1 = length1 - offset1
        const remaining2 = length2 - offset2
        const length = remaining1 < remaining2 ? remaining1 : remaining2

        iterator1.next(length)
        iterator2.next(length)

        if (isRetain(action2)) {
            // `action1` must be INSERT or RETAIN

            if (action2.length <= ATTRIBUTES || areAttributesEqual(action1, action2)) {
                // no attribute changes
                return slice(action1, offset1, length, length1)
            }

            const newAction = clone(action1, true)

            if (isRetain(newAction)) {
                newAction[CONTENT] = length
            } else if (isInsertText(newAction)) {
                newAction[CONTENT] = newAction[CONTENT].substr(offset1, length)
            }

            const keepNull = isRetain(action1)
            let i1 = newAction.length // attribute index in action1
            let i2 = ATTRIBUTES // attribute index in action2
            let i3 = newAction.length // attribute index in newAction
            let l1 = action1.length
            let l2 = action2.length

            // compose the attributes
            while (i1 < l1 && i2 < l2) {
                if (action1[i1] === action2[i2]) {
                    // the same attribute name in both actions
                    i1 += 2
                    if (action2[i2 + 1] !== null || keepNull) {
                        newAction[i3++] = action2[i2++]
                        newAction[i3++] = action2[i2++]
                    } else {
                        i2 += 2
                    }

                } else if (action1[i1] < action2[i2]) {
                    // an attribute from action1 is not present in action2
                    if (action1[i1 + 1] !== null || keepNull) {
                        newAction[i3++] = action1[i1++]
                        newAction[i3++] = action1[i1++]
                    } else {
                        i1 += 2
                    }

                } else {
                    // an attribute from action2 is not present in action1
                    if (action2[i2 + 1] !== null || keepNull) {
                        newAction[i3++] = action2[i2++]
                        newAction[i3++] = action2[i2++]
                    } else {
                        i2 += 2
                    }
                }
            }

            while (i2 < l2) {
                // only action2 attributes left
                if (action2[i2 + 1] !== null || keepNull) {
                    newAction[i3++] = action2[i2++]
                    newAction[i3++] = action2[i2++]
                } else {
                    i2 += 2
                }

            }

            while (i1 < l1) {
                // only action1 attributes left
                if (action1[i1 + 1] !== null || keepNull) {
                    newAction[i3++] = action1[i1++]
                    newAction[i3++] = action1[i1++]
                } else {
                    i1 += 2
                }

            }

            return newAction
        }

        if (isDelete(action2) && isRetain(action1)) {
            return slice(action2, offset2, length, length2)
        }

        // `action2` must be DELETE and `action1` must be INSERT, so they
        // cancel each other out and we can move on the the next action.
    } while (true)
}

// Transforms up to 2 actions tracked by the iterators.
// Advances the iterators past the transformed actions.
// Returns a new action, or null, if iterator1 has been exhausted.
const transformIterators = (iterator1, iterator2, action1HasPriority) => {
    do {
        const action1 = iterator1.action
        const action2 = iterator2.action

        if (action1 === null) {
            return null
        }

        if (action2 === null) {
            const length = getLength(action1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(action1, offset, remaining, length)
        }

        if (action1HasPriority && isInsert(action1)) {
            const length = getLength(action1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(action1, offset, remaining, length)
        }

        if (isInsert(action2)) {
            const remaining = getLength(action2) - iterator2.offset
            iterator2.next(remaining)
            return createRetain(remaining)
        }

        if (isInsert(action1)) {
            const length = getLength(action1)
            const offset = iterator1.offset
            const remaining = length - offset
            iterator1.next(remaining)
            return slice(action1, offset, remaining, length)
        }

        const length1 = getLength(action1)
        const length2 = getLength(action2)
        const offset1 = iterator1.offset
        const offset2 = iterator2.offset
        const remaining1 = length1 - offset1
        const remaining2 = length2 - offset2
        const length = remaining1 < remaining2 ? remaining1 : remaining2

        iterator1.next(length)
        iterator2.next(length)

        if (isDelete(action2)) {
            // action1 must be retain or delete - either way it's redundant
            continue
        }

        if (isDelete(action1)) {
            return slice(action1, offset1, length, length1)
        }

        // action1 and action2 must be retain
        if (action1HasPriority) {
            return slice(action1, offset1, length, length1)
        }

        const newAction = createRetain(length)
        let i1 = ATTRIBUTES // action1 attribute index
        let i2 = ATTRIBUTES // action2 attribute index
        let i3 = ATTRIBUTES // newAction attribute index
        const l1 = action1.length
        const l2 = action2.length

        while (i1 < l1) {
            if (i2 >= l2) {
                // no more attributes in action2
                newAction[i3++] = action1[i1++]
                newAction[i3++] = action1[i1++]

            } else if (action1[i1] === action2[i2]) {
                // attribute already set in action2, which has priority
                i1 += 2
                i2 += 2

            } else if (action1[i1] < action2[i2]) {
                // attribute from action1 is not present in action2
                newAction[i3++] = action1[i1++]
                newAction[i3++] = action1[i1++]
            } else {
                // attribute from action2 is not present in action1
                i2 += 2
            }
        }

        return newAction
    } while (true)
}

// Computes the difference between the 2 iterators based on the hints provided by the
// `diffType` and `diffContent` params. Emits the results through `delta1Callback` and `delta2Callback`.
//
// `iterator1`: enumerates the first operation
// `iterator2`: enumerates the second operation
// `diffType`:
//    1: `diffContent` present only in iterator2
//    0: `diffContent` present in both interator1 and iterator2
//   -1: `diffContent` present only in iterator1
// `diffContent` the content of the text difference between the iterators
// `delta1Callback`: called with an action which would convert the content of iterator2 to the content of iterator1, when applied
// `delta2Callback`: called with an action which would convert the content of iterator1 to the content of iterator2, when applied
const diffIterators = (iterator1, iterator2, diffType, diffContent, delta1Callback, delta2Callback) => {
    let diffLength = diffContent.length

    switch (diffType) {
        case 0: // `diffContent` present in both iterator1 and iterator2
            let pendingRetain = 0

            while (diffLength > 0) {
                const action1 = iterator1.operation[iterator1.index]
                const length1 = getLength(action1)
                const offset1 = iterator1.offset
                const remaining1 = length1 - offset1
                const action2 = iterator2.operation[iterator2.index]
                const length2 = getLength(action2)
                const offset2 = iterator2.offset
                const remaining2 = length2 - offset2
                const length =
                    (diffLength <= remaining1 && diffLength <= remaining2) ? diffLength :
                    (remaining1 <= diffLength && remaining1 <= remaining2) ? remaining1 :
                    remaining2

                diffLength -= length
                iterator1.next(length)
                iterator2.next(length)

                if (action1[TYPE] === action2[TYPE] &&
                    (isInsertText(action1) ?
                        action1[CONTENT].substr(offset1, length) === action2[CONTENT].substr(offset2, length) :
                        action1[CONTENT] === action2[CONTENT])
                ) {
                    if (areAttributesEqual(action1, action2)) {
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
                        let i1 = ATTRIBUTES // attribute index for action1
                        let i2 = ATTRIBUTES // attribute index for action2
                        let i3 = ATTRIBUTES // attribute index for retain1
                        let i4 = ATTRIBUTES // attribute index for retain2
                        const l1 = action1.length
                        const l2 = action2.length

                        while (i1 < l1 && i2 < l2) {
                            if (action1[i1] === action2[i2]) {
                                // the same name
                                if (action1[i1 + 1] === action2[i2 + 1]) {
                                    // the same value
                                    i1 += 2
                                    i2 += 2
                                } else {
                                    // different values
                                    retain1[i3++] = action1[i1++]
                                    retain1[i3++] = action1[i1++]
                                    retain2[i4++] = action2[i2++]
                                    retain2[i4++] = action2[i2++]
                                }

                            } else if (action1[i1] < action2[i2]) {
                                // attribute only in action1
                                const name = action1[i1++]
                                const value = action1[i1++]

                                retain1[i3++] = name
                                retain1[i3++] = value
                                retain2[i4++] = name
                                retain2[i4++] = null

                            } else {
                                // attribute only in action2
                                const name = action2[i2++]
                                const value = action2[i2++]

                                retain1[i3++] = name
                                retain1[i3++] = null
                                retain2[i4++] = name
                                retain2[i4++] = value
                            }
                        }

                        while (i2 < l2) {
                            // only action2 attributes left
                            const name = action2[i2++]
                            const value = action2[i2++]

                            retain1[i3++] = name
                            retain1[i3++] = null
                            retain2[i4++] = name
                            retain2[i4++] = value

                        }

                        while (i1 < l1) {
                            // only action1 attributes left
                            const name = action1[i1++]
                            const value = action1[i1++]

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
                    delta1Callback(slice(action1, offset1, length, length1))
                    delta1Callback(deltaDelete)
                    delta2Callback(slice(action2, offset2, length, length2))
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
                const action2 = iterator2.operation[iterator2.index]
                const length2 = getLength(action2)
                const offset2 = iterator2.offset
                const remaining2 = length2 - offset2
                const length = diffLength <= remaining2 ? diffLength : remaining2

                diffLength -= length
                iterator2.next(length)

                delta2Callback(slice(action2, offset2, length, length2))
            }
            break

        case -1: // `diffContent` present only in iterator1
            delta2Callback(createDelete(diffLength))

            while (diffLength > 0) {
                const action1 = iterator1.operation[iterator1.index]
                const length1 = getLength(action1)
                const offset1 = iterator1.offset
                const remaining1 = length1 - offset1
                const length = diffLength <= remaining1 ? diffLength : remaining1

                diffLength -= length
                iterator1.next(length)

                delta1Callback(slice(action1, offset1, length, length1))
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
    clone,
    setAttribute,
    validate,

    getCount,
    getText,
    getNodeId,
    getNodeName,
    getNodeIdAndName,
    getAttributes,

    isDelete,
    isRetain,
    isInsert,

    isInsertText,
    isInsertOpen,
    isInsertClose,
    isInsertEmbed,

    areEqual,
    areTypesEqual,
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
