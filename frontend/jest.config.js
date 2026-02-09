const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

/** @type {import("jest").Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  // Keep Jest focused: tests live under ./tests
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  // Playwright E2E lives in tests/e2e and is executed via `npm run e2e`.
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
  // Only run unit/integration tests in Jest (avoid *.spec.ts Playwright files).
  testMatch: ["<rootDir>/tests/**/*.test.[tj]s?(x)"],
  // Ignore local backup folders that can break haste-map (seen in some workspaces).
  modulePathIgnorePatterns: ["<rootDir>/node_modules\\.bak\\..*"],
  watchPathIgnorePatterns: ["<rootDir>/node_modules\\.bak\\..*"],
}

module.exports = createJestConfig(customJestConfig)

