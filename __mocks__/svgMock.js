// Jest stand-in for `.svg` imports (Metro's svg transformer isn't used in tests).
const React = require('react');
const { View } = require('react-native');

module.exports = function SvgMock(props) {
  return React.createElement(View, props);
};
