/** Shared offer-form rules (same as the web app's become-master/types). */
import { i18n } from '../../i18n';
import type { CreateOfferRequest, ServicePointResponse, UpdateOfferRequest } from '../../api';

/** Selectable durations (minutes) — bookings occupy contiguous 30-min slots. */
export const DURATION_OPTIONS: readonly number[] = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

/** `30 min`, `1 h`, `1.5 h`. */
export function formatDurationOption(minutes: number): string {
  if (minutes < 60) return i18n.t('units.minutes', { value: minutes });
  const hours = minutes / 60;
  return i18n.t('master.durationHours', {
    value: Number.isInteger(hours) ? hours : hours.toLocaleString(i18n.language, { maximumFractionDigits: 1 }),
  });
}

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
  /** Set when an existing service point is reused. */
  existingPointId?: string;
}

export interface OfferFormValue {
  serviceDefinitionId: string;
  price: number;
  durationMinutes: number;
  description: string;
  location: LocationValue;
}

export type ServicePointOption = Pick<ServicePointResponse, 'id' | 'address' | 'lat' | 'lng'>;

function locationPayload(location: LocationValue): Pick<CreateOfferRequest, 'servicePointId' | 'newLocation'> {
  if (location.existingPointId) return { servicePointId: location.existingPointId };
  const address = location.address.trim();
  return address ? { newLocation: { address, lat: location.lat, lng: location.lng } } : {};
}

export function toCreateRequest(v: OfferFormValue): CreateOfferRequest {
  return {
    serviceDefinitionId: v.serviceDefinitionId,
    price: v.price,
    durationMinutes: v.durationMinutes,
    description: v.description.trim() || undefined,
    ...locationPayload(v.location),
  };
}

export function toUpdateRequest(v: OfferFormValue): UpdateOfferRequest {
  return {
    price: v.price,
    durationMinutes: v.durationMinutes,
    description: v.description.trim() || undefined,
    ...locationPayload(v.location),
  };
}
