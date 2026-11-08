/** `geo/controller/MasterGeoController` + master reviews — /api/masters/* */
import { http } from '../client';
import type {
  AvailabilityDayDto,
  MasterCardDto,
  MasterDetailDto,
  MasterSearchRequest,
  ReviewResponse,
} from '../types';

export const mastersService = {
  /** Masters within `radius` meters (100..50000, default 5000). */
  nearby: (lat: number, lon: number, radius?: number) =>
    http.get<MasterCardDto[]>('/api/masters/nearby', { query: { lat, lon, radius } }),

  search: (req: MasterSearchRequest) => http.post<MasterCardDto[]>('/api/masters/search', req),

  getDetail: (masterId: number) => http.get<MasterDetailDto>(`/api/masters/${masterId}`),

  getAvailability: (masterId: number) =>
    http.get<AvailabilityDayDto[]>(`/api/masters/${masterId}/availability`),

  getReviews: (masterId: number) => http.get<ReviewResponse[]>(`/api/masters/${masterId}/reviews`),
};
