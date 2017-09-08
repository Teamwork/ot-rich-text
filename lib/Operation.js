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
// ACTION_(RETAIN|DELETE) -> number, number of characters to retain
const CONTENT = 1

// ACTION_(INSERT|DELETE) -> number, document version in which the operation was introduced
const VERSION = 2

// ACTION_(INSERT|DELETE) -> string, userId
const AUTHOR = 3

// ACTION_INSERT -> This is the index of the first attribute's name.
const ATTRIBUTES = 4

const ACTION_INVALID = 0 // 0000 in binary
const ACTION_DELETE = 1 // 0001 in binary
const ACTION_INSERT = 2 // 0010 in binary
const ACTION_RETAIN = 3 // 0011 in binary
const ACTION_MASK = 3 // 0011 in binary
const ACTION_INSERT_TEXT = 0 << 2 // 0000 in binary
const ACTION_INSERT_OPEN = 1 << 2 // 0100 in binary
const ACTION_INSERT_CLOSE = 2 << 2 // 1000 in binary
const ACTION_INSERT_EMBED = 3 << 2 // 1100 in binary
const INSERT_TYPE_MASK = 3 << 2 // 1100 in binary
const MASK = ACTION_MASK | INSERT_TYPE_MASK

const MAX_INT = ((1 << 31) - 1) | 0
const INVALID_OPERATION = [ 0 ]

const createInsertText = (content = '', version = 0, author = '', ...attributes) =>
    [ ACTION_INSERT | ACTION_INSERT_TEXT, content, version, author, ...attributes ]
const createInsertOpen = (content = '', version = 0, author = '', ...attributes) =>
    [ ACTION_INSERT | ACTION_INSERT_OPEN, content, version, author, ...attributes ]
const createInsertClose = (content = '', version = 0, author = '', ...attributes) =>
    [ ACTION_INSERT | ACTION_INSERT_CLOSE, content, version, author, ...attributes ]
const createInsertEmbed = (content = '', version = 0, author = '', ...attributes) =>
    [ ACTION_INSERT | ACTION_INSERT_EMBED, content, version, author, ...attributes ]
const createRetain = (content = 0) =>
    [ ACTION_RETAIN, content ]
const createDelete = (content = 0, version = 0, author = '') =>
    [ ACTION_DELETE, content, version, author ]

const getContent = (operation) => operation[CONTENT]
const getVersion = (operation) => operation[VERSION]
const getAuthor = (operation) => operation[AUTHOR]

const setContent = (operation, content) => { operation[CONTENT] = content; return operation }
const setVersion = (operation, version) => { operation[VERSION] = version; return operation }
const setAuthor = (operation, author) => { operation[AUTHOR] = author; return operation }

const isInvalid = (operation) => (operation[ACTION] & ACTION_MASK) === ACTION_INVALID
const isDelete = (operation) => (operation[ACTION] & ACTION_MASK) === ACTION_DELETE
const isRetain = (operation) => (operation[ACTION] & ACTION_MASK) === ACTION_RETAIN
const isInsert = (operation) => (operation[ACTION] & ACTION_MASK) === ACTION_INSERT

const isInsertText = (operation) => (operation[ACTION] & MASK) === (ACTION_INSERT | ACTION_INSERT_TEXT)
const isInsertOpen = (operation) => (operation[ACTION] & MASK) === (ACTION_INSERT | ACTION_INSERT_OPEN)
const isInsertClose = (operation) => (operation[ACTION] & MASK) === (ACTION_INSERT | ACTION_INSERT_CLOSE)
const isInsertEmbed = (operation) => (operation[ACTION] & MASK) === (ACTION_INSERT | ACTION_INSERT_EMBED)

const getLength = (operation) => {
    const action = operation[ACTION]
    const content = operation[CONTENT]

    switch (action & ACTION_MASK) {
        case ACTION_INSERT:
            if ((action & INSERT_TYPE_MASK) === ACTION_INSERT_TEXT) {
                return content.length | 0
            } else {
                return (content.length > 1) | 0
            }
        case ACTION_RETAIN:
        case ACTION_DELETE:
            return (content > 0 ? content : 0) | 0
        default:
            return 0
    }
}

const slice = (operation, offset = 0, count = MAX_INT) => {
    if (count <= 0) {
        // wrong count
        return INVALID_OPERATION
    }

    const length = getLength(operation)

    if (offset < 0) {
        offset = 0
    }

    if (offset >= length) {
        // takes care of empty and invalid operations
        return INVALID_OPERATION
    }

    const remaining = length - offset

    if (count > remaining) {
        count = remaining
    }

    if (offset === 0 && count === length) {
        // takes care of insert open/close/embed
        return operation
    }

    if (isInsertText(operation)) {
        // takes care of insert text
        return setContent(operation.slice(0), getContent(operation).substr(offset, count))
    }

    // it must be retain or delete
    return setContent(operation.slice(0), count)
}

const canMerge = (operation1, operation2) => {
    const action = operation1[ACTION]

    if (action !== operation2[ACTION]) {
        return false
    }

    switch (action & ACTION_MASK) {
        case ACTION_INSERT:
            if ((action & INSERT_TYPE_MASK) !== ACTION_INSERT_TEXT)  {
                return false
            }
            // FALL THROUGH
        case ACTION_DELETE:
            const length = operation1.length

            if (operation2.length !== length) {
                return false
            }

            for (let i = VERSION; i < length; ++i) {
                if (operation1[i] !== operation2[i]) {
                    return false
                }
            }
            // FALL THROUGH
        case ACTION_RETAIN:
            return true

        default:
            return false
    }
}

const merge = (operation1, operation2) =>
    canMerge(operation1, operation2) ?
        setContent(operation1.slice(), getContent(operation1) + getContent(operation2)) :
        null

module.exports = {
    createInsertText,
    createInsertOpen,
    createInsertClose,
    createInsertEmbed,
    createRetain,
    createDelete,

    getContent,
    getVersion,
    getAuthor,

    setContent,
    setVersion,
    setAuthor,

    isInvalid,
    isDelete,
    isRetain,
    isInsert,

    isInsertText,
    isInsertOpen,
    isInsertClose,
    isInsertEmbed,

    getLength,
    slice,
    merge,

    INVALID_OPERATION
}
