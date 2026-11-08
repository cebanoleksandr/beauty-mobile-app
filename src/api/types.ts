/**
 * TypeScript mirrors of the backend DTOs (`backend/src/main/java/com/app/mastersearch/** /dto`).
 *
 * Java → TS conventions:
 *  - UUID                 → string
 *  - Long / Integer / int → number (Telegram user ids fit in a JS number)
 *  - BigDecimal           → number (Jackson writes it as a JSON number)
 *  - LocalDateTime        → string, `YYYY-MM-DDTHH:mm:ss` (no zone, master's local time)
 *  - LocalDate            → string, `YYYY-MM-DD`
 *  - OffsetDateTime       → ISO-8601 string with offset
 *  - Map<String,String> catalog names → `Translations` ({ uk, en, ru }), resolve with `pickTranslation`
 */

export type Uuid = string;
export type LocalDateTime = string;
export type LocalDate = string;
export type IsoDateTime = string;

/** JSONB catalog name, e.g. `{ uk: 'Волосся', en: 'Hair', ru: 'Волосы' }`. */
export type Translations = Record<string, string>;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserContext = 'CLIENT' | 'MASTER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'MISSED';

export type BookingScope = 'as-client' | 'as-master';

export type CatalogRequestKind = 'CATEGORY' | 'SERVICE';
export type CatalogRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportStatus = 'OPEN' | 'RESOLVED';

// ---------------------------------------------------------------------------
// user/
// ---------------------------------------------------------------------------

export interface MasterDto {
  bio: string | null;
  socialLinks: Record<string, string> | null;
  rating: number | null;
  searchRadiusMeters: number | null;
  avatarUrl: string | null;
}

export interface UserResponse {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  context: UserContext;
  masterProfile: MasterDto | null;
  telegramLinked: boolean;
  isAdmin: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
}

export interface BecomeMasterRequest {
  bio?: string;
}

export interface UpdateMasterRequest {
  bio?: string;
  socialLinks?: Record<string, string>;
  /** 100..50000 */
  searchRadiusMeters?: number;
}

export interface ActiveContextResponse {
  context: UserContext;
}

export interface ClientProfileDto {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
}

export interface ServicePointResponse {
  id: Uuid;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface OfferResponse {
  id: Uuid;
  serviceDefinitionId: Uuid;
  serviceName: Translations;
  categoryId: Uuid;
  categoryName: Translations;
  price: number;
  durationMinutes: number;
  description: string | null;
  available: boolean;
  servicePoint: ServicePointResponse | null;
}

export interface NewLocationEntry {
  address: string;
  lat?: number;
  lng?: number;
}

export interface CreateOfferRequest {
  serviceDefinitionId: Uuid;
  price: number;
  durationMinutes: number;
  description?: string;
  /** Reuse an existing service point… */
  servicePointId?: Uuid;
  /** …or create a new one. */
  newLocation?: NewLocationEntry;
}

export interface UpdateOfferRequest {
  price?: number;
  durationMinutes?: number;
  description?: string;
  servicePointId?: Uuid;
  newLocation?: NewLocationEntry;
}

/** Onboarding uses snake_case field names on the wire. */
export interface OnboardingServiceEntry {
  service_id: Uuid;
  price: number;
  duration_minutes: number;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface OnboardingRequest {
  services: OnboardingServiceEntry[];
}

export interface OnboardingResponse {
  success: boolean;
  role: string;
}

// ---------------------------------------------------------------------------
// catalog/
// ---------------------------------------------------------------------------

export interface ServiceDefinitionDto {
  id: Uuid;
  name: Translations;
}

export interface CategoryDto {
  id: Uuid;
  name: Translations;
  definitions: ServiceDefinitionDto[];
}

// ---------------------------------------------------------------------------
// geo/
// ---------------------------------------------------------------------------

export interface MasterCardDto {
  id: number;
  pinId: string;
  displayName: string;
  rating: number | null;
  distanceMeters: number | null;
  avatarUrl: string | null;
  lat: number;
  lng: number;
  startingPrice: number | null;
  category: Translations | null;
  services: Translations[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MasterSearchRequest {
  search_query?: string;
  sort_by?: string;
  category_ids?: string[];
  favorites_only?: boolean;
  center: LatLng;
  /** 500..20000, default 5000 */
  radius_meters?: number;
}

export interface MasterServiceDto {
  id: string;
  name: Translations;
  group: Translations;
  durationMinutes: number;
  price: number;
}

export interface MasterReviewDto {
  id: string;
  author: string;
  rating: number;
  text: string | null;
  date: string;
}

export interface MasterDetailDto {
  id: number;
  displayName: string;
  username: string | null;
  title: Translations | null;
  category: Translations | null;
  rating: number | null;
  reviewCount: number;
  distanceMeters: number | null;
  avatarUrl: string | null;
  verified: boolean;
  bio: string | null;
  portfolio: string[];
  services: MasterServiceDto[];
  reviews: MasterReviewDto[];
}

export interface TimeSlotDto {
  /** `HH:mm` */
  time: string;
  available: boolean;
}

export interface AvailabilityDayDto {
  /** `YYYY-MM-DD` */
  date: LocalDate;
  slots: TimeSlotDto[];
}

// ---------------------------------------------------------------------------
// booking/
// ---------------------------------------------------------------------------

export interface BookingDetailResponse {
  id: Uuid;
  masterId: number;
  masterName: string;
  masterAvatarUrl: string | null;
  masterUsername: string | null;
  masterAverageRating: number | null;
  clientId: number;
  clientName: string;
  clientAvatarUrl: string | null;
  clientAverageRating: number | null;
  offerId: Uuid;
  serviceName: Translations;
  price: number;
  durationMinutes: number;
  servicePointAddress: string | null;
  scheduledTime: LocalDateTime;
  status: BookingStatus;
  clientReviewRating: number | null;
  clientReviewText: string | null;
  masterReviewRating: number | null;
  masterReviewText: string | null;
}

export interface CreateBookingRequest {
  masterId: number;
  offerId: Uuid;
  servicePointId?: Uuid;
  scheduledTime: LocalDateTime;
}

export interface RescheduleBookingRequest {
  scheduledTime: LocalDateTime;
  durationMinutes: number;
}

/** Body of a 409 from the booking flow. */
export interface BookingConflictResponse {
  message: string;
  conflictingBookingIds: Uuid[];
}

/** STOMP payload on `/user/queue/bookings`. */
export interface BookingRealtimeMessage {
  bookingId: Uuid;
  masterId: number;
  status: BookingStatus;
  scheduledTime: LocalDateTime;
}

export interface SlotResponse {
  id: Uuid;
  startTime: LocalDateTime;
  occupied: boolean;
  disabled: boolean;
}

export interface BulkSlotRequest {
  date: LocalDate;
  startHour: number;
  endHour: number;
}

// ---------------------------------------------------------------------------
// review/
// ---------------------------------------------------------------------------

export interface CreateReviewRequest {
  bookingId: Uuid;
  /** 1..5 */
  rating: number;
  text?: string;
  /** Optional complaint about the other party, forwarded to admin reports. */
  reportMessage?: string;
}

export interface ReviewResponse {
  id: Uuid;
  masterId: number;
  clientDisplayName: string;
  rating: number;
  text: string | null;
  createdAt: IsoDateTime;
}

// ---------------------------------------------------------------------------
// media/
// ---------------------------------------------------------------------------

/** Presigned S3/MinIO POST: send `fields` + the file as multipart to `url`. */
export interface PresignedUploadResponse {
  url: string;
  fields: Record<string, string>;
  objectKey: string;
  maxBytes: number;
  expiresInSeconds: number;
}

// ---------------------------------------------------------------------------
// admin/
// ---------------------------------------------------------------------------

export interface CreateCatalogRequestRequest {
  kind: CatalogRequestKind;
  proposedName: string;
  /** Required for SERVICE requests. */
  categoryId?: Uuid;
}

export interface ApproveCatalogRequestRequest {
  /** Admin-edited name (auto-translated by DeepL on approve). */
  name: string;
  /** Reassigned category for SERVICE requests. */
  categoryId?: Uuid;
}

export interface CatalogRequestResponse {
  id: Uuid;
  requesterId: number;
  requesterName: string;
  kind: CatalogRequestKind;
  proposedName: string;
  categoryId: Uuid | null;
  categoryName: Translations | null;
  status: CatalogRequestStatus;
  createdAt: IsoDateTime;
}

export interface ReportResponse {
  id: Uuid;
  bookingId: Uuid;
  reporterId: number;
  reporterName: string;
  reportedUserId: number;
  reportedUserName: string;
  message: string;
  status: ReportStatus;
  createdAt: IsoDateTime;
}

export interface UserAdminResponse {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  bannedReason: string | null;
}

export interface BanUserRequest {
  reason?: string;
}

// --- stats & audit log (`AdminStatsController`, `AuditLogController`) -------

export interface AdminStatsResponse {
  periodDays: number;
  from: LocalDate;
  users: {
    total: number;
    newInPeriod: number;
    masters: number;
    activeDay: number;
    activeWeek: number;
    activeMonth: number;
  };
  bookings: {
    created: number;
    approved: number;
    rejectedByMaster: number;
    autoRejected: number;
    canceled: number;
    completed: number;
    missed: number;
    medianResponseMinutes: number | null;
  };
  dailyBookings: { date: LocalDate; count: number }[];
  topCategories: { id: Uuid; name: Translations; bookings: number }[];
  topMasters: {
    id: number;
    name: string | null;
    completed: number;
    rating: number;
  }[];
  moderation: {
    openReports: number;
    pendingCatalogRequests: number;
    bansInPeriod: number;
  };
}

export type AuditAction =
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'ADMIN_GRANTED'
  | 'ADMIN_REVOKED'
  | 'CATALOG_REQUEST_APPROVED'
  | 'CATALOG_REQUEST_REJECTED'
  | 'REPORT_RESOLVED';

export interface AuditLogEntryResponse {
  id: Uuid;
  actorId: number;
  actorName: string | null;
  action: AuditAction;
  targetType: 'USER' | 'CATALOG_REQUEST' | 'REPORT';
  targetId: string;
  details: Record<string, unknown> | null;
  createdAt: IsoDateTime;
}

