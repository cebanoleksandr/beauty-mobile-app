/** Realtime socket: auth, invalidation table, reconnect resync, availability topics (fake STOMP client). */
interface FakeSub {
  destination: string;
  handler: (frame: { body: string }) => void;
  unsubscribe: jest.Mock;
}
interface FakeConfig {
  brokerURL: string;
  connectHeaders: Record<string, string>;
  forceBinaryWSFrames: boolean;
  appendMissingNULLonIncoming: boolean;
  onConnect: () => void;
  onWebSocketClose: () => void;
}
interface FakeClient {
  config: FakeConfig;
  connected: boolean;
  subs: FakeSub[];
  activate: jest.Mock;
  deactivate: jest.Mock;
  open(): void;
  drop(): void;
}

const instances: FakeClient[] = [];

jest.mock('@stomp/stompjs', () => ({
  Client: class {
    config: FakeConfig;
    connected = false;
    subs: FakeSub[] = [];
    activate = jest.fn();
    deactivate = jest.fn();
    constructor(config: FakeConfig) {
      this.config = config;
      instances.push(this as unknown as FakeClient);
    }
    subscribe(destination: string, handler: FakeSub['handler']) {
      const sub = { destination, handler, unsubscribe: jest.fn() };
      this.subs.push(sub);
      return sub;
    }
    open() {
      this.connected = true;
      this.config.onConnect();
    }
    drop() {
      this.connected = false;
      this.config.onWebSocketClose();
    }
  },
}));

function load() {
  jest.resetModules();
  instances.length = 0;
  const socket = require('../src/realtime/socket') as typeof import('../src/realtime/socket');
  const { sessionStore } = require('../src/auth/sessionStore') as typeof import('../src/auth/sessionStore');
  const { queryClient, qk } = require('../src/query') as typeof import('../src/query');
  const { realtimeStatus } = require('../src/realtime/status') as typeof import('../src/realtime/status');
  const spy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const invalidated = () => spy.mock.calls.map(([f]) => JSON.stringify(f?.queryKey));
  const client = () => instances[0];
  return { socket, sessionStore, qk, realtimeStatus, spy, invalidated, client };
}

afterEach(() => jest.restoreAllMocks());

test('no session → no connection', () => {
  const { socket } = load();
  socket.connectRealtime();
  expect(instances).toHaveLength(0);
});

test('connects once to /ws with the Bearer session and the RN frame workarounds', () => {
  const { socket, sessionStore, client } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  socket.connectRealtime();
  expect(instances).toHaveLength(1);
  expect(client().config.brokerURL).toMatch(/^ws:\/\/.+\/ws$/);
  expect(client().config.connectHeaders).toEqual({ Authorization: 'Bearer tok' });
  expect(client().config.forceBinaryWSFrames).toBe(true);
  expect(client().config.appendMissingNULLonIncoming).toBe(true);
  expect(client().activate).toHaveBeenCalledTimes(1);
});

test('wsUrl swaps the scheme', () => {
  const { socket } = load();
  expect(socket.wsUrl('https://api.slotly.app/')).toBe('wss://api.slotly.app/ws');
  expect(socket.wsUrl('http://10.0.2.2:8080')).toBe('ws://10.0.2.2:8080/ws');
});

test('tracks connection status (drives the polling fallback)', () => {
  const { socket, sessionStore, client, realtimeStatus } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  client().open();
  expect(realtimeStatus.connected).toBe(true);
  client().drop();
  expect(realtimeStatus.connected).toBe(false);
});

test('a booking message refreshes booking lists, slots and that master; garbage still refreshes lists', () => {
  const { socket, sessionStore, client, invalidated, qk } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  client().open();
  const sub = client().subs.find(s => s.destination === '/user/queue/bookings')!;

  sub.handler({ body: JSON.stringify({ bookingId: 'b', masterId: 9, status: 'SCHEDULED', scheduledTime: 't' }) });
  expect(invalidated()).toEqual([
    JSON.stringify(qk.bookings.all()),
    JSON.stringify(qk.master.slots()),
    JSON.stringify(qk.masters.availability(9)),
  ]);

  const before = invalidated().length;
  sub.handler({ body: 'not json' });
  expect(invalidated().length).toBe(before + 2);
});

test('resyncs after a reconnect but not on the first connect', () => {
  const { socket, sessionStore, client, spy } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  client().open();
  expect(spy).not.toHaveBeenCalled();
  client().drop();
  client().open();
  expect(spy).toHaveBeenCalled();
});

test('availability: subscribes after connect, re-subscribes on reconnect, stops after the last unsubscribe', () => {
  const { socket, sessionStore, client, invalidated, qk } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  const stop = socket.subscribeMasterAvailability(7); // before the socket is up
  const topic = () => client().subs.filter(s => s.destination === '/topic/masters.7.availability');
  expect(topic()).toHaveLength(0);

  client().open();
  expect(topic()).toHaveLength(1);
  topic()[0].handler({ body: '7' });
  expect(invalidated()).toContain(JSON.stringify(qk.masters.availability(7)));

  client().drop();
  client().open();
  expect(topic()).toHaveLength(2);

  stop();
  client().drop();
  client().open();
  expect(topic()).toHaveLength(2);
});

test('disconnect deactivates and marks offline', () => {
  const { socket, sessionStore, client, realtimeStatus } = load();
  sessionStore.set('tok');
  socket.connectRealtime();
  client().open();
  socket.disconnectRealtime();
  expect(client().deactivate).toHaveBeenCalled();
  expect(realtimeStatus.connected).toBe(false);
});

test('UTF-8 decoder fallback', () => {
  const { Utf8Decoder } = require('../src/realtime/textCodec') as typeof import('../src/realtime/textCodec');
  const text = 'Привіт, 💅 café';
  const bytes = new (
    globalThis as unknown as { TextEncoder: new () => { encode(s: string): Uint8Array } }
  ).TextEncoder().encode(text);
  expect(new Utf8Decoder().decode(bytes)).toBe(text);
  expect(new Utf8Decoder().decode(bytes.buffer as ArrayBuffer)).toBe(text);
});
