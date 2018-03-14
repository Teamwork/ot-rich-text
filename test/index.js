const tap = require('tap')
const index = require('../index')
const type = require('../lib/type')
const Action = require('../lib/Action')
const Iterator = require('../lib/Iterator')
const Operation = require('../lib/Operation')

tap.equal(index.type, type)
tap.equal(index.Action, Action)
tap.equal(index.Iterator, Iterator)
tap.equal(index.Operation, Operation)
