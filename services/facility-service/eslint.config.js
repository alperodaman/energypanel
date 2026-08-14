import globals from 'globals';
import sharedConfig from '@enerjipanel/eslint-config';

export default [
  { ignores: ['generated/**'] },
  ...sharedConfig,
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
