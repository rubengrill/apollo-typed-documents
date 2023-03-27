module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/lib/",
    "<rootDir>/node_modules/",
  ],
  collectCoverageFrom: ["src/**/*.ts"],
  transform: {
    "\\.(ts|js)$": "ts-jest"
  },
};
