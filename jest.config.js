module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/lib/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "apollo-typed-documents": "<rootDir>/src",
  },
};
