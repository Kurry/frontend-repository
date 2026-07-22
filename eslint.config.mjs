import tsParser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';

export const playwrightTestFiles = [
  'packages/corpuscheck/src/corpuscheck/canonical/e2e/**/*.{js,mjs,cjs,ts,tsx,jsx}',
  'tasks/frontend-*/solution/app/e2e.spec.mjs',
  'tasks/frontend-*/solution/app/e2e/**/*.{js,mjs,cjs,ts,tsx,jsx}',
];

const recommended = playwright.configs['flat/recommended'];
const strictRecommendedRules = Object.fromEntries(
  Object.entries(recommended.rules).map(([name, severity]) => [
    name,
    severity === 'off' || severity === 0 ? 'off' : 'error',
  ]),
);

export default [
  {
    ...recommended,
    name: 'frontend-repository/playwright-tests',
    files: playwrightTestFiles,
    languageOptions: {
      ...recommended.languageOptions,
      parser: tsParser,
      parserOptions: {
        ...recommended.languageOptions?.parserOptions,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...strictRecommendedRules,
      'playwright/missing-playwright-await': [
        'error',
        { includePageLocatorMethods: true },
      ],
      'playwright/no-commented-out-tests': 'error',
      'playwright/require-to-pass-timeout': 'error',
    },
  },
];
