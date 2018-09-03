"use strict";

var fastDiff = require('fast-diff');

var Iterator = require('./Iterator');

var _require = require('./Action'),
    createRetain = _require.createRetain,
    isInsert = _require.isInsert,
    isInsertText = _require.isInsertText,
    isRetain = _require.isRetain,
    isDelete = _require.isDelete,
    getLength = _require.getLength,
    hasAttributes = _require.hasAttributes,
    getText = _require.getText,
    getNodeId = _require.getNodeId,
    areEqual = _require.areEqual,
    areTypesEqual = _require.areTypesEqual,
    merge = _require.merge,
    composeIterators = _require.composeIterators,
    transformIterators = _require.transformIterators,
    diffIterators = _require.diffIterators,
    validateAction = _require.validate;

function create(actions) {
  return Array.isArray(actions) ? actions : [];
}

function isNoop(operation) {
  return operation.length === 0;
} // Compose op1 and op2 to produce a new operation.
// The new operation must subsume the behaviour of op1 and op2.
// Specifically, apply(apply(snapshot, op1), op2) == apply(snapshot, compose(op1, op2)).
// Note: transforming by a composed operation is NOT guaranteed to produce the same result as transforming by each operation in order.


function compose(operation1, operation2) {
  var iterator1 = new Iterator(operation1);
  var iterator2 = new Iterator(operation2);
  var newOperation = [];
  var action = composeIterators(iterator1, iterator2);

  while (action !== null) {
    append(newOperation, action);
    action = composeIterators(iterator1, iterator2);
  }

  return chop(newOperation);
} // Composes 2 operations but only if the "shape" of the new operation is the
// same as the "shape" of operation1.


function composeSimilar(operation1, operation2) {
  var newOperation = compose(operation1, operation2);
  var index = 0;
  var length = operation1.length;
  var newIndex = 0;
  var newLength = newOperation.length; // Skip leading "retain" actions

  while (index < length && isRetain(operation1[index])) {
    ++index;
  }

  while (newIndex < newLength && isRetain(newOperation[newIndex])) {
    ++newIndex;
  } // Operations are not similar, if they have a different number of actions
  // following the leading retain actions.


  if (length - index !== newLength - newIndex) {
    return null;
  } // Operations are not similar, if they have differnt action types
  // following the leading retain actions.


  while (index < length) {
    if (!areTypesEqual(operation1[index++], newOperation[newIndex++])) {
      return null;
    }
  }

  return newOperation;
} // Apply an operation to a snapshot to produce a new snapshot.


function apply(snapshot, operation) {
  var iterator1 = new Iterator(snapshot);
  var iterator2 = new Iterator(operation);
  var newSnapshot = [];
  var action = composeIterators(iterator1, iterator2);

  while (action !== null && isInsert(action)) {
    append(newSnapshot, action);
    action = composeIterators(iterator1, iterator2);
  }

  return newSnapshot;
} // Apply an operation to a snapshot to produce a new snapshot and
// an inverted operation.


function applyAndInvert(snapshot, operation) {
  var editingPosition = !isNoop(operation) && isRetain(operation[0]) ? getLength(operation[0]) : 0;
  var newSnapshot = apply(snapshot, operation);
  var diffs = diffX(snapshot, newSnapshot, editingPosition);
  var invertedOperation = diffs[0];
  return [newSnapshot, invertedOperation];
} // Transform op1 by op2. Return the new op1.
// Side is either 'left' or 'right'. It exists to break ties,
// for example if two operations insert at the same position in a string.
// If side === 'left', operation1 is considered to happen "first".
// Both op1 and op2 must not be modified by transform.
// Transform must conform to Transform Property 1. That is,
// apply(apply(snapshot, op1), transform(op2, op1, 'left')) == apply(apply(snapshot, op2), transform(op1, op2, 'right')).


function transform(operation1, operation2, side) {
  var operation1HasPriority = side === 'left';
  var iterator1 = new Iterator(operation1);
  var iterator2 = new Iterator(operation2);
  var newOperation = [];
  var action = transformIterators(iterator1, iterator2, operation1HasPriority);

  while (action !== null) {
    append(newOperation, action);
    action = transformIterators(iterator1, iterator2, operation1HasPriority);
  }

  return chop(newOperation);
} // Transform the specified cursor position by the provided operation.
// If isOwnOperation is true, this function returns the final editing position of the provided operation.
// If isOwnOperation is false, the cursor position moves with the content to its immediate left.


function transformCursor(cursor, operation, isOwnOperation) {
  cursor = cursor | 0;
  isOwnOperation = !!isOwnOperation;
  var iterator = new Iterator(operation);
  var offset = 0;
  var action = iterator.action;

  while (action !== null && offset <= cursor) {
    var length = getLength(action);

    if (isDelete(action)) {
      if (length < cursor - offset) {
        cursor -= length;
      } else {
        cursor = offset;
      }
    } else if (isInsert(action) && (offset < cursor || isOwnOperation)) {
      cursor += length;
      offset += length;
    } else {
      offset += length;
    }

    iterator.next(length);
    action = iterator.action;
  }

  return cursor;
} // Appends `action` to `operation`.


function append(operation, action) {
  var length = getLength(action);

  if (length === 0) {
    // takes care of invalid and empty actions
    return operation;
  }

  var operationLength = operation.length;

  if (operationLength === 0) {
    operation[operationLength] = action;
  } else {
    var lastIndex = operationLength - 1;
    var lastAction = operation[lastIndex]; // It doesn't matter, if we insert or delete first at the same index,
    // so we consistently insert first,
    // so that we have more opportunities for merging actions.

    if (isDelete(lastAction) && isInsert(action)) {
      if (operationLength === 1) {
        operation[0] = action;
        operation[operationLength] = lastAction;
      } else {
        var lastButOneIndex = lastIndex - 1;
        var lastButOneAction = operation[lastButOneIndex];
        var mergedAction = merge(lastButOneAction, action);

        if (mergedAction !== null) {
          operation[lastButOneIndex] = mergedAction;
        } else {
          operation[lastIndex] = action;
          operation[operationLength] = lastAction;
        }
      }
    } else {
      var _mergedAction = merge(lastAction, action);

      if (_mergedAction !== null) {
        operation[lastIndex] = _mergedAction;
      } else {
        operation[operationLength] = action;
      }
    }
  }

  return operation;
} // Remove trailing retain, if it does not have attributes.


function chop(operation) {
  var operationLength = operation.length;

  if (operationLength > 0) {
    var lastIndex = operationLength - 1;
    var action = operation[lastIndex];

    if (isRetain(action) && !hasAttributes(action)) {
      operation.length = lastIndex;
    }
  }

  return operation;
} // Returns null, if the `operation` is valid. Otherwise returns an error.


function validate(operation) {
  if (!Array.isArray(operation)) {
    return new Error('operation must be an array');
  }

  for (var i = 0, l = operation.length; i < l; ++i) {
    var error = validateAction(operation[i]);

    if (error !== null) {
      return new Error("Invalid action at index ".concat(i, ": ").concat(error.message));
    }
  }

  return null;
} // The operations this library produces are already normalized, so no modifications
// are needed, however, we do take the opportunity to check that the operation is valid
// and throw an Error, if it isn't.


function normalize(operation) {
  var error = validate(operation);

  if (error !== null) {
    throw error;
  }

  return operation;
} // Returns a 2 element array, where each element is an operation representing
// a difference between `snapshot1` and `snapshot2`.
// `editLocation` is optional and provides a hint to the diffing algorithm,
// so that it can return the expected diff out of the set of valid diffs.
// The first operation converts `snapshot2` to `snapshot1`, when applied.
// The second operation converts `snapshot1` to `snapshot2`, when applied.


function diffX(snapshot1, snapshot2, editLocation) {
  editLocation = editLocation | 0;
  var result1 = [];
  var result2 = [];

  if (snapshot1 === snapshot2) {
    return [result1, result2];
  }

  var startIndex1 = 0;
  var startIndex2 = 0;
  var endIndex1 = snapshot1.length - 1;
  var endIndex2 = snapshot2.length - 1;
  var commonPrefixLength = 0;
  var differingContent1 = '';
  var differingContent2 = ''; // calculate common prefix length

  while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
    var action1 = snapshot1[startIndex1];

    if (!isInsert(action1)) {
      throw new Error('not an "insert" operation');
    }

    if (!areEqual(action1, snapshot2[startIndex2])) {
      break;
    }

    var length = getLength(action1);
    ++startIndex1;
    ++startIndex2;
    commonPrefixLength += length;
    editLocation -= length;
  } // skip common suffix


  while (startIndex1 <= endIndex1 && startIndex2 <= endIndex2) {
    var _action = snapshot1[endIndex1];

    if (!isInsert(_action)) {
      throw new Error('not an "insert" operation');
    }

    if (!areEqual(_action, snapshot2[endIndex2])) {
      break;
    }

    --endIndex1;
    --endIndex2;
  } // create iterators and set them to the first differing operations


  var iterator1 = new Iterator(snapshot1);
  iterator1.offset = 0;
  iterator1.index = startIndex1;
  iterator1.next(0);
  var iterator2 = new Iterator(snapshot2);
  iterator2.offset = 0;
  iterator2.index = startIndex2;
  iterator2.next(0); // calculate differingContent1

  while (startIndex1 <= endIndex1) {
    var action = snapshot1[startIndex1++];

    if (!isInsert(action)) {
      throw new Error('not an "insert" action');
    }

    differingContent1 += isInsertText(action) ? getText(action) : getNodeId(action);
  } // calculate differingContent2


  while (startIndex2 <= endIndex2) {
    var _action2 = snapshot2[startIndex2++];

    if (!isInsert(_action2)) {
      throw new Error('not an "insert" action');
    }

    differingContent2 += isInsertText(_action2) ? getText(_action2) : getNodeId(_action2);
  }

  var stringDiff = fastDiff(differingContent1, differingContent2, editLocation);

  var append1 = function append1(action) {
    return append(result1, action);
  };

  var append2 = function append2(action) {
    return append(result2, action);
  };

  if (commonPrefixLength > 0) {
    var retain = createRetain(commonPrefixLength);
    append1(retain);
    append2(retain);
  }

  for (var i = 0, l = stringDiff.length; i < l; ++i) {
    var diffItem = stringDiff[i];
    diffIterators(iterator1, iterator2, diffItem[0], diffItem[1], append1, append2);
  }

  return [chop(result1), chop(result2)];
}

function createPresence(presence) {
  return isValidPresence(presence) ? presence : {
    u: '',
    c: 0,
    s: []
  };
}

function transformPresence(presence, operation, isOwnOperation) {
  var user = presence.u;
  var change = presence.c;
  var selections = presence.s;
  var newSelections = new Array(selections.length);

  for (var i = 0, l = selections.length; i < l; ++i) {
    var selection = selections[i];
    var newStart = transformCursor(selection[0], operation, isOwnOperation);
    var newEnd = selection[0] === selection[1] ? newStart : transformCursor(selection[1], operation, isOwnOperation);
    newSelections[i] = [newStart, newEnd];
  }

  return {
    u: user,
    c: change,
    s: newSelections
  };
}

function comparePresence(presence1, presence2) {
  if (presence1 === presence2) {
    return true;
  }

  if (presence1 == null || presence2 == null || presence1.u !== presence2.u || presence1.c !== presence2.c || presence1.s.length !== presence2.s.length) {
    return false;
  }

  for (var i = 0, l = presence1.s.length; i < l; ++i) {
    if (presence1.s[i][0] !== presence2.s[i][0] || presence1.s[i][1] !== presence2.s[i][1]) {
      return false;
    }
  }

  return true;
}

function isValidPresence(presence) {
  if (presence == null || typeof presence.u !== 'string' || typeof presence.c !== 'number' || !isFinite(presence.c) || Math.floor(presence.c) !== presence.c || !Array.isArray(presence.s)) {
    return false;
  }

  var selections = presence.s;

  for (var i = 0, l = selections.length; i < l; ++i) {
    var selection = selections[i];

    if (!Array.isArray(selection) || selection.length !== 2 || selection[0] !== (selection[0] | 0) || selection[1] !== (selection[1] | 0)) {
      return false;
    }
  }

  return true;
}

module.exports = {
  create: create,
  isNoop: isNoop,
  compose: compose,
  composeSimilar: composeSimilar,
  apply: apply,
  applyAndInvert: applyAndInvert,
  transform: transform,
  transformCursor: transformCursor,
  append: append,
  chop: chop,
  validate: validate,
  normalize: normalize,
  diffX: diffX,
  createPresence: createPresence,
  transformPresence: transformPresence,
  comparePresence: comparePresence,
  isValidPresence: isValidPresence
};