/* global afterAll */
// TanStack Query keeps garbage-collection timers alive; clear caches so Jest can exit.
afterAll(() => {
  require('./src/query').queryClient.clear();
});
