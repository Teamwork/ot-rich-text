// Each operation is represented by an array.
// The constants below determine what data can be found at each array index.
//
// The attributes are appended to the operation array.
// Each attribute occupies 2 indexes. The first is the attribute name and the second is the attribute value.
// The attributes must be sorted in the ascending order by the attribute name.
// Attribute names and values must both be strings, except for operations (as oposed to document snapshots),
// where the attibute value may be `null`, which is interpreted as an instruction to remove the attribute,
// when the operation is applied.

// One of ACTION_*
const ACTION = 0
// ACTION_INSERT_TEXT -> string, plain text
// ACTION_INSERT_OBJECT -> string, 1 character in the Unicode Private Use Area followed by tag name in upper case
// ACTION_RETAIN -> number, number of characters to retain
// ACTION_DELETE -> number, number of characters to delete
const CONTENT = 1
const VERSION = 2 // number, document version in which the operation was introduced
const AUTHOR = 3 // string, userId
const ATTRIBUTES = 4 // This is the index of the first attribute's name.

const ACTION_DELETE = 0
const ACTION_RETAIN = 1
const ACTION_INSERT_TEXT = 2
const ACTION_INSERT_OBJECT = 3

module.exports = {
    ACTION, CONTENT, VERSION, AUTHOR, ATTRIBUTES,
    ACTION_DELETE, ACTION_RETAIN, ACTION_INSERT_TEXT, ACTION_INSERT_OBJECT,

    createInsertText(content = '', version = 0, author = '') { return [ ACTION_INSERT_TEXT, content, version, author ] },
    createInsertObject(content = '', version = 0, author = '') { return [ ACTION_INSERT_OBJECT, content, version, author ] },
    createRetain(content = 0, version = 0, author = '') { return [ ACTION_RETAIN, content, version, author ] },
    createDelete(content = 0, version = 0, author = '') { return [ ACTION_DELETE, content, version, author ] },
    getAction(operation) { return operation[ACTION] },
    getContent(operation) { return operation[CONTENT] },
    getVersion(operation) { return operation[VERSION] },
    getAuthor(operation) { return operation[AUTHOR] },
    isDelete(operation) { return operation[ACTION] === ACTION_DELETE },
    isRetain(operation) { return operation[ACTION] === ACTION_RETAIN },
    isInsert(operation) { return operation[ACTION] === ACTION_INSERT_TEXT || operation[ACTION] === ACTION_INSERT_OBJECT },
    isInsertText(operation) { return operation[ACTION] === ACTION_INSERT_TEXT },
    isInsertObject(operation) { return operation[ACTION] === ACTION_INSERT_OBJECT }
}
