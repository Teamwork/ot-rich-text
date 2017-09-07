const {
    ACTION, CONTENT,
    ACTION_INSERT_TEXT, ACTION_INSERT_OBJECT, ACTION_RETAIN, ACTION_DELETE
} = require('./Operation')

class Iterator {
    constructor(operations) {
        this._operations = operations
        this._index = 0
        this._offset = 0
        this.next()
    }

    // Gets all operations.
    get operations() {
        return this._operations
    }

    // Gets the current operation index.
    get index() {
        return this._index
    }

    // Returns true, if the iterator points to an operation.
    get hasOperation() {
        return this._index < this._operations.length
    }

    // Gets the current operation or null, if there are no more operations left.
    get operation() {
        return this.hasOperation ? this._operations[this._index] : null
    }

    // Gets the operation length.
    get operationLength() {
        const operation = this.operation

        if (operation) {
            switch (operation[ACTION]) {
                case ACTION_INSERT_TEXT:
                    return operation[CONTENT].length | 0
                case ACTION_INSERT_OBJECT:
                    return (operation[CONTENT].length > 0) | 0
                case ACTION_RETAIN:
                case ACTION_DELETE:
                    return operation[CONTENT] | 0
                default:
                    return 0
            }
        } else {
            return 0
        }
    }

    // Gets the character offset within the current operation.
    get offset() {
        return this._offset
    }

    // Move at most `count` characters forward.
    next(count = 0) {
        const operationsLength = this._operations.length

        while (this._index < operationsLength) {
            const operationLength = this.operationLength

            if (this._offset + count < operationLength) {
                this._offset += count
                break
            } else {
                count -= (operationLength - this._offset)
                this._offset = 0
                this._index += 1
            }
        }
    }
}

module.exports = Iterator
