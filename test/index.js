const tap = require('tap')
const index = require('../index')

tap.equal(index.type.name, 'ot-rich-text')
tap.equal(index.type.uri, 'https://github.com/Teamwork/ot-rich-text')
