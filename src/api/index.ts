export * from './types';
export {
  ApiError,
  NetworkError,
  http,
  resolveApiUrl,
  setCredentialProvider,
  setUnauthorizedHandler,
} from './client';
export { getApiBaseUrl, setApiBaseUrl } from './config';

export { userService } from './services/userService';
export { mastersService } from './services/mastersService';
export { catalogService } from './services/catalogService';
export { bookingsService, getBookingConflict } from './services/bookingsService';
export { masterSlotsService } from './services/masterSlotsService';
export { masterOffersService } from './services/masterOffersService';
export { reviewsService } from './services/reviewsService';
export { clientsService } from './services/clientsService';
export { mediaService } from './services/mediaService';
export type { LocalFile, MediaTarget } from './services/mediaService';
export { catalogRequestsService } from './services/catalogRequestsService';
export { adminService } from './services/adminService';
