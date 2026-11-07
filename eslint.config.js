import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import project from './eslint-rules/index.js';

// App logic that also runs in Node (tests): no DOM, no Vite-only APIs.
const NO_DOM = ['src/model/**'];

export default [
  { ignores: ['dist/', '.claude/', 'eslint-rules/', 'eslint.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // typescript-eslint turns no-undef off, but here it's what keeps the DOM out of NO_DOM files.
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { lib: ['esnext'], projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { project },
    rules: {
      'no-undef': 'error',

      // Needs types: a mishandled promise or a missed case is a bug, not a style issue.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      // Names and shapes a reader shouldn't need a comment for.
      'project/named-params': 'error',
      'project/no-braceless-nesting': 'error',
      'project/time-constant-units': 'error',
    },
  },
  { files: ['src/**/*.ts'], ignores: NO_DOM, languageOptions: { globals: globals.browser, parserOptions: { lib: ['esnext', 'dom', 'dom.iterable'] } } },
  { files: NO_DOM, languageOptions: { globals: globals['shared-node-browser'] } },
  { files: ['test/**/*.ts', 'scripts/**/*.ts', '*.config.*'], languageOptions: { globals: globals.node } },
  {
    files: NO_DOM,
    rules: {
      'project/no-dom-imports': ['error', { allowed: NO_DOM.map((glob) => glob.replace('/**', '')) }],
      'no-restricted-syntax': ['error', {
        selector: 'MetaProperty[meta.name="import"][property.name="meta"]',
        message: 'src/model/ runs in Node tests: no import.meta (Vite globs, env). Pass the data in instead.',
      }],
    },
  },
  {
    rules: {
      // Size: force logic into small, named pieces.
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'complexity': ['error', 10],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],

      // Errors fail loud.
      'no-empty': ['error', { allowEmptyCatch: false }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'all' }],

      // Boring over clever.
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-nested-ternary': 'error',
      'no-param-reassign': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'no-else-return': 'error',
      'consistent-return': 'error',
      'no-return-assign': ['error', 'always'],
      'default-param-last': 'error',
      'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true, ignoreUrls: true }],

      // Nothing breaks these today. They keep it that way.
      'no-implicit-coercion': 'error',
      'no-sequences': 'error',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'no-useless-assignment': 'error',
      'no-multi-assign': 'error',
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'no-throw-literal': 'error',
      'array-callback-return': 'error',
      'no-promise-executor-return': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },
];
