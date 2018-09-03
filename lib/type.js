"use strict";

var _require = require('./Operation'),
    create = _require.create,
    isNoop = _require.isNoop,
    compose = _require.compose,
    composeSimilar = _require.composeSimilar,
    apply = _require.apply,
    applyAndInvert = _require.applyAndInvert,
    transform = _require.transform,
    transformCursor = _require.transformCursor,
    normalize = _require.normalize,
    diffX = _require.diffX,
    createPresence = _require.createPresence,
    transformPresence = _require.transformPresence,
    comparePresence = _require.comparePresence;

module.exports = {
  name: 'ot-rich-text',
  uri: 'https://github.com/Teamwork/ot-rich-text',
  create: create,
  isNoop: isNoop,
  compose: compose,
  composeSimilar: composeSimilar,
  apply: apply,
  applyAndInvert: applyAndInvert,
  transform: transform,
  transformCursor: transformCursor,
  normalize: normalize,
  diffX: diffX,
  createPresence: createPresence,
  transformPresence: transformPresence,
  comparePresence: comparePresence
};