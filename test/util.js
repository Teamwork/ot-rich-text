const tap = require('tap')
const { copyArray } = require('../lib/util')

tap.test('copyArray', t => {
    t.strictSame(copyArray([]), [])
    t.strictSame(copyArray([1]), [1])
    t.strictSame(copyArray([1, '2', null]), [1, '2', null])
    t.strictSame(copyArray([undefined, null, 1, {}, []]), [undefined, null, 1, {}, []])
    t.end()
})
