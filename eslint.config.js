const { defineConfig } = require("eslint/config");
const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");
const angularEslint = require("@angular-eslint/eslint-plugin");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
    )),

    plugins: {
        "@angular-eslint": angularEslint,
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(importPlugin),
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
        },
    },

    settings: {
        "import/resolver": {
            typescript: {
                project: "tsconfig.json",
            },

            node: {
                extensions: [".ts", ".d.ts"],
            },
        },
    },

    rules: {
        eqeqeq: "error",
        curly: "error",
        "no-nested-ternary": "error",
        indent: "off",
        "@typescript-eslint/indent": "off",
        "no-prototype-builtins": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",

        "@typescript-eslint/naming-convention": ["error", {
            selector: "default",
            format: ["strictCamelCase"],
            leadingUnderscore: "allow",
        }, {
            selector: "variable",
            format: ["strictCamelCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
        }, {
            selector: "typeLike",
            format: ["StrictPascalCase"],
        }, {
            selector: "enumMember",
            format: ["StrictPascalCase"],
        }, {
            selector: "objectLiteralProperty",
            format: null,
            modifiers: ["requiresQuotes"],
        }],

        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/no-unsafe-argument": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "@angular-eslint/component-class-suffix": "error",

        "@angular-eslint/component-selector": ["error", {
            type: ["element", "attribute"],
            prefix: "ipo",
            style: "kebab-case",
        }],

        "@angular-eslint/contextual-lifecycle": "error",
        "@angular-eslint/directive-class-suffix": "error",

        "@angular-eslint/directive-selector": ["error", {
            type: "attribute",
            prefix: "ipo",
            style: "camelCase",
        }],

        "@angular-eslint/no-conflicting-lifecycle": "error",
        "@angular-eslint/no-forward-ref": "error",
        "@angular-eslint/no-input-rename": "error",
        "@angular-eslint/no-inputs-metadata-property": "error",
        "@angular-eslint/no-lifecycle-call": "error",
        "@angular-eslint/no-output-native": "error",
        "@angular-eslint/no-output-on-prefix": "error",
        "@angular-eslint/no-output-rename": "error",
        "@angular-eslint/no-outputs-metadata-property": "error",
        "@angular-eslint/no-queries-metadata-property": "error",
        "@angular-eslint/use-component-selector": "error",
        "@angular-eslint/use-component-view-encapsulation": "error",
        "@angular-eslint/use-injectable-provided-in": "error",
        "@angular-eslint/use-lifecycle-interface": "error",
        "@angular-eslint/use-pipe-transform-interface": "error",
    },
}, {
    files: ["**/*.spec.ts"],

    rules: {
        "@angular-eslint/no-lifecycle-call": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
    },
}]);
