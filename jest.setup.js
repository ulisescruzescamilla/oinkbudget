// Gesture Handler 3 reads the worklets UI runtime on startup, which the
// web worklets implementation used under Jest doesn't provide.
jest.mock('react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings', () => ({
  installUIRuntimeBindings: () => {},
}));
