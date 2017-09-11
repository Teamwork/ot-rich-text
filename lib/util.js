// The fastest way to copy an array (Chrome 61, Ubuntu 16.04), see https://jsperf.com/array-copy-comparison/1
function copyArray(array) {
    const length = array.length
    const result = new Array(length)

    for (let i = 0; i < length; ++i) {
        result[i] = array[i]
    }

    return result
}

// Returns true, if the specified arrays are equal starting at the specified index.
function arraysEqual(array1, array2, offset = 0) {
    const length = array1.length

    if (length !== array2.length) {
        return false
    }

    if (offset >= length) {
        return true
    }

    for (; offset < length; ++offset) {
        if (array1[offset] !== array2[offset]) {
            return false
        }
    }

    return true
}

module.exports = {
    copyArray,
    arraysEqual
}
