import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogService, mastersService, type MasterSearchRequest } from '../../api';
import { qk } from '../queryKeys';

export function useCatalog() {
  return useQuery({
    queryKey: qk.catalog(),
    queryFn: catalogService.getCatalog,
    // Reference data — changes only when an admin approves a catalog request.
    staleTime: 30 * 60_000,
  });
}

export function useNearbyMasters(
  coords: { lat: number; lon: number } | null | undefined,
  radius?: number,
) {
  return useQuery({
    queryKey: qk.masters.nearby(coords?.lat ?? 0, coords?.lon ?? 0, radius),
    queryFn: () => mastersService.nearby(coords!.lat, coords!.lon, radius),
    enabled: !!coords,
    placeholderData: keepPreviousData,
  });
}

/** Map/list search. Pass `null` until the map center is known. */
export function useMasterSearch(req: MasterSearchRequest | null) {
  return useQuery({
    queryKey: qk.masters.search(req),
    queryFn: () => mastersService.search(req!),
    enabled: !!req,
    // Keep pins on screen while panning / changing filters.
    placeholderData: keepPreviousData,
  });
}

export function useMasterDetail(masterId: number | undefined) {
  return useQuery({
    queryKey: qk.masters.detail(masterId ?? 0),
    queryFn: () => mastersService.getDetail(masterId!),
    enabled: masterId !== undefined,
  });
}

export function useMasterAvailability(masterId: number | undefined) {
  return useQuery({
    queryKey: qk.masters.availability(masterId ?? 0),
    queryFn: () => mastersService.getAvailability(masterId!),
    enabled: masterId !== undefined,
    staleTime: 10_000,
  });
}

export function useMasterReviews(masterId: number | undefined) {
  return useQuery({
    queryKey: qk.masters.reviews(masterId ?? 0),
    queryFn: () => mastersService.getReviews(masterId!),
    enabled: masterId !== undefined,
  });
}
