const { defaults } = require('ts-jest/presets');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    ...defaults.transform,
  },
};
