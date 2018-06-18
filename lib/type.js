const {
    create, isNoop, compose, composeSimilar, apply, applyAndInvert, transform,
    transformCursor, normalize, diffX, createPresence, transformPresence,
    comparePresence
} = require('./Operation')

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    isNoop,
    compose,
    composeSimilar,
    apply,
    applyAndInvert,
    transform,
    normalize,
    transformCursor,
    diffX,
    createPresence,
    transformPresence,
    comparePresence
}
