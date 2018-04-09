const {
    create, compose, apply, transform, transformCursor, normalize, diffX, createPresence, transformPresence
} = require('./Operation')

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create,
    compose,
    apply,
    transform,
    normalize,
    transformCursor,
    diffX,
    createPresence,
    transformPresence
}
