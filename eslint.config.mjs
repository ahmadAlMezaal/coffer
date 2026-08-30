import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const NO_THEN = {
  selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='then']",
  message: 'Use async/await instead of .then.',
};

const NO_MIXED_TYPE_IMPORT = {
  selector: "ImportDeclaration[importKind='value']:has(ImportSpecifier[importKind='type'])",
  message: 'Types come in their own import type statement, never alongside values.',
};

const IMPORT_ORDER = {
  groups: ['builtin', 'external', 'internal', 'parent', ['sibling', 'index'], 'type'],
  pathGroups: [
    { pattern: '@cursus/**', group: 'internal', position: 'before' },
    { pattern: '@/**', group: 'internal' },
    { pattern: '@test/**', group: 'internal' },
  ],
  pathGroupsExcludedImportTypes: ['builtin'],
  'newlines-between': 'always',
  'newlines-between-types': 'never',
  sortTypesGroup: true,
  alphabetize: { order: 'asc', caseInsensitive: true },
};

const NO_UNCACHED_ACCOUNT_READ = {
  selector: "MemberExpression[object.name='accountService'][property.name='current']",
  message: 'Read the account through currentAccount, so the layout and the page share one request.',
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.claude/**',
      '**/.next/**',
      '**/dist/**',
      '**/src/generated/**',
      '**/next-env.d.ts',
      '**/.turbo/**',
      'docs/design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react, 'react-hooks': reactHooks, 'import-x': importX },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],
      'no-var': 'error',
      'no-nested-ternary': 'error',
      'no-restricted-syntax': ['error', NO_THEN, NO_MIXED_TYPE_IMPORT],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/prop-types': 'off',
      'react/no-danger': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'import-x/order': ['error', IMPORT_ORDER],
      'import-x/newline-after-import': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/components/**/*.{ts,tsx}', 'apps/web/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/lib/repositories',
                '**/lib/repositories/*',
                '@/lib/repositories',
                '@/lib/repositories/*',
              ],
              message: 'Components and pages call a service. Only services touch repositories.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Reaching the network is a repository job. Call a service instead.',
        },
      ],
      'no-restricted-syntax': ['error', NO_THEN, NO_MIXED_TYPE_IMPORT, NO_UNCACHED_ACCOUNT_READ],
    },
  },
  {
    files: ['apps/web/lib/services/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'A service holds rules, not transport. Put the call in a repository.',
        },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Outbound calls go through axios, which carries the timeout and the error shape.',
        },
      ],
    },
  },
  {
    files: ['apps/web/lib/repositories/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/services', '**/lib/services/*', '@/lib/services', '@/lib/services/*'],
              message: 'A repository must not depend on a service. Dependencies point inward.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  prettier,
);
