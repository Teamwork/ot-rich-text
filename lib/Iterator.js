"use strict";

var _require = require('./Action'),
    getLength = _require.getLength; // Iterates actions within the specified operation.


function Iterator(operation) {
  this.operation = operation;
  this.index = 0;
  this.offset = 0;
  this.next(0);
}

Object.defineProperties(Iterator.prototype, {
  // Gets the current action or null, if there are no more actions left.
  action: {
    get: function get() {
      return this.index < this.operation.length ? this.operation[this.index] : null;
    }
  },
  // Move at most `count` characters forward.
  next: {
    value: function value(count) {
      var operationLength = this.operation.length;

      while (this.index < operationLength) {
        var actionLength = getLength(this.operation[this.index]);

        if (this.offset + count < actionLength) {
          this.offset += count;
          break;
        } else {
          count -= actionLength - this.offset;
          this.offset = 0;
          this.index++;
        }
      }

      return this;
    }
  }
});
module.exports = Iterator;