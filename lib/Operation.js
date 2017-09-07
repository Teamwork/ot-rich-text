// Each operation is represented by an array.
// The constants below determine what data can be found at each array index.
//
// The attributes are appended to the operation array.
// Each attribute occupies 2 indexes. The first is the attribute name and the second is the attribute value.
// The attributes must be sorted in the ascending order by the attribute name.
// Attribute names and values must both be strings, except for operations (as oposed to document snapshots),
// where the attibute value may be `null`, which is interpreted as an instruction to remove the attribute,
// when the operation is applied.

module.exports = {
    // One of ACTION_*
    ACTION: 0,
    // ACTION_INSERT_TEXT -> string, plain text
    // ACTION_INSERT_OBJECT -> string, 1 character in the Unicode Private Use Area followed by tag name in upper case
    // ACTION_RETAIN -> number, number of characters to retain
    // ACTION_DELETE -> number, number of characters to delete
    CONTENT: 1,
    VERSION: 2, // number, document version in which the operation was introduced
    AUTHOR: 3, // string, userId
    ATTRIBUTES: 4, // This is the index of the first attribute's name.

    ACTION_DELETE: 0,
    ACTION_RETAIN: 1,
    ACTION_INSERT_TEXT: 2,
    ACTION_INSERT_OBJECT: 3
}
