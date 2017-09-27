const { getLength } = require('./Operation')

class Iterator {
    constructor(operations) {
        this.operations = operations
        this.index = 0
        this.offset = 0
        this.next(0)
    }

    // Gets the current operation or null, if there are no more operations left.
    get operation() {
        return this.index < this.operations.length ? this.operations[this.index] : null
    }

    // Gets the operation length.
    get operationLength() {
        const operation = this.operation

        return operation !== null ? getLength(operation) : 0
    }

    // Move at most `count` characters forward.
    next(count) {
        const operationsLength = this.operations.length

        while (this.index < operationsLength) {
            const operationLength = getLength(this.operations[this.index])

            if (this.offset + count < operationLength) {
                this.offset += count
                break
            } else {
                count -= (operationLength - this.offset)
                this.offset = 0
                this.index += 1
            }
        }

        return this
    }
}

module.exports = Iterator
