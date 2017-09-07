const tap = require('tap')
const index = require('../index')
const type = require('../lib/type')

tap.equal(index.type, type)
