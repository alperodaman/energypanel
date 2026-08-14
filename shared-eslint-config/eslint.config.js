import neostandard from 'neostandard';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  },
  ...neostandard({ env: ['node'], noStyle: true }),
  prettierConfig,
];
