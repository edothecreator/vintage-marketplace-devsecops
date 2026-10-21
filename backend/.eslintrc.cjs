// ESLint configuration
// Practice: P20 Secure coding (Tier 2)
//
// eslint-plugin-security provides static detection of common insecure
// JavaScript/Node patterns. It is one of the SAST-adjacent tools cited in
// Prates & Pereira (listed under the compliance/SAST tooling). It runs here
// in the backend lint step and again in the CI SAST stage (Phase 5).

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "security"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:security/recommended-legacy",
    "prettier",
  ],
  rules: {
    // --- Type safety (defends against P57 type confusion) ---
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "eqeqeq": ["error", "always"], // ASVS 15.3.5 strict equality

    // --- Security plugin: keep these loud ---
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-child-process": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-unsafe-regex": "error",

    // --- Hygiene ---
    "no-console": "warn", // use the pino logger, not console
    "no-param-reassign": "error",
  },
  overrides: [
    {
      files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "security/detect-object-injection": "off",
      },
    },
    {
      files: ["prisma/seed.ts"],
      rules: {
        "no-console": "off", // the seed script reports progress to stdout
      },
    },
  ],
  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.cjs"],
};
