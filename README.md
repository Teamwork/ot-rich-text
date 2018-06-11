# ot-rich-text

[![npm version](https://badge.fury.io/js/%40teamwork%2Fot-rich-text.svg)](https://badge.fury.io/js/%40teamwork%2Fot-rich-text)
[![Build Status](https://travis-ci.com/Teamwork/ot-rich-text.svg?branch=master)](https://travis-ci.com/Teamwork/ot-rich-text)
[![Coverage Status](https://coveralls.io/repos/github/Teamwork/ot-rich-text/badge.svg?branch=master)](https://coveralls.io/github/Teamwork/ot-rich-text?branch=master)

A format for representing rich-text document Snapshots and Operations for use with [ShareDB](https://github.com/share/sharedb). This library implements the [ot type spec](https://github.com/ottypes/docs). It has been heavily inspired by [rich-text](https://github.com/ottypes/rich-text) and [quill-delta](https://github.com/quilljs/delta).

OT Rich Text does not implement the optional `invert` function, because it does not keep track of the deleted content - it only knows how many characters to remove from a specific position. For implementing undo/redo you can use the `diffX` function, which generates 2 Operations, which allow moving back and forth between 2 Snapshots.


## Snapshots

A Snapshot specifies the document's content at a particular version. It is represented as an Operation consisting exclusively of insert Actions.


## Operations

An Operation is an Array of Actions, each Action describing a singular change to a Snapshot. Actions can be an insert (text, open node, close node, embed node), delete or retain. Note Actions do not take an index - they always describe the change at the current index. Use retains to "keep" or "skip" certain parts of the Snapshot.

For performance reasons, each Action is represented as an Array. The first element is always an Action type and the rest depend on the Action type.


### Attributes

The insert and retain Actions can contain optional attributes. For performance reasons, the attribute names and values are appended to the Action array without any wrappers, must be sorted by the attribute name and there must not be any duplicate attribute names in any Action.

The attribute names must be string. The attribute values for insert must be string. The attribute values for retain must be string (interpreted as an instruction to change the attribute value) or null (interpreted as an instruction to remove the attribute).


### Insert Action

An insert Action is an instruction to add certain text or node at the current position, with optional attributes. The attributes can be subsequently modified using the retain Action.

#### Insert Text Action

- `0 (ACTION_TYPE)`: 1 - the insert text Action type
- `1 (CONTENT)`: a non-empty string - the text to insert
- `2 (ATTRIBUTE_0_NAME)`: a string - the name of attribute 0
- `3 (ATTRIBUTE_0_VALUE)`: a string - the value of attribute 0
- `4 (ATTRIBUTE_1_NAME)`: a string - the name of attribute 1
- `5 (ATTRIBUTE_1_VALUE)`: a string - the value of attribute 1
- ...
- `2 + (N * 2) (ATTRIBUTE_N_NAME)`: a string - the name of attribute N
- `3 + (N * 2) (ATTRIBUTE_N_VALUE)`: a string - the value of attribute N


#### Insert Open Node / Close Node / Embed Node Action

- `0 (ACTION_TYPE)`: 2 / 3 / 4 - the insert open/close/embed node Action
- `1 (CONTENT)`: a string - a node ID and name. The first characters is the node ID, the rest are node name. Node ID must be a single character in the Private Use Area in the Unicode Basic Multilingual Plane.
- `2 (ATTRIBUTE_0_NAME)`: a string - the name of attribute 0
- `3 (ATTRIBUTE_0_VALUE)`: a string - the value of attribute 0
- `4 (ATTRIBUTE_1_NAME)`: a string - the name of attribute 1
- `5 (ATTRIBUTE_1_VALUE)`: a string - the value of attribute 1
- ...
- `2 + (N * 2) (ATTRIBUTE_N_NAME)`: a string - the name of attribute N
- `3 + (N * 2) (ATTRIBUTE_N_VALUE)`: a string - the value of attribute N


### Delete Action

A delete Action is an instruction to delete a specified number of characters at the current position. The original characters come from the insert Action. Insert open/close/embed node Actions are tread as 1-character strings.

- `0 (ACTION_TYPE)`: -1 - the delete Action type
- `1 (CONTENT)`: a positive integer - the number of characters to delete


### Retain Action

A retain Action is an instruction to keep a specified number of characters. The original characters come from the insert Actions. Attributes can also be specified to update the attributes for the kept content. Insert open/close/embed node Actions are tread as 1-character strings.

*Note: It is not necessary to retain the last characters of a Snapshot as this is implied.*

- `0 (ACTION_TYPE)`: 0 - the retain Action type
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
[2, '\uE000P']

// insert plain text
[ 1, 'Hello ' ]

// insert bold text
[ 1, 'World', 'STRONG', '' ]

// insert an image
[ 4, '\uE001IMG', 'alt', 'An image', 'src', 'http://www.example.com/image.jpg' ]

// insert a close node
[ 3, '\uE000P' ]

// delete 5 characters
[ -1, 5 ]

// retain 8 characters
[ 0, 8 ]

// retain 2 characters and set an attribute
[ 0, 2, 'EM', '' ]

// retain 2 characters and remove an attribute
[ 0, 2, 'EM', null ]
```


## Presence

Presence consists of a user ID (`u`), a number changes performed by the user (`c`) and a list of 0 or more selections (`s`). Each selection is a 2-element array containing the selection start index and the selection end index. For example:

```
{
    u: '123', // user ID
    c: 8,
    s: [ // list of selections
        [ 1, 1 ], // collapsed selection
        [ 5, 7 ], // forward selection
        [ 9, 4 ] // backward selection
    ]
}
```

When presence is transformed against an operation, the `u` and `c` properties are preserved and all selections are adjusted, if needed. For example, if a character is inserted before a selection, the selection is incremented by 1.
