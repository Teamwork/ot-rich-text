# ot-rich-text

A format for representing rich-text documents and changes for use with [ShareDB](https://github.com/share/sharedb). This library implements the [ot type spec](https://github.com/ottypes/docs). It has been heavily inspired by [rich-text](https://github.com/ottypes/rich-text) and [quill-delta](https://github.com/quilljs/delta).

OT Rich Text does not implement the optional `invert` function, because it does not keep track of the deleted content - it only knows how many characters to remove from a specific position. For implementing undo/redo you can use the `diffX` function, which generates 2 deltas, which allow moving back and forth between 2 snapshots.


## Operations

Operations are an Array of changes, each operation describing a singular change to a document. They can be an insert (text, open node, close node, embed node), delete or retain. Note operations do not take an index. They always describe the change at the current index. Use retains to "keep" or "skip" certain parts of the document.

For performance reasons, each operation is represented as an Array. The first element is always an action code and the rest depend on the specific action code.


### Attributes

The insert and retain operations can contain optional attributes. For performance reasons, the attribute names and values are appended to the operation array without any wrappers, must be sorted by the attribute name and there must not be any duplicate attribute names in any operation.

The attribute names must be string. The attribute values for insert must be string. The attribute values for retain must be string (interpreted as an instruction to change the attribute value) or null (interpreted as an instruction to remove the attribute).


### Insert Operation

An insert operation is an instruction to add certain text or node at the current position, with optional attributes. The attributes can be subsequently modified using the retain operation.

#### Insert (Text / Open Node / Close Node / Embed Node) Operation

- `0 (ACTION)`: 1, 2, 3, 4 - a code for insert text, open node, close node and embed node operations respectively
- `1 (CONTENT)`: a non-empty string - the text to insert or the node name
- `2 (VERSION)`: a non-negative integer - the version number at which the change was introduced
- `3 (AUTHOR)`: a string - the ID of the user who introduced the change
- `4 (ATTRIBUTE_0_NAME)`: a string - the name of attribute 0
- `5 (ATTRIBUTE_0_VALUE)`: a string - the value of attribute 0
- `6 (ATTRIBUTE_1_NAME)`: a string - the name of attribute 1
- `7 (ATTRIBUTE_1_VALUE)`: a string - the value of attribute 1
- ...
- `4 + (N * 2) (ATTRIBUTE_N_NAME)`: a string - the name of attribute N
- `5 + (N * 2) (ATTRIBUTE_N_VALUE)`: a string - the value of attribute N


### Delete Operation

A delete operation is an instruction to delete a specified number of characters at the current position. The original characters come from the insert operations. Insert open/close/embed node operations are tread as 1-character strings.

- `0 (ACTION)`: -1 - a code for the delete operation
- `1 (CONTENT)`: a positive integer - the number of characters to delete


### Retain Operation

A retain operation is an instruction to keep a specified number of characters. The original characters come from the insert operations. Attributes can also be specified to update the attributes for the kept content. Insert open/close/embed node operations are tread as 1-character strings.

*Note: It is not necessary to retain the last characters of a document as this is implied.*

- `0 (ACTION)`: 0 - a code for retain operation
- `1 (CONTENT)`: a positive integer - the number of characters to keep
- `2 (ATTRIBUTE_0_NAME)`: a string - the name of attribute 0
- `3 (ATTRIBUTE_0_VALUE)`: a string or null - the value of attribute 0
- `4 (ATTRIBUTE_1_NAME)`: a string - the name of attribute 1
- `5 (ATTRIBUTE_1_VALUE)`: a string or null - the value of attribute 1
- ...
- `2 + (N * 2) (ATTRIBUTE_N_NAME)`: a string - the name of attribute N
- `3 + (N * 2) (ATTRIBUTE_N_VALUE)`: a string or null - the value of attribute N


### Examples

```
// insert an open node
[2, 'P', 12, 'jo7766']

// insert plain text
[ 1, 'Hello ', 1, 'john1234' ]

// insert bold text
[ 1, 'World', 1, 'john1234', 'STRONG', '' ]

// insert an image
[ 4, 'IMG', 44, 'mary9876', 'alt', 'An image', 'src', 'http://www.example.com/image.jpg' ]

// insert a close node
[3, 'P', 12, 'jo7766']

// delete 5 characters
[ -1, 5 ]

// retain 8 characters
[ 0, 8 ]

// retain 2 characters and set an attribute
[ 0, 2, 'EM', '' ]

// retain 2 characters and remove an attribute
[ 0, 2, 'EM', null ]
```
