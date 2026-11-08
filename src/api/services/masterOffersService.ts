/**
 * `user/controller/MasterOfferController` + `MasterOnboardingController`
 * — /api/v1/master/* (master mode only)
 */
import { http } from '../client';
import type {
  CreateOfferRequest,
  OfferResponse,
  OnboardingRequest,
  OnboardingResponse,
  ServicePointResponse,
  UpdateOfferRequest,
  Uuid,
} from '../types';

export const masterOffersService = {
  list: () => http.get<OfferResponse[]>('/api/v1/master/offers'),

  create: (req: CreateOfferRequest) => http.post<OfferResponse>('/api/v1/master/offers', req),

  update: (offerId: Uuid, req: UpdateOfferRequest) =>
    http.put<OfferResponse>(`/api/v1/master/offers/${offerId}`, req),

  delete: (offerId: Uuid) => http.delete(`/api/v1/master/offers/${offerId}`),

  listServicePoints: () => http.get<ServicePointResponse[]>('/api/v1/master/service-points'),

  /** First-time master setup: creates the initial offers in one go. */
  submitOnboarding: (req: OnboardingRequest) =>
    http.post<OnboardingResponse>('/api/v1/master/onboarding', req),
};
