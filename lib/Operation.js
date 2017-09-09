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

const ACTION_DELETE = 0
const ACTION_RETAIN = 1
const ACTION_INSERT_TEXT = 2
const ACTION_INSERT_OPEN = 3
const ACTION_INSERT_CLOSE = 4
const ACTION_INSERT_EMBED = 5

const MAX_INT = ((1 << 31) - 1) | 0

const appendAttributes = (operation, attributes) =>
    attributes ? operation.concat(attributes) : operation

const createInsert = (action) => (content, version, author, attributes) =>
    appendAttributes([ action, content || '', version || 0, author || '' ], attributes)

const createInsertText = createInsert(ACTION_INSERT_TEXT)
const createInsertOpen = createInsert(ACTION_INSERT_OPEN)
const createInsertClose = createInsert(ACTION_INSERT_CLOSE)
const createInsertEmbed = createInsert(ACTION_INSERT_EMBED)
const createRetain = (content, attributes) =>
    appendAttributes([ ACTION_RETAIN, content > 0 ? content : 0, 0, '' ], attributes)
const createDelete = (content) =>
    [ ACTION_DELETE, content > 0 ? content : 0, 0, '' ]

const getContent = (operation) => operation[CONTENT]
const getVersion = (operation) => operation[VERSION]
const getAuthor = (operation) => operation[AUTHOR]

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
        return isInsert(operation) ? setContent(operation.slice(), '') : setContent(operation.slice(), 0)
    }

    const length = getLength(operation)

    if (offset < 0) {
        offset = 0
    }

    if (offset >= length) {
        // takes care of empty operations
        return isInsert(operation) ? setContent(operation.slice(), '') : setContent(operation.slice(), 0)
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
        return setContent(operation.slice(), getContent(operation).substr(offset, count))
    } else {
        // it must be retain or delete
        return setContent(operation.slice(), count)
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
            for (let i = VERSION; i < length; ++i) {
                if (operation1[i] !== operation2[i]) {
                    return null
                }
            }
            return setContent(operation1.slice(), getContent(operation1) + getContent(operation2))

        default:
            return null
    }
}

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

    isDelete,
    isRetain,
    isInsert,

    isInsertText,
    isInsertOpen,
    isInsertClose,
    isInsertEmbed,

    getLength,
    slice,
    merge
}
