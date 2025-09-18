import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'public/**',
      '.env*',
      'postcss.config.js',
      'tailwind.config.js',
      'jest.config.js',
      'jest.setup.js',
      'next-env.d.ts',
      'prisma/migrations/**',
    ],
  },

  // Base JavaScript configuration
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'warn',
      'no-undef': 'off', // TypeScript handles this better
      'prefer-const': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      '@stylistic': stylistic,
      'import': importPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for gradual improvement
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // General code quality
      'prefer-const': 'warn',
      'no-console': 'warn',
      'no-undef': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',

      // Import organization
      'import/order': ['warn', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'pathGroups': [
          {
            'pattern': '@/**',
            'group': 'internal',
            'position': 'before'
          }
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'newlines-between': 'never',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'import/no-duplicates': 'warn',
      'import/no-unused-modules': 'off', // Can be expensive

      // Code style (using @stylistic)
      '@stylistic/indent': ['warn', 2],
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['warn', 'never'],
      '@stylistic/comma-dangle': ['warn', 'always-multiline'],
      '@stylistic/object-curly-spacing': ['warn', 'always'],
      '@stylistic/array-bracket-spacing': ['warn', 'never'],
    },
  },

  // React/Next.js specific configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // React hooks
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // Accessibility
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.{test,spec}.{js,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...jest.environments.globals.globals,
      },
    },
    plugins: {
      jest,
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...jest.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/expect-expect': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
    },
  },

  // Next.js configuration
  ...compat.extends('next/core-web-vitals').map(config => ({
    ...config,
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      ...config.rules,
      '@next/next/no-img-element': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      'import/no-anonymous-default-export': 'off',
    },
  })),

  // API routes specific rules
  {
    files: ['app/api/**/*.{ts,tsx}', 'pages/api/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off', // Allow console in API routes for server logging
      '@typescript-eslint/no-explicit-any': 'off', // API routes often need flexible typing
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts,mjs}', '.eslintrc.{js,cjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
]