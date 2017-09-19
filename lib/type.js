const { create, compose, transform, transformCursor, normalize, diffX } = require('./Delta')

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    compose,
    apply: compose,
    transform,
    normalize,
    transformCursor,
    diffX
}
