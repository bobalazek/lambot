module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/__fixtures__',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/data',
  ],
};
