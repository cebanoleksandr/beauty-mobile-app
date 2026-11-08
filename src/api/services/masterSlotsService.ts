/** `booking/controller/SlotManagementController` — /api/v1/master/slots (master mode only) */
import { http } from '../client';
import type { BulkSlotRequest, SlotResponse, Uuid } from '../types';

export const masterSlotsService = {
  getMySlots: () => http.get<SlotResponse[]>('/api/v1/master/slots'),

  /** Opens hourly slots on `date` from `startHour` (inclusive) to `endHour`. */
  bulkCreate: (req: BulkSlotRequest) => http.post<SlotResponse[]>('/api/v1/master/slots', req),

  setDisabled: (slotId: Uuid, disabled: boolean) =>
    http.patch<SlotResponse>(`/api/v1/master/slots/${slotId}`, { disabled }),

  delete: (slotId: Uuid) => http.delete(`/api/v1/master/slots/${slotId}`),
};
