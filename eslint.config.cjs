const eslint      = require("@eslint/js");
const tseslint    = require("typescript-eslint");
const stylistic  = require("@stylistic/eslint-plugin");
const globals     = require("globals");
const checkFile   = require("eslint-plugin-check-file");

const namingOptions = [
   "error",
   {
      selector: "default",
      format: ["camelCase"],
      leadingUnderscore: "allow" },
  {
      selector: "typeLike",
      format: ["PascalCase"] },
   {
      selector: "import",
      format: ["camelCase", "PascalCase"] },
   ];

const rules = {

   // Additional Standard ESLint rules:
   "curly": "error",
   "default-case-last": "error",
   "id-denylist": [ "error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined", "undefined" ],
   "id-match": "error",
   "new-parens": "error",
   "no-new": "error",
   "no-new-func": "error",
   "no-new-wrappers": "error",
   "no-octal-escape": "error",
   "no-param-reassign": "error",
   "no-promise-executor-return": "warn",
   "no-restricted-syntax": ["error", {
      selector: "AssignmentExpression[parent.type!='ExpressionStatement']",
      message: "Do not nest assignments" }],
   "no-sequences": "error",
   "no-template-curly-in-string": "error",
   "no-useless-backreference": "error",
   "no-useless-return": "error",
   "prefer-const": "error",
   "prefer-promise-reject-errors": "error",
   "require-atomic-updates": "error",

   // Modifications of default rules:
   "no-constant-condition": ["error", {checkLoops: false }],

   // Additional Typescript plugin rules:
   "@typescript-eslint/explicit-member-accessibility": "error",
   "@stylistic/member-delimiter-style": "error",
   "@typescript-eslint/naming-convention": namingOptions,
   "@typescript-eslint/no-base-to-string": "error",
   "@typescript-eslint/no-invalid-this": "error",                                    "no-invalid-this": "off",
   "@typescript-eslint/no-loop-func": "error",                                       "no-loop-func": "off",
   "@typescript-eslint/no-loss-of-precision": "error",                               "no-loss-of-precision": "off",
   "@typescript-eslint/no-redeclare": "error",                                       "no-redeclare": "off",
   "@typescript-eslint/no-shadow": "error",                                          "no-shadow": "off",
   "@typescript-eslint/only-throw-error": "error",
   "@typescript-eslint/no-unused-expressions": "error",                              "no-unused-expressions": "off",
   "@typescript-eslint/no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],      "no-unused-vars": "off",
   "@typescript-eslint/no-use-before-define": ["error", {functions: false, classes: false}], "no-use-before-define": "off",
   "@typescript-eslint/prefer-includes": "warn",
   "@typescript-eslint/prefer-nullish-coalescing": ["warn", {ignoreIfStatements: true}],
   "@typescript-eslint/prefer-optional-chain": "warn",
   "@typescript-eslint/require-await": "error",                                      "require-await": "off",
   "@stylistic/semi": "error",
   "@typescript-eslint/switch-exhaustiveness-check": ["error", {considerDefaultExhaustiveForUnions: true}],

   // Modifications of default rules:
   "@typescript-eslint/consistent-type-assertions": "off",
   "@typescript-eslint/explicit-module-boundary-types": "off",
   "@typescript-eslint/no-explicit-any": "off",
   "@typescript-eslint/no-inferrable-types": "off",
   "@typescript-eslint/no-non-null-assertion": "off",
   "@typescript-eslint/no-unnecessary-type-assertion": "off", // off because it does not work correctly
   "@typescript-eslint/no-unsafe-assignment": "off",
   "@typescript-eslint/no-unsafe-member-access": "off",
   "@typescript-eslint/restrict-plus-operands": "off",
   "@typescript-eslint/restrict-template-expressions": "off",
   "no-var": "off",                                     // @typescript-eslint/recommended switches this on

   // Check-file plugin rules:
   "check-file/filename-naming-convention": ["error", {"**/*.ts": "[A-Z]*"}],
   };

module.exports = tseslint.config({
   files: ["src/**/*.ts"],
   plugins: {
      "check-file": checkFile,
      "@stylistic": stylistic },
   languageOptions: {
   parserOptions: {
      project: "./tsconfig.json",
         warnOnUnsupportedTypeScriptVersion: false,
         },
      globals: {
        ...globals.browser }},
   extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      ],
   rules });
