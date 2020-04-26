module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/lib/",
    "<rootDir>/examples/cra/",
    "<rootDir>/examples/cra-ts/",
    "<rootDir>/node_modules/",
  ],
  collectCoverageFrom: ["src/**/*.ts"],
  moduleNameMapper: {
    "^apollo-typed-documents$": "<rootDir>/src",
  },
  transform: {
    "\\.(ts|js)$": "ts-jest",
    "\\.graphql$": "jest-transform-graphql",
  },
};
