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
    Camera: (() => {
      // The real CameraRef exposes imperative camera moves.
      const C = React.forwardRef((props, ref) => {
        React.useImperativeHandle(ref, () => ({ fitBounds: jest.fn(), zoomTo: jest.fn(), easeTo: jest.fn() }));
        return React.createElement(View, props);
      });
      C.displayName = 'Camera';
      return C;
    })(),
    Marker: passthrough('Marker'),
    UserLocation: passthrough('UserLocation'),
    GeoJSONSource: passthrough('GeoJSONSource'),
    Layer: passthrough('Layer'),
    LocationManager: {
      requestPermissions: jest.fn(async () => false),
      getCurrentPosition: jest.fn(async () => undefined),
    },
  };
});

// Tests assert the English copy; the app itself follows the device language.
require('./src/i18n').i18n.changeLanguage('en');

// In-memory Keychain/Keystore (react-native-keychain is a native module).
jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly' },
    STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
    __store: store,
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      store.set(options.service ?? 'default', { username, password, service: options.service });
      return { service: options.service, storage: 'mock' };
    }),
    getGenericPassword: jest.fn(async (options = {}) => store.get(options.service ?? 'default') ?? false),
    resetGenericPassword: jest.fn(async (options = {}) => store.delete(options.service ?? 'default')),
  };
});
