/* global jest */
// Native modules that don't exist in the Jest environment.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = name => {
    const C = React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
    C.displayName = name;
    return C;
  };
  return {
    Map: passthrough('Map'),
    Camera: passthrough('Camera'),
    Marker: passthrough('Marker'),
    UserLocation: passthrough('UserLocation'),
    LocationManager: {
      requestPermissions: jest.fn(async () => false),
      getCurrentPosition: jest.fn(async () => undefined),
    },
  };
});
