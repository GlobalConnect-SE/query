module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@angular-eslint', '@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.d.ts'],
      },
    },
  },
  rules: {
    eqeqeq: 'error',
    curly: 'error',
    'no-nested-ternary': 'error',
    // turn off indent rules because we use prettier rules for that and these are incompatible
    indent: 'off',
    '@typescript-eslint/indent': 'off',
    //overriding ts rules from the recommended
    'no-prototype-builtins': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['strictCamelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'variable',
        format: ['strictCamelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      { selector: 'typeLike', format: ['StrictPascalCase'] },
      { selector: 'enumMember', format: ['StrictPascalCase'] },
      {
        selector: 'objectLiteralProperty',
        format: null,
        modifiers: ['requiresQuotes'],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/no-unsafe-argument': 'off',
    // angular rules specified here because there is no recommended
    '@angular-eslint/component-class-suffix': 'error',
    '@angular-eslint/component-selector': [
      'error',
      { type: ['element', 'attribute'], prefix: 'ipo', style: 'kebab-case' },
    ],
    '@angular-eslint/contextual-lifecycle': 'error',
    '@angular-eslint/directive-class-suffix': 'error',
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'ipo', style: 'camelCase' },
    ],
    '@angular-eslint/no-conflicting-lifecycle': 'error',
    '@angular-eslint/no-forward-ref': 'error',
    '@angular-eslint/no-host-metadata-property': 'error',
    '@angular-eslint/no-input-rename': 'error',
    '@angular-eslint/no-inputs-metadata-property': 'error',
    '@angular-eslint/no-lifecycle-call': 'error',
    '@angular-eslint/no-output-native': 'error',
    '@angular-eslint/no-output-on-prefix': 'error',
    '@angular-eslint/no-output-rename': 'error',
    '@angular-eslint/no-outputs-metadata-property': 'error',
    '@angular-eslint/no-queries-metadata-property': 'error',
    '@angular-eslint/use-component-selector': 'error',
    '@angular-eslint/use-component-view-encapsulation': 'error',
    '@angular-eslint/use-injectable-provided-in': 'error',
    '@angular-eslint/use-lifecycle-interface': 'error',
    '@angular-eslint/use-pipe-transform-interface': 'error',
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@angular-eslint/no-lifecycle-call': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  ],
};
