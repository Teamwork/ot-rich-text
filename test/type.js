const tap = require('tap')
const type = require('../lib/type')
const {
    create, isNoop, compose, apply, applyAndInvert, transform, normalize,
    transformCursor, diffX, createPresence, transformPresence, comparePresence
} = require('../lib/Operation')

tap.equal(type.name, 'ot-rich-text')
tap.equal(type.uri, 'https://github.com/Teamwork/ot-rich-text')
tap.equal(type.create, create)
tap.equal(type.isNoop, isNoop)
tap.equal(type.compose, compose)
tap.equal(type.apply, apply)
tap.equal(type.applyAndInvert, applyAndInvert)
tap.equal(type.transform, transform)
tap.equal(type.normalize, normalize)
tap.equal(type.transformCursor, transformCursor)
tap.equal(type.diffX, diffX)
tap.equal(type.createPresence, createPresence)
tap.equal(type.transformPresence, transformPresence)
tap.equal(type.comparePresence, comparePresence)
