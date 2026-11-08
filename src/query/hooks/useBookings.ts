import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  bookingsService,
  reviewsService,
  type BookingDetailResponse,
  type BookingScope,
  type CreateBookingRequest,
  type CreateReviewRequest,
  type RescheduleBookingRequest,
  type Uuid,
} from '../../api';
import { qk } from '../queryKeys';

export function useBookings(scope: BookingScope = 'as-client') {
  return useQuery({
    queryKey: qk.bookings.list(scope),
    queryFn: () => bookingsService.list(scope),
  });
}

export function useBooking(bookingId: Uuid | undefined) {
  return useQuery({
    queryKey: qk.bookings.detail(bookingId ?? ''),
    queryFn: () => bookingsService.get(bookingId!),
    enabled: !!bookingId,
  });
}

/**
 * Any booking change can move a slot between free/occupied, so refresh the
 * booking lists, the master's own calendar and the public availability.
 */
function syncBooking(queryClient: QueryClient, booking: BookingDetailResponse) {
  queryClient.setQueryData(qk.bookings.detail(booking.id), booking);
  queryClient.invalidateQueries({ queryKey: qk.bookings.all() });
  queryClient.invalidateQueries({ queryKey: qk.master.slots() });
  queryClient.invalidateQueries({ queryKey: qk.masters.availability(booking.masterId) });
}

function useBookingMutation<TVars>(mutationFn: (vars: TVars) => Promise<BookingDetailResponse>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: booking => syncBooking(queryClient, booking),
  });
}

export function useCreateBooking() {
  return useBookingMutation((req: CreateBookingRequest) => bookingsService.create(req));
}

/** May fail with 409 — read the details with `getBookingConflict(error)`. */
export function useApproveBooking() {
  return useBookingMutation((bookingId: Uuid) => bookingsService.approve(bookingId));
}

export function useRejectBooking() {
  return useBookingMutation((bookingId: Uuid) => bookingsService.reject(bookingId));
}

export function useCancelBooking() {
  return useBookingMutation((bookingId: Uuid) => bookingsService.cancel(bookingId));
}

export function useMarkBookingMissed() {
  return useBookingMutation((bookingId: Uuid) => bookingsService.markMissed(bookingId));
}

/** May fail with 409 — read the details with `getBookingConflict(error)`. */
export function useRescheduleBooking() {
  return useBookingMutation(({ bookingId, ...req }: RescheduleBookingRequest & { bookingId: Uuid }) =>
    bookingsService.reschedule(bookingId, req),
  );
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReviewRequest) => reviewsService.create(req),
    onSuccess: review => {
      queryClient.invalidateQueries({ queryKey: qk.bookings.all() });
      queryClient.invalidateQueries({ queryKey: qk.masters.detail(review.masterId) });
      queryClient.invalidateQueries({ queryKey: qk.masters.reviews(review.masterId) });
    },
  });
}
