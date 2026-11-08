/** `booking/controller/BookingFlowController` — /api/bookings/* */
import { ApiError, http } from '../client';
import type {
  BookingConflictResponse,
  BookingDetailResponse,
  BookingScope,
  CreateBookingRequest,
  RescheduleBookingRequest,
  Uuid,
} from '../types';

export const bookingsService = {
  list: (scope: BookingScope = 'as-client') =>
    http.get<BookingDetailResponse[]>('/api/bookings', { query: { scope } }),

  /** Client creates a PENDING booking. */
  create: (req: CreateBookingRequest) => http.post<BookingDetailResponse>('/api/bookings', req),

  get: (bookingId: Uuid) => http.get<BookingDetailResponse>(`/api/bookings/${bookingId}`),

  /** Master: PENDING → SCHEDULED. May throw a 409 conflict (see `getBookingConflict`). */
  approve: (bookingId: Uuid) => http.post<BookingDetailResponse>(`/api/bookings/${bookingId}/approve`),

  /** Master: PENDING → REJECTED. */
  reject: (bookingId: Uuid) => http.post<BookingDetailResponse>(`/api/bookings/${bookingId}/reject`),

  /** Client or master cancels. */
  cancel: (bookingId: Uuid) => http.post<BookingDetailResponse>(`/api/bookings/${bookingId}/cancel`),

  /** Master marks the client as a no-show. */
  markMissed: (bookingId: Uuid) => http.post<BookingDetailResponse>(`/api/bookings/${bookingId}/missed`),

  /** Master moves a booking. May throw a 409 conflict. */
  reschedule: (bookingId: Uuid, req: RescheduleBookingRequest) =>
    http.patch<BookingDetailResponse>(`/api/bookings/${bookingId}/reschedule`, req),
};

/** Extracts the conflict payload from a 409 thrown by approve/reschedule. */
export function getBookingConflict(error: unknown): BookingConflictResponse | null {
  if (error instanceof ApiError && error.isConflict && error.body && typeof error.body === 'object') {
    return error.body as BookingConflictResponse;
  }
  return null;
}
