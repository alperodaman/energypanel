import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
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
  {
    files: ['**/*.jsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
