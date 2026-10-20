import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'legacy-data/',
      'media/',
      'next-env.d.ts',
      'src/payload-types.ts',
      'src/app/(payload)/',
      'src/migrations/',
      'playwright-report/',
      'test-results/',
    ],
  },
]

export default eslintConfig
