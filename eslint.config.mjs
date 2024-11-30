import pluginJs from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  {files: ['**/*.{ts}']},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      indent: ['error', 2],
      semi: ['error', 'never'],
      quotes: ['error', 'single']
    }
  }
]