/** Master-mode hooks: offers, service points, onboarding, calendar slots, catalog requests. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  catalogRequestsService,
  masterOffersService,
  masterSlotsService,
  type BulkSlotRequest,
  type CreateCatalogRequestRequest,
  type CreateOfferRequest,
  type OnboardingRequest,
  type UpdateOfferRequest,
  type Uuid,
} from '../../api';
import { qk } from '../queryKeys';

// --- offers ----------------------------------------------------------------

export function useMasterOffers(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: qk.master.offers(), queryFn: masterOffersService.list, ...options });
}

export function useServicePoints(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.master.servicePoints(),
    queryFn: masterOffersService.listServicePoints,
    ...options,
  });
}

/** Offers and service points change together (an offer may create a new location). */
function useInvalidateOffers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: qk.master.offers() });
    queryClient.invalidateQueries({ queryKey: qk.master.servicePoints() });
    queryClient.invalidateQueries({ queryKey: qk.masters.all() });
  };
}

export function useCreateOffer() {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (req: CreateOfferRequest) => masterOffersService.create(req),
    onSuccess: invalidate,
  });
}

export function useUpdateOffer() {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: ({ offerId, ...req }: UpdateOfferRequest & { offerId: Uuid }) =>
      masterOffersService.update(offerId, req),
    onSuccess: invalidate,
  });
}

export function useDeleteOffer() {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (offerId: Uuid) => masterOffersService.delete(offerId),
    onSuccess: invalidate,
  });
}

export function useSubmitOnboarding() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (req: OnboardingRequest) => masterOffersService.submitOnboarding(req),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: qk.me() });
    },
  });
}

// --- slots -----------------------------------------------------------------

export function useMasterSlots(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: qk.master.slots(), queryFn: masterSlotsService.getMySlots, ...options });
}

function useInvalidateSlots() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: qk.master.slots() });
    queryClient.invalidateQueries({ queryKey: qk.masters.all() });
  };
}

export function useCreateSlots() {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: (req: BulkSlotRequest) => masterSlotsService.bulkCreate(req),
    onSuccess: invalidate,
  });
}

export function useSetSlotDisabled() {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: ({ slotId, disabled }: { slotId: Uuid; disabled: boolean }) =>
      masterSlotsService.setDisabled(slotId, disabled),
    onSuccess: invalidate,
  });
}

export function useDeleteSlot() {
  const invalidate = useInvalidateSlots();
  return useMutation({
    mutationFn: (slotId: Uuid) => masterSlotsService.delete(slotId),
    onSuccess: invalidate,
  });
}

// --- catalog requests ------------------------------------------------------

export function useCreateCatalogRequest() {
  return useMutation({
    mutationFn: (req: CreateCatalogRequestRequest) => catalogRequestsService.create(req),
  });
}
