module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // intl-messageformat (ICU messages for i18next) ships `static {}` class blocks,
  // which the React Native preset doesn't transform.
  plugins: ['@babel/plugin-transform-class-static-block'],
};
