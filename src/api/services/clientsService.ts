/** `user/controller/ClientProfileController` — /api/clients/{id} */
import { http } from '../client';
import type { ClientProfileDto } from '../types';

export const clientsService = {
  getProfile: (clientId: number) => http.get<ClientProfileDto>(`/api/clients/${clientId}`),
};
