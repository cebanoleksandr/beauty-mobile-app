/**
 * Live booking updates over STOMP (`/ws`, relayed through RabbitMQ — see the
 * backend's WebSocketConfig). Same design as the web app's
 * core/realtime/socket.ts: one connection after sign-in; any code can call
 * `subscribeMasterAvailability()` imperatively.
 *
 * Auth travels in the STOMP CONNECT frame as the mobile session
 * (`Authorization: Bearer <token>`); the server drops the socket when the
 * session is logged out, expires or the user is banned.
 */
import { Client, type StompSubscription } from '@stomp/stompjs';
import type { BookingRealtimeMessage } from '../api';
import { getApiBaseUrl } from '../api';
import { sessionStore } from '../auth/sessionStore';
import { onAvailabilityChanged, onBookingChanged, onResync } from './events';
import { realtimeStatus } from './status';
import { ensureTextCodec } from './textCodec';

export function wsUrl(apiBaseUrl = getApiBaseUrl()): string {
  return apiBaseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
}

let client: Client | null = null;
// Runs on every (re)connect: STOMP drops subscriptions with the socket.
const onEveryConnect: Array<() => void> = [];
// Masters whose availability is watched (ref-counted), refetched after a reconnect.
const watchedMasters = new Map<number, number>();
let hasConnectedBefore = false;

/** Connects once; a no-op if already connected or signed out. */
export function connectRealtime(): void {
  const authorization = sessionStore.authorization;
  if (client || !authorization) return;
  ensureTextCodec();

  client = new Client({
    brokerURL: wsUrl(),
    connectHeaders: { Authorization: authorization },
    reconnectDelay: 5000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
    // React Native's WebSocket mangles the NULL byte that terminates STOMP
    // frames in text mode — the documented workaround for RN:
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    onWebSocketClose: () => realtimeStatus.setConnected(false),
    onStompError: frame => {
      console.warn('[realtime] STOMP error', frame.headers.message);
    },
    onConnect: () => {
      realtimeStatus.setConnected(true);
      client?.subscribe('/user/queue/bookings', frame => {
        let msg: BookingRealtimeMessage | undefined;
        try {
          msg = JSON.parse(frame.body) as BookingRealtimeMessage;
        } catch {
          // Unparseable payload: still refresh the lists, just not per master.
        }
        onBookingChanged(msg);
      });
      onEveryConnect.forEach(fn => fn());
      // Whatever changed while we were offline never reached us: catch up.
      if (hasConnectedBefore) resyncRealtime();
      hasConnectedBefore = true;
    },
  });
  client.activate();
}

export function disconnectRealtime(): void {
  client?.deactivate();
  client = null;
  hasConnectedBefore = false;
  realtimeStatus.setConnected(false);
}

/** Refetch live data (e.g. the app returned to the foreground). */
export function resyncRealtime(): void {
  onResync(watchedMasters.keys());
}

/** Live availability for one master; call the returned function to stop. */
export function subscribeMasterAvailability(masterId: number): () => void {
  let sub: StompSubscription | null = null;
  const subscribe = () => {
    sub?.unsubscribe();
    sub = client?.subscribe(`/topic/masters.${masterId}.availability`, () => onAvailabilityChanged(masterId)) ?? null;
  };

  watchedMasters.set(masterId, (watchedMasters.get(masterId) ?? 0) + 1);
  onEveryConnect.push(subscribe);
  if (client?.connected) subscribe();

  return () => {
    try {
      sub?.unsubscribe();
    } catch {
      // socket already gone
    }
    const idx = onEveryConnect.indexOf(subscribe);
    if (idx !== -1) onEveryConnect.splice(idx, 1);
    const n = (watchedMasters.get(masterId) ?? 1) - 1;
    if (n <= 0) watchedMasters.delete(masterId);
    else watchedMasters.set(masterId, n);
  };
}
