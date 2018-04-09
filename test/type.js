const tap = require('tap')
const type = require('../lib/type')
const {
    create, compose, apply, transform, normalize, transformCursor, diffX, createPresence, transformPresence
} = require('../lib/Operation')

tap.equal(type.name, 'ot-rich-text')
tap.equal(type.uri, 'https://github.com/Teamwork/ot-rich-text')
tap.equal(type.create, create)
tap.equal(type.compose, compose)
tap.equal(type.apply, apply)
tap.equal(type.transform, transform)
tap.equal(type.normalize, normalize)
tap.equal(type.transformCursor, transformCursor)
tap.equal(type.diffX, diffX)
tap.equal(type.createPresence, createPresence)
tap.equal(type.transformPresence, transformPresence)
