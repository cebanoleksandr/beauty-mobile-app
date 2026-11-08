/** `admin/controller/CatalogRequestController` — master side */
import { http } from '../client';
import type { CatalogRequestResponse, CreateCatalogRequestRequest } from '../types';

export const catalogRequestsService = {
  /** Master asks admins to add a missing category or service. */
  create: (req: CreateCatalogRequestRequest) =>
    http.post<CatalogRequestResponse>('/api/master/catalog-requests', req),
};
