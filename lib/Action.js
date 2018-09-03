"use strict";

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
var TYPE = 0; // ACTION_INSERT_TEXT -> string, plain text
// ACTION_INSERT_(OPEN|CLOSE|EMBED) -> string, a node id and node name
// ACTION_(RETAIN|DELETE) -> number, number of characters to retain or delete

var CONTENT = 1; // ACTION_RETAIN
// ACTION_INSERT_.*

var ATTRIBUTES = 2; // Action types

var ACTION_DELETE = -1;
var ACTION_RETAIN = 0;
var ACTION_INSERT_TEXT = 1;
var ACTION_INSERT_OPEN = 2;
var ACTION_INSERT_CLOSE = 3;
var ACTION_INSERT_EMBED = 4;

var clone = function clone(action, skipAttributes) {
  var actionLength = action.length;
  var limit = skipAttributes && actionLength > ATTRIBUTES ? ATTRIBUTES : actionLength;
  var newAction = new Array(limit);

  for (var i = 0; i < limit; ++i) {
    newAction[i] = action[i];
  }

  return newAction;
};

var createInsert = function createInsert(type) {
  return function (content, attributes) {
    var actionIndex = ATTRIBUTES;
    var attributeIndex = 0;
    var attributesLength = attributes ? attributes.length : 0;
    var action = new Array(actionIndex + attributesLength);
    action[TYPE] = type;
    action[CONTENT] = content;

    while (attributeIndex < attributesLength) {
      action[actionIndex++] = attributes[attributeIndex++];
    }

    return action;
  };
};

var createInsertText = createInsert(ACTION_INSERT_TEXT);
var createInsertOpen = createInsert(ACTION_INSERT_OPEN);
var createInsertClose = createInsert(ACTION_INSERT_CLOSE);
var createInsertEmbed = createInsert(ACTION_INSERT_EMBED);

var createRetain = function createRetain(content, attributes) {
  var attributesLength = attributes ? attributes.length : 0;
  var action = new Array(2 + attributesLength);
  action[TYPE] = ACTION_RETAIN;
  action[CONTENT] = content;
  var actionIndex = 2;
  var attributeIndex = 0;

  while (attributeIndex < attributesLength) {
    action[actionIndex++] = attributes[attributeIndex++];
  }

  return action;
};

var createDelete = function createDelete(content) {
  return [ACTION_DELETE, content];
}; // Actions should normally be read-only, so this function is intended to be used only right after creating a new
// action before any other code can access it.


var setAttribute = function setAttribute(action, name, value) {
  var insertAt = ATTRIBUTES;
  var actionLength = action.length;

  while (insertAt < actionLength && action[insertAt] < name) {
    insertAt += 2;
  }

  if (insertAt === actionLength) {
    // add new attribute at the end
    action[insertAt] = name;
    action[insertAt + 1] = value;
    return action;
  }

  if (action[insertAt] === name) {
    // set an existing attribute
    action[insertAt + 1] = value;
    return action;
  } // insert a new attribute


  while (insertAt < actionLength) {
    var previousName = action[insertAt];
    var previousValue = action[insertAt + 1];
    action[insertAt++] = name;
    action[insertAt++] = value;
    name = previousName;
    value = previousValue;
  }

  action[insertAt++] = name;
  action[insertAt++] = value;
  return action;
};

var validateLength = function validateLength(action) {
  if (action.length !== ATTRIBUTES) {
    return new Error("action.length must be ".concat(ATTRIBUTES));
  }

  return null;
};

var validateMinLength = function validateMinLength(action) {
  if (action.length < ATTRIBUTES) {
    return new Error("action.length must be at least ".concat(ATTRIBUTES));
  }

  return null;
};

var validateContentNumber = function validateContentNumber(action) {
  var content = action[CONTENT];

  if (typeof content !== 'number' || content <= 0 || !isFinite(content) || Math.floor(content) !== content) {
    return new Error('content must be a positive integer');
  }

  return null;
};

var validateContentText = function validateContentText(action) {
  var content = action[CONTENT];

  if (typeof content !== 'string' || content === '') {
    return new Error('content must be a non-empty string');
  }

  return null;
};

var validateContentNode = function validateContentNode(action) {
  var content = action[CONTENT];

  if (typeof content !== 'string') {
    return new Error('content must be a string');
  }

  if (content.length < 2) {
    return new Error('content must contain a node ID and node name');
  }

  if (content[0] < "\uE000" || content[0] > "\uF8FF") {
    return new Error('node ID must be a character in the Private Use Area of the Unicode Basic Multilingual Plane');
  }

  return null;
};

var validateAttributes = function validateAttributes(action, allowNull) {
  var length = action.length;

  if (length - ATTRIBUTES & 1) {
    return new Error('missing value for the last attribute');
  }

  for (var i = ATTRIBUTES; i < length; i += 2) {
    var name = action[i];
    var value = action[i + 1];

    if (typeof name !== 'string') {
      return new Error('attribute name must be a string');
    }

    if (!(typeof value === 'string' || allowNull && value === null)) {
      return new Error("attribute value must be a string".concat(allowNull ? ' or null' : ''));
    }

    if (i > ATTRIBUTES && action[i - 2] >= name) {
      return new Error('duplicate or not sorted attribute');
    }
  }

  return null;
}; // Returns null, if the action is valid. Otherwise returns an error.


var validate = function validate(action) {
  if (!Array.isArray(action)) {
    return new Error('action must be an array');
  }

  switch (action[TYPE]) {
    case ACTION_DELETE:
      return validateLength(action) || validateContentNumber(action);

    case ACTION_RETAIN:
      return validateMinLength(action) || validateContentNumber(action) || validateAttributes(action, true);

    case ACTION_INSERT_TEXT:
      return validateMinLength(action) || validateContentText(action) || validateAttributes(action, false);

    case ACTION_INSERT_OPEN:
    case ACTION_INSERT_CLOSE:
    case ACTION_INSERT_EMBED:
      return validateMinLength(action) || validateContentNode(action) || validateAttributes(action, false);

    default:
      return new Error('unknown action type');
  }
};

var getCount = function getCount(action) {
  return action[CONTENT];
}; // for retain and delete


var getText = function getText(action) {
  return action[CONTENT];
}; // for insert text


var getNodeIdAndName = function getNodeIdAndName(action) {
  return action[CONTENT];
}; // for insert node


var getNodeId = function getNodeId(action) {
  return action[CONTENT][0];
}; // for insert node


var getNodeName = function getNodeName(action) {
  return action[CONTENT].substring(1);
}; // for insert node


var setContent = function setContent(action, content) {
  action[CONTENT] = content;
  return action;
}; // for retain, delete and insert text


var getAttributes = function getAttributes(action, attributeNames) {
  // for insert and retain
  if (attributeNames) {
    var i1 = ATTRIBUTES; // index for action

    var i2 = 0; // index for attributeNames

    var i3 = 0; // index for attributes

    var l1 = action.length;
    var l2 = attributeNames.length;
    var _attributes = [];

    while (i1 < l1 && i2 < l2) {
      if (action[i1] === attributeNames[i2]) {
        _attributes[i3++] = action[i1++];
        _attributes[i3++] = action[i1++];
        ++i2;
      } else if (action[i1] < attributeNames[i2]) {
        i1 += 2; // redundant attribute in action
      } else {
          ++i2; // missing attribute in action
        }
    }

    return _attributes;
  }

  var actionLength = action.length;
  var actionIndex = ATTRIBUTES;
  var attributes = new Array(actionLength - actionIndex);
  var attributesIndex = 0;

  while (actionIndex < actionLength) {
    attributes[attributesIndex++] = action[actionIndex++];
    attributes[attributesIndex++] = action[actionIndex++];
  }

  return attributes;
};

var getAttribute = function getAttribute(action, attributeName) {
  for (var i = ATTRIBUTES, l = action.length; i < l; i += 2) {
    if (action[i] < attributeName) {} else if (action[i] === attributeName) {
      return action[i + 1];
    } else {
      break;
    }
  }

  return undefined;
};

var isDelete = function isDelete(action) {
  return action[TYPE] === ACTION_DELETE;
};

var isRetain = function isRetain(action) {
  return action[TYPE] === ACTION_RETAIN;
};

var isInsert = function isInsert(action) {
  return ACTION_INSERT_TEXT <= action[TYPE] && action[TYPE] <= ACTION_INSERT_EMBED;
};

var isInsertText = function isInsertText(action) {
  return action[TYPE] === ACTION_INSERT_TEXT;
};

var isInsertOpen = function isInsertOpen(action) {
  return action[TYPE] === ACTION_INSERT_OPEN;
};

var isInsertClose = function isInsertClose(action) {
  return action[TYPE] === ACTION_INSERT_CLOSE;
};

var isInsertEmbed = function isInsertEmbed(action) {
  return action[TYPE] === ACTION_INSERT_EMBED;
};

var getAttributesIndex = function getAttributesIndex(action) {
  return ATTRIBUTES;
};

var hasAttributes = function hasAttributes(action) {
  return action.length > ATTRIBUTES;
};

var getLength = function getLength(action) {
  switch (action[TYPE]) {
    case ACTION_INSERT_TEXT:
      return action[CONTENT].length;

    case ACTION_INSERT_OPEN:
    case ACTION_INSERT_CLOSE:
    case ACTION_INSERT_EMBED:
      return 1;

    default:
      return action[CONTENT];
  }
};

var slice = function slice(action, offset, count, length) {
  if (offset === 0 && count === length) {
    // takes care of insert open/close/embed
    return action;
  } else if (isInsertText(action)) {
    // takes care of insert text
    return setContent(clone(action, false), action[CONTENT].substr(offset, count));
  } else {
    // it must be retain or delete
    return setContent(clone(action, false), count);
  }
};

var merge = function merge(action1, action2) {
  var length = action1.length;

  if (length !== action2.length) {
    return null;
  }

  var action = action1[TYPE];

  if (action !== action2[TYPE]) {
    return null;
  }

  switch (action) {
    case ACTION_INSERT_TEXT:
    case ACTION_DELETE:
    case ACTION_RETAIN:
      for (var i = CONTENT + 1; i < length; ++i) {
        if (action1[i] !== action2[i]) {
          return null;
        }
      }

      return setContent(clone(action1, false), action1[CONTENT] + action2[CONTENT]);

    default:
      return null;
  }
};

var areEqual = function areEqual(action1, action2) {
  var length = action1.length;

  if (action2.length !== length) {
    return false;
  }

  for (var i = 0; i < length; ++i) {
    if (action1[i] !== action2[i]) {
      return false;
    }
  }

  return true;
};

var areTypesEqual = function areTypesEqual(action1, action2) {
  return action1[TYPE] === action2[TYPE];
};

var areAttributesEqual = function areAttributesEqual(action1, action2) {
  var i1 = ATTRIBUTES;
  var i2 = ATTRIBUTES;
  var length = action1.length;

  if (length - i1 !== action2.length - i2) {
    return false;
  }

  while (i1 < length) {
    if (action1[i1++] !== action2[i2++]) {
      return false;
    }
  }

  return true;
}; // Composes up to 2 actions tracked by the iterators.
// Advances the iterators past the composed actions.
// Returns a new action, or null, if the iterators have been exhausted.


var composeIterators = function composeIterators(iterator1, iterator2) {
  do {
    var action1 = iterator1.action;
    var action2 = iterator2.action;

    if (action1 === null) {
      if (action2 === null) {
        return null;
      }

      var _length = getLength(action2);

      var offset = iterator2.offset;
      var remaining = _length - offset;
      iterator2.next(remaining);
      return slice(action2, offset, remaining, _length);
    }

    if (action2 === null) {
      var _length2 = getLength(action1);

      var _offset = iterator1.offset;

      var _remaining = _length2 - _offset;

      iterator1.next(_remaining);
      return slice(action1, _offset, _remaining, _length2);
    }

    if (isInsert(action2)) {
      var _length3 = getLength(action2);

      var _offset2 = iterator2.offset;

      var _remaining2 = _length3 - _offset2;

      iterator2.next(_remaining2);
      return slice(action2, _offset2, _remaining2, _length3);
    }

    if (isDelete(action1)) {
      var _length4 = getLength(action1);

      var _offset3 = iterator1.offset;

      var _remaining3 = _length4 - _offset3;

      iterator1.next(_remaining3);
      return slice(action1, _offset3, _remaining3, _length4);
    }

    var length1 = getLength(action1);
    var length2 = getLength(action2);
    var offset1 = iterator1.offset;
    var offset2 = iterator2.offset;
    var remaining1 = length1 - offset1;
    var remaining2 = length2 - offset2;
    var length = remaining1 < remaining2 ? remaining1 : remaining2;
    iterator1.next(length);
    iterator2.next(length);

    if (isRetain(action2)) {
      // `action1` must be INSERT or RETAIN
      if (action2.length <= ATTRIBUTES || areAttributesEqual(action1, action2)) {
        // no attribute changes
        return slice(action1, offset1, length, length1);
      }

      var newAction = clone(action1, true);

      if (isRetain(newAction)) {
        newAction[CONTENT] = length;
      } else if (isInsertText(newAction)) {
        newAction[CONTENT] = newAction[CONTENT].substr(offset1, length);
      }

      var keepNull = isRetain(action1);
      var i1 = newAction.length; // attribute index in action1

      var i2 = ATTRIBUTES; // attribute index in action2

      var i3 = newAction.length; // attribute index in newAction

      var l1 = action1.length;
      var l2 = action2.length; // compose the attributes

      while (i1 < l1 && i2 < l2) {
        if (action1[i1] === action2[i2]) {
          // the same attribute name in both actions
          i1 += 2;

          if (action2[i2 + 1] !== null || keepNull) {
            newAction[i3++] = action2[i2++];
            newAction[i3++] = action2[i2++];
          } else {
            i2 += 2;
          }
        } else if (action1[i1] < action2[i2]) {
          // an attribute from action1 is not present in action2
          if (action1[i1 + 1] !== null || keepNull) {
            newAction[i3++] = action1[i1++];
            newAction[i3++] = action1[i1++];
          } else {
            i1 += 2;
          }
        } else {
          // an attribute from action2 is not present in action1
          if (action2[i2 + 1] !== null || keepNull) {
            newAction[i3++] = action2[i2++];
            newAction[i3++] = action2[i2++];
          } else {
            i2 += 2;
          }
        }
      }

      while (i2 < l2) {
        // only action2 attributes left
        if (action2[i2 + 1] !== null || keepNull) {
          newAction[i3++] = action2[i2++];
          newAction[i3++] = action2[i2++];
        } else {
          i2 += 2;
        }
      }

      while (i1 < l1) {
        // only action1 attributes left
        if (action1[i1 + 1] !== null || keepNull) {
          newAction[i3++] = action1[i1++];
          newAction[i3++] = action1[i1++];
        } else {
          i1 += 2;
        }
      }

      return newAction;
    }

    if (isDelete(action2) && isRetain(action1)) {
      return slice(action2, offset2, length, length2);
    } // `action2` must be DELETE and `action1` must be INSERT, so they
    // cancel each other out and we can move on the the next action.

  } while (true);
}; // Transforms up to 2 actions tracked by the iterators.
// Advances the iterators past the transformed actions.
// Returns a new action, or null, if iterator1 has been exhausted.


var transformIterators = function transformIterators(iterator1, iterator2, action1HasPriority) {
  do {
    var action1 = iterator1.action;
    var action2 = iterator2.action;

    if (action1 === null) {
      return null;
    }

    if (action2 === null) {
      var _length5 = getLength(action1);

      var offset = iterator1.offset;
      var remaining = _length5 - offset;
      iterator1.next(remaining);
      return slice(action1, offset, remaining, _length5);
    }

    if (action1HasPriority && isInsert(action1)) {
      var _length6 = getLength(action1);

      var _offset4 = iterator1.offset;

      var _remaining4 = _length6 - _offset4;

      iterator1.next(_remaining4);
      return slice(action1, _offset4, _remaining4, _length6);
    }

    if (isInsert(action2)) {
      var _remaining5 = getLength(action2) - iterator2.offset;

      iterator2.next(_remaining5);
      return createRetain(_remaining5);
    }

    if (isInsert(action1)) {
      var _length7 = getLength(action1);

      var _offset5 = iterator1.offset;

      var _remaining6 = _length7 - _offset5;

      iterator1.next(_remaining6);
      return slice(action1, _offset5, _remaining6, _length7);
    }

    var length1 = getLength(action1);
    var length2 = getLength(action2);
    var offset1 = iterator1.offset;
    var offset2 = iterator2.offset;
    var remaining1 = length1 - offset1;
    var remaining2 = length2 - offset2;
    var length = remaining1 < remaining2 ? remaining1 : remaining2;
    iterator1.next(length);
    iterator2.next(length);

    if (isDelete(action2)) {
      // action1 must be retain or delete - either way it's redundant
      continue;
    }

    if (isDelete(action1)) {
      return slice(action1, offset1, length, length1);
    } // action1 and action2 must be retain


    if (action1HasPriority) {
      return slice(action1, offset1, length, length1);
    }

    var newAction = createRetain(length);
    var i1 = ATTRIBUTES; // action1 attribute index

    var i2 = ATTRIBUTES; // action2 attribute index

    var i3 = ATTRIBUTES; // newAction attribute index

    var l1 = action1.length;
    var l2 = action2.length;

    while (i1 < l1) {
      if (i2 >= l2) {
        // no more attributes in action2
        newAction[i3++] = action1[i1++];
        newAction[i3++] = action1[i1++];
      } else if (action1[i1] === action2[i2]) {
        // attribute already set in action2, which has priority
        i1 += 2;
        i2 += 2;
      } else if (action1[i1] < action2[i2]) {
        // attribute from action1 is not present in action2
        newAction[i3++] = action1[i1++];
        newAction[i3++] = action1[i1++];
      } else {
        // attribute from action2 is not present in action1
        i2 += 2;
      }
    }

    return newAction;
  } while (true);
}; // Computes the difference between the 2 iterators based on the hints provided by the
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


var diffIterators = function diffIterators(iterator1, iterator2, diffType, diffContent, delta1Callback, delta2Callback) {
  var diffLength = diffContent.length;

  switch (diffType) {
    case 0:
      // `diffContent` present in both iterator1 and iterator2
      var pendingRetain = 0;

      while (diffLength > 0) {
        var action1 = iterator1.operation[iterator1.index];
        var length1 = getLength(action1);
        var offset1 = iterator1.offset;
        var remaining1 = length1 - offset1;
        var action2 = iterator2.operation[iterator2.index];
        var length2 = getLength(action2);
        var offset2 = iterator2.offset;
        var remaining2 = length2 - offset2;
        var length = diffLength <= remaining1 && diffLength <= remaining2 ? diffLength : remaining1 <= diffLength && remaining1 <= remaining2 ? remaining1 : remaining2;
        diffLength -= length;
        iterator1.next(length);
        iterator2.next(length);

        if (action1[TYPE] === action2[TYPE] && (isInsertText(action1) ? action1[CONTENT].substr(offset1, length) === action2[CONTENT].substr(offset2, length) : action1[CONTENT] === action2[CONTENT])) {
          if (areAttributesEqual(action1, action2)) {
            // This is the most common case in practice,
            // so it must be optimized as much as possible.
            pendingRetain += length;
          } else {
            if (pendingRetain > 0) {
              var deltaRetain = createRetain(pendingRetain);
              delta1Callback(deltaRetain);
              delta2Callback(deltaRetain);
              pendingRetain = 0;
            }

            var retain1 = createRetain(length);
            var retain2 = createRetain(length);
            var i1 = ATTRIBUTES; // attribute index for action1

            var i2 = ATTRIBUTES; // attribute index for action2

            var i3 = ATTRIBUTES; // attribute index for retain1

            var i4 = ATTRIBUTES; // attribute index for retain2

            var l1 = action1.length;
            var l2 = action2.length;

            while (i1 < l1 && i2 < l2) {
              if (action1[i1] === action2[i2]) {
                // the same name
                if (action1[i1 + 1] === action2[i2 + 1]) {
                  // the same value
                  i1 += 2;
                  i2 += 2;
                } else {
                  // different values
                  retain1[i3++] = action1[i1++];
                  retain1[i3++] = action1[i1++];
                  retain2[i4++] = action2[i2++];
                  retain2[i4++] = action2[i2++];
                }
              } else if (action1[i1] < action2[i2]) {
                // attribute only in action1
                var name = action1[i1++];
                var value = action1[i1++];
                retain1[i3++] = name;
                retain1[i3++] = value;
                retain2[i4++] = name;
                retain2[i4++] = null;
              } else {
                // attribute only in action2
                var _name = action2[i2++];
                var _value = action2[i2++];
                retain1[i3++] = _name;
                retain1[i3++] = null;
                retain2[i4++] = _name;
                retain2[i4++] = _value;
              }
            }

            while (i2 < l2) {
              // only action2 attributes left
              var _name2 = action2[i2++];
              var _value2 = action2[i2++];
              retain1[i3++] = _name2;
              retain1[i3++] = null;
              retain2[i4++] = _name2;
              retain2[i4++] = _value2;
            }

            while (i1 < l1) {
              // only action1 attributes left
              var _name3 = action1[i1++];
              var _value3 = action1[i1++];
              retain1[i3++] = _name3;
              retain1[i3++] = _value3;
              retain2[i4++] = _name3;
              retain2[i4++] = null;
            }

            delta1Callback(retain1);
            delta2Callback(retain2);
          }
        } else {
          if (pendingRetain > 0) {
            var _deltaRetain = createRetain(pendingRetain);

            delta1Callback(_deltaRetain);
            delta2Callback(_deltaRetain);
            pendingRetain = 0;
          }

          var deltaDelete = createDelete(length);
          delta1Callback(slice(action1, offset1, length, length1));
          delta1Callback(deltaDelete);
          delta2Callback(slice(action2, offset2, length, length2));
          delta2Callback(deltaDelete);
        }
      }

      if (pendingRetain > 0) {
        var _deltaRetain2 = createRetain(pendingRetain);

        delta1Callback(_deltaRetain2);
        delta2Callback(_deltaRetain2);
        pendingRetain = 0;
      }

      break;

    case 1:
      // `diffContent` present only in iterator2
      delta1Callback(createDelete(diffLength));

      while (diffLength > 0) {
        var _action = iterator2.operation[iterator2.index];

        var _length8 = getLength(_action);

        var _offset6 = iterator2.offset;

        var _remaining7 = _length8 - _offset6;

        var _length9 = diffLength <= _remaining7 ? diffLength : _remaining7;

        diffLength -= _length9;
        iterator2.next(_length9);
        delta2Callback(slice(_action, _offset6, _length9, _length8));
      }

      break;

    case -1:
      // `diffContent` present only in iterator1
      delta2Callback(createDelete(diffLength));

      while (diffLength > 0) {
        var _action2 = iterator1.operation[iterator1.index];

        var _length10 = getLength(_action2);

        var _offset7 = iterator1.offset;

        var _remaining8 = _length10 - _offset7;

        var _length11 = diffLength <= _remaining8 ? diffLength : _remaining8;

        diffLength -= _length11;
        iterator1.next(_length11);
        delta1Callback(slice(_action2, _offset7, _length11, _length10));
      }

      break;
  }
};

module.exports = {
  createInsertText: createInsertText,
  createInsertOpen: createInsertOpen,
  createInsertClose: createInsertClose,
  createInsertEmbed: createInsertEmbed,
  createRetain: createRetain,
  createDelete: createDelete,
  clone: clone,
  setAttribute: setAttribute,
  validate: validate,
  getCount: getCount,
  getText: getText,
  getNodeId: getNodeId,
  getNodeName: getNodeName,
  getNodeIdAndName: getNodeIdAndName,
  getAttributes: getAttributes,
  getAttribute: getAttribute,
  isDelete: isDelete,
  isRetain: isRetain,
  isInsert: isInsert,
  isInsertText: isInsertText,
  isInsertOpen: isInsertOpen,
  isInsertClose: isInsertClose,
  isInsertEmbed: isInsertEmbed,
  areEqual: areEqual,
  areTypesEqual: areTypesEqual,
  areAttributesEqual: areAttributesEqual,
  getAttributesIndex: getAttributesIndex,
  hasAttributes: hasAttributes,
  getLength: getLength,
  slice: slice,
  merge: merge,
  composeIterators: composeIterators,
  transformIterators: transformIterators,
  diffIterators: diffIterators
};