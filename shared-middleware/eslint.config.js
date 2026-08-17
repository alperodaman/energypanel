import globals from 'globals';
import sharedConfig from '@enerjipanel/eslint-config';

export default [
  ...sharedConfig,
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
