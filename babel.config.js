module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // intl-messageformat (ICU messages for i18next) ships `static {}` class blocks,
    // which the React Native preset doesn't transform.
    '@babel/plugin-transform-class-static-block',
    // Build-time config: SLOTSY_API_URL=https://… is inlined into the bundle
    // (see src/api/config.ts). Only this variable — nothing else leaks in.
    ['transform-inline-environment-variables', { include: ['SLOTSY_API_URL'] }],
  ],
};
