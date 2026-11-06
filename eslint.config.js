const neostandard = require('neostandard');
const jest = require('eslint-plugin-jest');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['lib/**', 'index.js', 'browser.js', 'server.js', 'coverage/**'] },
  ...neostandard({ noStyle: true }),
  {
    files: ['src/**/*.test.js'],
    ...jest.configs['flat/recommended'],
  },
  {
    rules: {
      'n/exports-style': ['error', 'module.exports'],
      'n/prefer-global/buffer': ['error', 'always'],
      'n/prefer-global/console': ['error', 'always'],
      'n/prefer-global/process': ['error', 'always'],
      'n/prefer-global/url-search-params': ['error', 'always'],
      'n/prefer-global/url': ['error', 'always'],
      'n/no-unsupported-features/es-syntax': [
        'error',
        { ignores: ['modules'] },
      ],
      'n/no-unsupported-features/es-builtins': 'error',
      curly: ['error', 'all'],
      'max-len': ['error', { code: 140, ignoreUrls: true }],
      'no-undefined': 'error',
      camelcase: 'error',
      'no-confusing-arrow': 'error',
      'no-var': 'error',
      'no-console': 'off',
    },
  },
  prettier,
];
