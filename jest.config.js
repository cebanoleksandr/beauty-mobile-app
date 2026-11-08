module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.afterEnv.js'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    // The package's ESM build is .mjs, which the RN preset doesn't transform.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-svg|react-native-safe-area-context|@maplibre|@react-native-async-storage|intl-messageformat|@formatjs|i18next|i18next-icu|react-i18next)/)',
  ],
};
