const { getLength } = require('./Operation')

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

        return operation !== null ? getLength(operation) : 0
    }

    // Gets the character offset within the current operation.
    get offset() {
        return this._offset
    }

    // Gets the remaining character count within the current operation.
    get remaining() {
        return this.operationLength - this._offset
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

        return this
    }
}

module.exports = Iterator
