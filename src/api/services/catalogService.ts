/** `catalog/controller/CatalogController` — GET /api/catalog */
import { http } from '../client';
import type { CategoryDto } from '../types';

export const catalogService = {
  /** Full category → service-definition tree. Names are JSONB translations. */
  getCatalog: () => http.get<CategoryDto[]>('/api/catalog'),
};
