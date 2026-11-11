import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// eslint-config-next 16 ships flat config arrays, so no FlatCompat is needed.
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals')
const js = require('@eslint/js')
const tseslint = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

const ignoredPaths = [
  'node_modules/**',
  '.next/**',
  'out/**',
  'build/**',
  'backup/**',
  'migration/backup/**',
  '.tmp/**',
  'PythonProject17/**',
  'prisma/generated/**',
  'public/**',
  'posts/**',
  '**/*.mdx',
  'next-env.d.ts'
]

export default [
  { ignores: ignoredPaths },
  ...nextCoreWebVitals,
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript handles these globals/types; core no-undef produces false positives.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly'
      }
    }
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'off',
      'sort-imports': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
          bracketSpacing: true,
          tabWidth: 2,
          useTabs: false,
          htmlWhitespaceSensitivity: 'strict',
          trailingComma: 'none',
          endOfLine: 'auto'
        }
      ]
    }
  },
  prettierConfig
]
