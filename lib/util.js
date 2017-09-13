// The fastest way to copy an array (Chrome 61, Ubuntu 16.04), see https://jsperf.com/array-copy-comparison/1
function copyArray(array) {
    const length = array.length
    const result = new Array(length)

    for (let i = 0; i < length; ++i) {
        result[i] = array[i]
    }

    return result
}

module.exports = {
    copyArray
}
