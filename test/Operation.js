const assert = require('chai').assert
const {
    create, isNoop, validate, append, normalize, diffX, compose, transform,
    transformCursor, apply, applyAndInvert, chop, composeSimilar,
    createPresence, transformPresence, comparePresence, isValidPresence
} = require('../lib/Operation')
const {
    createInsertText, createInsertOpen, createInsertClose, createInsertEmbed, createRetain, createDelete
} = require('../lib/Action')

describe('Operation', function () {
    describe('create', function () {
        it('basic tests', function () {
            const snapshot = []

            assert.strictEqual(create(snapshot), snapshot)
            assert.instanceOf(create(), Array)
        })
    })

    describe('isNoop', function () {
        it('basic tests', function () {
            assert.strictEqual(isNoop([]), true)
            assert.strictEqual(isNoop([ createInsertText('a') ]), false)
        })
    })

    describe('validate', function () {
        it('basic tests', function () {
            assert.instanceOf(validate({ length: 0 }), Error, 'not an array')
            assert.instanceOf(validate(null), Error, 'not an array')
            assert.instanceOf(validate(undefined), Error, 'not an array')
            assert.instanceOf(validate('insert'), Error, 'not an array')
            assert.instanceOf(validate([ createRetain(0) ]), Error, 'invalid action at 0')
            assert.instanceOf(validate([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'invalid action at 2')
            assert.strictEqual(validate([]), null)
            assert.strictEqual(validate([ createRetain(1), createDelete(1), createInsertText('a') ]), null)
        })
    })

    describe('normalize', function () {
        it('basic tests', function () {
            assert.throws(() => normalize({ length: 0 }), Error, 'operation must be an array')
            assert.throws(() => normalize(null), Error, 'operation must be an array')
            assert.throws(() => normalize(undefined), Error, 'operation must be an array')
            assert.throws(() => normalize('insert'), Error, 'operation must be an array')
            assert.throws(() => normalize([ createRetain(0) ]), Error, 'Invalid action at index 0')
            assert.throws(() => normalize([ createRetain(1), createDelete(1), createInsertText('') ]), Error, 'Invalid action at index 2')
            normalize([])
            normalize([ createRetain(1), createDelete(1), createInsertText('a') ])
        })
    })

    describe('append', function () {
        it('left empty, right insert (text)', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertText('hello')), operation)
            assert.deepEqual(operation, [ createInsertText('hello') ])
        })
        it('left empty, right insert (open)', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertOpen('\uE000DIV')), operation)
            assert.deepEqual(operation, [ createInsertOpen('\uE000DIV') ])
        })
        it('left empty, right insert (close)', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertClose('\uE000DIV')), operation)
            assert.deepEqual(operation, [ createInsertClose('\uE000DIV') ])
        })
        it('left empty, right insert (embed)', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertEmbed('\uE000DIV')), operation)
            assert.deepEqual(operation, [ createInsertEmbed('\uE000DIV') ])
        })
        it('left empty, right retain', function () {
            const operation = []
            assert.strictEqual(append(operation, createRetain(5)), operation)
            assert.deepEqual(operation, [ createRetain(5) ])
        })
        it('left empty, right delete', function () {
            const operation = []
            assert.strictEqual(append(operation, createDelete(5)), operation)
            assert.deepEqual(operation, [ createDelete(5) ])
        })

        it('left empty, right insert (empty)', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertText('')), operation)
            assert.deepEqual(operation, [])
        })

        it('left retain, right retain', function () {
            const operation = [ createRetain(5) ]
            assert.strictEqual(append(operation, createRetain(7)), operation)
            assert.deepEqual(operation, [ createRetain(12) ])
        })

        it('left delete, right delete', function () {
            const operation = [ createDelete(5) ]
            assert.strictEqual(append(operation, createDelete(7)), operation)
            assert.deepEqual(operation, [ createDelete(12) ])
        })

        it('left insert text, right insert text', function () {
            const operation = [ createInsertText('Hello', ['key', 'value']) ]
            assert.strictEqual(append(operation, createInsertText(' World', ['key', 'value'])), operation)
            assert.deepEqual(operation, [ createInsertText('Hello World', ['key', 'value']) ])
        })

        it('left insert embed, right insert embed', function () {
            const operation = [ createInsertEmbed('\uE000DIV', ['key', 'value']) ]
            assert.strictEqual(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
            assert.deepEqual(operation, [
                createInsertEmbed('\uE000DIV', ['key', 'value']),
                createInsertEmbed('\uE000DIV', ['key', 'value'])
            ])
        })

        it('left delete, right insert text', function () {
            const operation = [ createDelete(5) ]
            assert.strictEqual(append(operation, createInsertText('hello', ['key', 'value'])), operation)
            assert.deepEqual(operation, [
                createInsertText('hello', ['key', 'value']),
                createDelete(5)
            ])
        })

        it('left insert text and delete, right insert text', function () {
            const operation = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
            assert.strictEqual(append(operation, createInsertText(' world', ['key', 'value'])), operation)
            assert.deepEqual(operation, [
                createInsertText('hello world', ['key', 'value']),
                createDelete(5)
            ])
        })

        it('left insert text and delete, right insert embed', function () {
            const operation = [ createInsertText('hello', ['key', 'value']), createDelete(5) ]
            assert.strictEqual(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
            assert.deepEqual(operation, [
                createInsertText('hello', ['key', 'value']),
                createInsertEmbed('\uE000DIV', ['key', 'value']),
                createDelete(5)
            ])
        })

        it('many', function () {
            const operation = []
            assert.strictEqual(append(operation, createInsertEmbed('\uE000DIV', ['key', 'value'])), operation)
            assert.strictEqual(append(operation, createInsertText('Hello', ['key', 'value'])), operation)
            assert.strictEqual(append(operation, createInsertText(' World', ['key', 'value'])), operation)
            assert.strictEqual(append(operation, createInsertText('!!!', ['key', 'value2'])), operation)
            assert.strictEqual(append(operation, createRetain(5)), operation)
            assert.strictEqual(append(operation, createDelete(3)), operation)
            assert.strictEqual(append(operation, createDelete(4)), operation)
            assert.deepEqual(operation, [
                createInsertEmbed('\uE000DIV', ['key', 'value']),
                createInsertText('Hello World', ['key', 'value']),
                createInsertText('!!!', ['key', 'value2']),
                createRetain(5),
                createDelete(7)
            ])
        })
    })

    describe('chop', function () {
        it('basic tests', function () {
            assert.deepEqual(chop(
                [ createInsertText('hello') ]),
                [ createInsertText('hello') ])
            assert.deepEqual(chop(
                [ createInsertText('hello'), createInsertText('hello') ]),
                [ createInsertText('hello'), createInsertText('hello') ])
            assert.deepEqual(chop(
                [ createInsertText('hello'), createRetain(5) ]),
                [ createInsertText('hello') ])
            assert.deepEqual(chop(
                [ createRetain(5) ]),
                [])
            assert.deepEqual(chop(
                [ createRetain(5), createInsertText('hello') ]),
                [ createRetain(5), createInsertText('hello') ])
            assert.deepEqual(chop(
                [ createRetain(5, ['key', 'value']) ]),
                [ createRetain(5, ['key', 'value']) ])
        })
    })

    const createTestDataForCompose = () => {
        const insertText1 = createInsertText('hello', ['key', 'value'])
        const insertText2 = createInsertText(' world', ['key', 'value'])
        const insertText3 = createInsertText('hello world', ['key', 'value'])
        const insertEmbed1 = createInsertEmbed('\uE000DIV')
        const insertEmbed2 = createInsertEmbed('\uE000DIV')
        const retain1 = createRetain(5)
        const retain2 = createRetain(8)
        const retain3 = createRetain(2)
        const retain4 = createRetain(3)
        const retain5 = createRetain(3, [ 'key', 'value' ])
        const delete1 = createDelete(6)
        const delete2 = createDelete(3)
        const delete3 = createDelete(9)

        return [ {
            operation1: [],
            operation2: [],
            newOperation: [],
            isSimilar: true
        }, {
            operation1: [],
            operation2: [ insertText1, insertEmbed1, insertText2, insertEmbed2 ],
            newOperation: [ insertText1, insertEmbed1, insertText2, insertEmbed2 ],
            isSimilar: false
        }, {
            operation1: [ delete1, delete2 ],
            operation2: [ insertText1, insertText2 ],
            newOperation: [ insertText3, delete3 ],
            isSimilar: false
        }, {
            operation1: [ insertText2, retain1, insertEmbed1 ],
            operation2: [ insertText1, retain2, insertEmbed2 ],
            newOperation: [ insertText3, retain3, insertEmbed2, retain4, insertEmbed1 ],
            isSimilar: false
        }, {
            operation1: [ createRetain(5) ],
            operation2: [ createRetain(5) ],
            newOperation: [],
            isSimilar: true
        }, {
            operation1: [ createRetain(5, ['key', 'value']) ],
            operation2: [ createRetain(5) ],
            newOperation: [ createRetain(5, ['key', 'value']) ],
            isSimilar: true
        }, {
            operation1: [ createRetain(5, ['key', 'value']) ],
            operation2: [ createRetain(5), createDelete(6) ],
            newOperation: [ createRetain(5, ['key', 'value']), createDelete(6) ],
            isSimilar: false
        }, {
            operation1: [ insertText2 ],
            operation2: [ insertText1 ],
            newOperation: [ insertText3 ],
            isSimilar: true
        }, {
            operation1: [ retain1, insertText2 ],
            operation2: [ retain1, insertText1 ],
            newOperation: [ retain1, insertText3 ],
            isSimilar: true
        }, {
            operation1: [ delete1 ],
            operation2: [ delete2 ],
            newOperation: [ delete3 ],
            isSimilar: true
        }, {
            operation1: [ retain1, delete1 ],
            operation2: [ retain1, delete2 ],
            newOperation: [ retain1, delete3 ],
            isSimilar: true
        }, {
            operation1: [ retain1, delete1 ],
            operation2: [ retain3, retain5, delete2 ],
            newOperation: [ retain3, retain5, delete3 ],
            isSimilar: true
        } ]
    }

    describe('compose', function () {
        it('basic tests', function () {
            createTestDataForCompose().forEach((data, index) => {
                const newOperation = compose(data.operation1, data.operation2)
                assert.deepEqual(newOperation, data.newOperation, `data index is ${index}`)
            })
        })
    })

    describe('composeSimilar', function () {
        it('basic tests', function () {
            createTestDataForCompose().forEach((data, index) => {
                const newOperation = composeSimilar(data.operation1, data.operation2)
                assert.deepEqual(newOperation, data.isSimilar ? data.newOperation : null, `data index is ${index}`)
            })
        })
    })

    const createTestDataForApply = () => {
        const insertText1 = createInsertText('hello', ['key', 'value'])
        const insertText2 = createInsertText(' world', ['key', 'value'])
        const insertText3 = createInsertText('hello world', ['key', 'value'])
        const insertEmbed1 = createInsertEmbed('\uE000BR')
        const insertEmbed2 = createInsertEmbed('\uE000IMG')
        const retain1 = createRetain(6)
        const retain2 = createRetain(8)
        const delete1 = createDelete(6)
        const delete2 = createDelete(8)

        return [
            {
                snapshot: [],
                operation: [],
                newSnapshot: []
            },
            {
                snapshot: [],
                operation: [ insertText1, insertEmbed1, insertText2, insertEmbed2 ],
                newSnapshot: [ insertText1, insertEmbed1, insertText2, insertEmbed2 ]
            },
            {
                snapshot: [ insertText2, insertEmbed1 ],
                operation: [ insertText1, retain1, insertEmbed2 ],
                newSnapshot: [ insertText3, insertEmbed2, insertEmbed1 ]
            },
            {
                snapshot: [ insertText2, insertEmbed1 ],
                operation: [ insertText1, delete1, insertEmbed2 ],
                newSnapshot: [ insertText1, insertEmbed2, insertEmbed1 ]
            },
            {
                snapshot: [ insertText2, insertEmbed1 ],
                operation: [ insertText1, retain2, insertEmbed2 ],
                newSnapshot: [ insertText3, insertEmbed1 ]
            },
            {
                snapshot: [ insertText2, insertEmbed1 ],
                operation: [ insertText1, delete2, insertEmbed2 ],
                newSnapshot: [ insertText1 ]
            }
        ]
    }

    describe('apply', function () {
        it('basic tests', function () {
            createTestDataForApply().forEach(data => {
                assert.deepEqual(apply(data.snapshot, data.operation), data.newSnapshot)
            })
        })
    })

    describe('applyAndInvert', function () {
        it('basic tests', function () {
            createTestDataForApply().forEach(data => {
                const result1 = applyAndInvert(data.snapshot, data.operation)
                assert.deepEqual(result1[0], data.newSnapshot)

                const result2 = applyAndInvert(result1[0], result1[1])
                assert.deepEqual(result2[0], data.snapshot)

                const result3 = applyAndInvert(result2[0], result2[1])
                assert.deepEqual(result3[0], data.newSnapshot)
            })
        })

        it('takes editing position into the account when inverting a delete operation', function () {
            const snapshot = [ createInsertText('aaaaa') ]
            const operation = [ createRetain(3), createDelete(1) ]
            const result = applyAndInvert(snapshot, operation)
            assert.deepEqual(result[0], [ createInsertText('aaaa') ])
            assert.deepEqual(result[1], [ createRetain(3), createInsertText('a') ])
        })

        it('takes editing position into the account when inverting an insert operation', function () {
            const snapshot = [ createInsertText('aaaaa') ]
            const operation = [ createRetain(3), createInsertText('a') ]
            const result = applyAndInvert(snapshot, operation)
            assert.deepEqual(result[0], [ createInsertText('aaaaaa') ])
            assert.deepEqual(result[1], [ createRetain(3), createDelete(1) ])
        })

        it('takes editing position into the account when inverting an operation (no leading retain)', function () {
            const snapshot = [ createInsertText('aaaaa') ]
            const operation = [ createInsertText('a') ]
            const result = applyAndInvert(snapshot, operation)
            assert.deepEqual(result[0], [ createInsertText('aaaaaa') ])
            assert.deepEqual(result[1], [ createDelete(1) ])
        })

        it('takes editing position into the account when inverting an operation (leading retain with attributes)', function () {
            const snapshot = [ createInsertText('aaaaa') ]
            const operation = [ createRetain(3, [ 'key', 'value' ]), createInsertText('a') ]
            const result = applyAndInvert(snapshot, operation)
            assert.deepEqual(result[0], [ createInsertText('aaa', [ 'key', 'value' ]), createInsertText('aaa') ])
            assert.deepEqual(result[1], [ createRetain(3, [ 'key', null ]), createDelete(1) ])
        })

        it('takes editing position into the account when inverting an operation (no-op)', function () {
            const snapshot = [ createInsertText('aaaaa') ]
            const operation = []
            const result = applyAndInvert(snapshot, operation)
            assert.deepEqual(result[0], [ createInsertText('aaaaa') ])
            assert.deepEqual(result[1], [])
        })
    })

    describe('transform', function () {
        it('basic tests', function () {
            const insertText1 = createInsertText('hello', ['key', 'value'])
            const insertText2 = createInsertText(' world', ['key', 'value'])
            const insertEmbed1 = createInsertEmbed('\uE000DIV')
            const insertEmbed2 = createInsertEmbed('\uE000DIV')
            const retain1 = createRetain(5)
            const retain2 = createRetain(8)
            const retain3 = createRetain(11)
            const retain4 = createRetain(1)
            const retain5 = createRetain(6)
            const delete1 = createDelete(6)
            const delete2 = createDelete(3)

            assert.deepEqual(transform([], [], 'left'), [])
            assert.deepEqual(transform([], [], 'right'), [])

            assert.deepEqual(transform(
                [ insertText1, retain1, delete1, insertEmbed1 ],
                [ insertText2, retain2, insertEmbed2 ],
                'left'),
                [
                    insertText1, // comes first because of the priority
                    retain3, // insertText2 (6 characters) + retain1 (5 characters) & retain2 (first 5 characters) -> merged by append
                    delete2, // delete1 (first 3 characters) & retain2 (remaining 3 chars)
                    retain4, // insertText2 (1 character)
                    insertEmbed1, // moved before delete1 (remaining 3 characters) by append
                    delete2 // delete1 (remaining 3 characters)
                ])

            assert.deepEqual(transform(
                [ insertText1, retain1, delete1, insertEmbed1 ],
                [ insertText2, retain2, insertEmbed2 ],
                'right'),
                [
                    retain5, // insertText2 (6 characters) retained first, because of priority
                    insertText1, // comes second because of the priority
                    retain1, // retain1 (5 characters) & retain2 (first 5 characters)
                    delete2, // delete1 (first 3 characters) & retain2 (remaining 3 chars)
                    retain4, // insertText2 (1 character)
                    insertEmbed1, // moved before delete1 (remaining 3 characters) by append
                    delete2 // delete1 (remaining 3 characters)
                ])

            assert.deepEqual(transform(
                [ createRetain(5) ],
                [ createRetain(5) ],
                'left'),
                [],
                'Should remove trailing retain')

            assert.deepEqual(transform(
                [ createRetain(5) ],
                [ createRetain(5) ],
                'right'),
                [],
                'Should remove trailing retain')

            assert.deepEqual(transform(
                [ createRetain(5, ['key', 'value']) ],
                [ createRetain(5) ],
                'left'),
                [ createRetain(5, ['key', 'value']) ],
                'Should keep trailing retain with attributes')
        })
    })

    describe('transformCursor', function () {
        it('basic tests', function () {
            assert.strictEqual(transformCursor(0, [], true), 0)
            assert.strictEqual(transformCursor(0, [], false), 0)
            assert.strictEqual(transformCursor(0, [ createInsertText('ab') ], true), 2)
            assert.strictEqual(transformCursor(0, [ createInsertText('ab') ], false), 0)
            assert.strictEqual(transformCursor(0, [ createDelete(2) ], true), 0)
            assert.strictEqual(transformCursor(0, [ createDelete(2) ], false), 0)
            assert.strictEqual(transformCursor(0, [ createRetain(2) ], true), 0)
            assert.strictEqual(transformCursor(0, [ createRetain(2) ], false), 0)

            assert.strictEqual(transformCursor(5, [], true), 5)
            assert.strictEqual(transformCursor(5, [], false), 5)
            assert.strictEqual(transformCursor(5, [ createInsertText('ab') ], true), 7)
            assert.strictEqual(transformCursor(5, [ createInsertText('ab') ], false), 7)
            assert.strictEqual(transformCursor(5, [ createDelete(2) ], true), 3)
            assert.strictEqual(transformCursor(5, [ createDelete(2) ], false), 3)
            assert.strictEqual(transformCursor(5, [ createRetain(2) ], true), 5)
            assert.strictEqual(transformCursor(5, [ createRetain(2) ], false), 5)

            assert.strictEqual(transformCursor(5, [
                createRetain(5), createInsertText('abc'), createInsertText('def')
            ], true), 11)
            assert.strictEqual(transformCursor(5, [
                createRetain(5), createInsertText('abc'), createInsertText('def')
            ], false), 5)
            assert.strictEqual(transformCursor(5, [
                createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
            ], true), 8)
            assert.strictEqual(transformCursor(5, [
                createRetain(5), createInsertText('abc'), createRetain(1), createInsertText('def')
            ], false), 5)

            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(1), createRetain(3)
            ], true), 4)
            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(1), createRetain(3)
            ], false), 4)
            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(2), createRetain(3)
            ], true), 3)
            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(2), createRetain(3)
            ], false), 3)
            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(3), createRetain(3)
            ], true), 3)
            assert.strictEqual(transformCursor(5, [
                createRetain(3), createDelete(3), createRetain(3)
            ], false), 3)
        })
    })

    describe('diffX', function () {
        it('basic tests', function () {
            assert.throws(() => diffX(
                [ createRetain(1) ],
                []
            ), Error)
            assert.throws(() => diffX(
                [ createDelete(1) ],
                []
            ), Error)
            assert.throws(() => diffX(
                [],
                [ createRetain(1) ]
            ), Error)
            assert.throws(() => diffX(
                [],
                [ createDelete(1) ]
            ), Error)

            assert.throws(() => diffX(
                [ createRetain(1) ],
                [ createInsertText('a') ]
            ), Error)
            assert.throws(() => diffX(
                [ createDelete(1) ],
                [ createInsertText('a') ]
            ), Error)
            assert.throws(() => diffX(
                [ createInsertText('a') ],
                [ createRetain(1) ]
            ), Error)
            assert.throws(() => diffX(
                [ createInsertText('a') ],
                [ createDelete(1) ]
            ), Error)

            assert.throws(() => diffX(
                [ createInsertText('a'), createRetain(1) ],
                [ createInsertText('b'), createInsertText('a') ]
            ), Error)
            assert.throws(() => diffX(
                [ createInsertText('a'), createDelete(1) ],
                [ createInsertText('b'), createInsertText('a') ]
            ), Error)
            assert.throws(() => diffX(
                [ createInsertText('a'), createInsertText('a') ],
                [ createInsertText('b'), createRetain(1) ]
            ), Error)
            assert.throws(() => diffX(
                [ createInsertText('a'), createInsertText('a') ],
                [ createInsertText('b'), createDelete(1) ]
            ), Error)

            const testDiffImpl = (operation1, operation2) => {
                const [ result1, result2 ] = diffX(operation1, operation2)

                assert.deepEqual(apply(operation1, result2), operation2)
                assert.deepEqual(apply(operation2, result1), operation1)
            }

            const testDiff = (operation1, operation2) => {
                testDiffImpl(operation1, operation2)
                testDiffImpl(operation2, operation1)
            }

            const operation = []
            testDiff(operation, operation)
            testDiff([], [])

            testDiff([
                createInsertText('abc'),
                createInsertOpen('\uE000DIV'),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertClose('\uE000DIV')
            ], [])

            testDiff([
                createInsertText('abc')
            ], [
                createInsertText('a'),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('abc', [ 'blah', 'blah!' ])
            ], [
                createInsertText('abc', [ 'hello', 'world' ])
            ])

            testDiff([
                createInsertText('a', [ 'blah', 'blah!' ]),
                createInsertText('b'),
                createInsertText('c', [ 'hello', 'world' ])
            ], [
                createInsertText('abc', [ 'hello', 'world' ])
            ])

            testDiff([
                createInsertText('a', [ 'blah', 'blah!', 'hello', 'world' ]),
                createInsertText('b'),
                createInsertText('c', [ 'hello', 'world' ])
            ], [
                createInsertText('abc', [ 'a', 'p', 'blah', '', 'hello', 'world' ])
            ])

            testDiff([
                createInsertText('a'),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image2.png' ]),
                createInsertText('c')
            ], [
                createInsertText('a'),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('a'),
                createInsertEmbed('\uE000BR'),
                createInsertText('c')
            ], [
                createInsertText('a'),
                createInsertEmbed('\uE000IMG'),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('aef sefef '),
                createInsertEmbed('\uE000BR'),
                createInsertText('c')
            ], [
                createInsertText('aef'),
                createInsertEmbed('\uE000IMG'),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('aef sefef '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c')
            ], [
                createInsertText('aef'),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image2.png', 'zzz', '' ]),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c')
            ], [
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c')
            ])

            testDiff([
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c'),
                createInsertEmbed('\uE000BR')
            ], [
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c'),
                createInsertEmbed('\uE000HR')
            ])

            testDiff([
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c'),
                createInsertEmbed('\uE000BR', [ 'hello', 'world' ])
            ], [
                createInsertText('abc '),
                createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                createInsertText('c'),
                createInsertEmbed('\uE000BR', [ 'hello', 'world!!!' ])
            ])

            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], -1),
                [ [
                    createRetain(3),
                    createDelete(1)
                ], [
                    createRetain(3),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 0),
                [ [
                    createDelete(1)
                ], [
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 1),
                [ [
                    createRetain(1),
                    createDelete(1)
                ], [
                    createRetain(1),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 2),
                [ [
                    createRetain(2),
                    createDelete(1)
                ], [
                    createRetain(2),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 3),
                [ [
                    createRetain(3),
                    createDelete(1)
                ], [
                    createRetain(3),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 4),
                [ [
                    createRetain(3),
                    createDelete(1)
                ], [
                    createRetain(3),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaa')
                ], [
                    createInsertText('aaaa')
                ], 5),
                [ [
                    createRetain(3),
                    createDelete(1)
                ], [
                    createRetain(3),
                    createInsertText('a')
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], -1),
                [ [
                    createRetain(3),
                    createInsertText('a')
                ], [
                    createRetain(3),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 0),
                [ [
                    createInsertText('a')
                ], [
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 1),
                [ [
                    createRetain(1),
                    createInsertText('a')
                ], [
                    createRetain(1),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 2),
                [ [
                    createRetain(2),
                    createInsertText('a')
                ], [
                    createRetain(2),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 3),
                [ [
                    createRetain(3),
                    createInsertText('a')
                ], [
                    createRetain(3),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 4),
                [ [
                    createRetain(3),
                    createInsertText('a')
                ], [
                    createRetain(3),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertText('aaaa')
                ], [
                    createInsertText('aaa')
                ], 5),
                [ [
                    createRetain(3),
                    createInsertText('a')
                ], [
                    createRetain(3),
                    createDelete(1)
                ] ]
            )
            assert.deepEqual(
                diffX([
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createInsertText('aaa'),
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ])
                ], [
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createInsertText('aaaa'),
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ])
                ], 2),
                [ [
                    createRetain(2),
                    createDelete(1)
                ], [
                    createRetain(2),
                    createInsertText('a')
                ] ]
            )
            // In this case the editLocation param is ignored because the algorithm detects that the
            // actual edit location is 0.
            assert.deepEqual(
                diffX([
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createInsertText('aaa')
                ], [
                    createInsertEmbed('\uE001IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createInsertText('aaaa')
                ], 2),
                [ [
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createDelete(2)
                ], [
                    createInsertEmbed('\uE001IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createInsertText('a'),
                    createDelete(1)
                ] ]
            )
            // In this case the editLocation param is ignored because the algorithm detects that the
            // actual edit location is 3.
            assert.deepEqual(
                diffX([
                    createInsertText('aaa'),
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ])
                ], [
                    createInsertText('aaaa'),
                    createInsertEmbed('\uE001IMG', [ 'src', 'http://www.example.com/image.png' ])
                ], 2),
                [ [
                    createRetain(3),
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createDelete(2)
                ], [
                    createRetain(3),
                    createInsertText('a'),
                    createInsertEmbed('\uE001IMG', [ 'src', 'http://www.example.com/image.png' ]),
                    createDelete(1)
                ] ]
            )
            // In this case the editLocation param is used because the algorithm does not recognize
            // changing attributes as editing.
            assert.deepEqual(
                diffX([
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image0.png' ]),
                    createInsertText('aaa')
                ], [
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image1.png' ]),
                    createInsertText('aaaa')
                ], 2),
                [ [
                    createRetain(1, [ 'src', 'http://www.example.com/image0.png' ]),
                    createRetain(1),
                    createDelete(1)
                ], [
                    createRetain(1, [ 'src', 'http://www.example.com/image1.png' ]),
                    createRetain(1),
                    createInsertText('a')
                ] ]
            )
            // In this case the editLocation param is used because the algorithm does not recognize
            // changing attributes as editing.
            assert.deepEqual(
                diffX([
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image0.png' ]),
                    createInsertText('aaaa')
                ], [
                    createInsertEmbed('\uE000IMG', [ 'src', 'http://www.example.com/image1.png' ]),
                    createInsertText('aaa')
                ], 2),
                [ [
                    createRetain(1, [ 'src', 'http://www.example.com/image0.png' ]),
                    createRetain(1),
                    createInsertText('a')
                ], [
                    createRetain(1, [ 'src', 'http://www.example.com/image1.png' ]),
                    createRetain(1),
                    createDelete(1)
                ] ]
            )
        })
    })

    describe('createPresence', function () {
        it('basic tests', function () {
            const defaultPresence = { u: '', c: 0, s: [] }
            const presence = { u: '5', c: 8, s: [ [ 1, 2 ], [ 9, 5 ] ] }

            assert.deepEqual(createPresence(), defaultPresence)
            assert.deepEqual(createPresence(null), defaultPresence)
            assert.deepEqual(createPresence(true), defaultPresence)
            assert.deepEqual(createPresence({ u: 5, c: 8, s: [ 1, 2 ] }), defaultPresence)
            assert.deepEqual(createPresence({ u: '5', c: '8', s: [ 1, 2 ] }), defaultPresence)
            assert.deepEqual(createPresence({ u: '5', c: 8, s: [ 1.5, 2 ] }), defaultPresence)
            assert.strictEqual(createPresence(presence), presence)
        })
    })

    describe('transformPresence', function () {
        it('basic tests', function () {
            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [], true), {
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            })
            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [], false), {
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            })

            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [
                createRetain(3),
                createDelete(2),
                createInsertText('a')
            ], true), {
                u: 'user',
                c: 8,
                s: [ [ 4, 6 ] ]
            })
            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [
                createRetain(3),
                createDelete(2),
                createInsertText('a')
            ], false), {
                u: 'user',
                c: 8,
                s: [ [ 3, 6 ] ]
            })

            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [
                createRetain(5),
                createDelete(2),
                createInsertText('a')
            ], true), {
                u: 'user',
                c: 8,
                s: [ [ 6, 6 ] ]
            })
            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ] ]
            }, [
                createRetain(5),
                createDelete(2),
                createInsertText('a')
            ], false), {
                u: 'user',
                c: 8,
                s: [ [ 5, 5 ] ]
            })

            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 5, 7 ], [ 8, 2 ] ]
            }, [
                createInsertText('a')
            ], false), {
                u: 'user',
                c: 8,
                s: [ [ 6, 8 ], [ 9, 3 ] ]
            })

            assert.deepEqual(transformPresence({
                u: 'user',
                c: 8,
                s: [ [ 1, 1 ], [ 2, 2 ] ]
            }, [
                createInsertText('a')
            ], false), {
                u: 'user',
                c: 8,
                s: [ [ 2, 2 ], [ 3, 3 ] ]
            })
        })
    })

    describe('comparePresence', function () {
        it('basic tests', function () {
            assert.strictEqual(comparePresence(), true)
            assert.strictEqual(comparePresence(undefined, undefined), true)
            assert.strictEqual(comparePresence(null, null), true)
            assert.strictEqual(comparePresence(null, undefined), false)
            assert.strictEqual(comparePresence(undefined, null), false)
            assert.strictEqual(comparePresence(undefined, { u: '', c: 0, s: [] }), false)
            assert.strictEqual(comparePresence(null, { u: '', c: 0, s: [] }), false)
            assert.strictEqual(comparePresence({ u: '', c: 0, s: [] }, undefined), false)
            assert.strictEqual(comparePresence({ u: '', c: 0, s: [] }, null), false)

            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] }
            ), true)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ], [ 4, 6 ] ] },
                { u: 'user', c: 8, s: [ [ 1, 2 ], [ 4, 6 ] ] }
            ), true)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ], unknownProperty: 5 },
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] }
            ), true)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 1, 2 ] ], unknownProperty: 5 }
            ), true)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'userX', c: 8, s: [ [ 1, 2 ] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'user', c: 9, s: [ [ 1, 2 ] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 3, 2] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 1, 3 ] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 9, 8 ], [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 9, 8 ], [ 3, 2] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 9, 8 ], [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 9, 8 ], [ 1, 3 ] ] }
            ), false)
            assert.strictEqual(comparePresence(
                { u: 'user', c: 8, s: [ [ 9, 8 ], [ 1, 2 ] ] },
                { u: 'user', c: 8, s: [ [ 9, 8 ] ] }
            ), false)
        })
    })

    describe('isValidPresence', function () {
        it('basic tests', function () {
            assert.strictEqual(isValidPresence(), false)
            assert.strictEqual(isValidPresence(null), false)
            assert.strictEqual(isValidPresence([]), false)
            assert.strictEqual(isValidPresence({}), false)
            assert.strictEqual(isValidPresence({ u: 5, c: 8, s: [] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: '8', s: [] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8.5, s: [] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: Infinity, s: [] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: NaN, s: [] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: {} }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [] }), true)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1 ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ] ] }), true)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2, 3 ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, 6 ] ] }), true)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, '6' ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, 6.1 ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, Infinity ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, NaN ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, -0 ] ] }), true)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ 3, -1 ] ] }), true)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, 2 ], [ '3', 0 ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ 1, '2' ], [ 4, 0 ] ] }), false)
            assert.strictEqual(isValidPresence({ u: '5', c: 8, s: [ [ '1', 2 ], [ 4, 0 ] ] }), false)
        })
    })
})
