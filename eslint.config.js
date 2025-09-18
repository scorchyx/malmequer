import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'

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
    ],
  },

  // JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off', // Allow console in JS files
      'no-undef': 'off', // TypeScript handles this better
    },
  },

  // TypeScript files
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
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // Disable some overly strict rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Too strict for a project in development
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'prefer-const': 'warn',
      'no-console': 'off', // Allow console statements
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // Test files
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
      'no-console': 'off',
      'jest/no-conditional-expect': 'off', // Allow conditional expects in error testing
    },
  },

  // Next.js rules for JSX/TSX files
  ...compat.extends('next/core-web-vitals').map(config => ({
    ...config,
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      ...config.rules,
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-anonymous-default-export': 'off',
    },
  })),
]