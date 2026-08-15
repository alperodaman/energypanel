import globals from 'globals'
import sharedConfig from '@enerjipanel/eslint-config'

export default [
  { ignores: ['dist/**'] },
  ...sharedConfig,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: globals.browser,
    },
  },
]
