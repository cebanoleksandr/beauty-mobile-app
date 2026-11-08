/**
 * Admin-only endpoints (`AdminUserController`, `CatalogRequestController`,
 * `ReportController`). The backend checks `isAdmin` on every call.
 */
import { http } from '../client';
import type {
  AdminStatsResponse,
  ApproveCatalogRequestRequest,
  AuditLogEntryResponse,
  CatalogRequestResponse,
  CatalogRequestStatus,
  ReportResponse,
  ReportStatus,
  UserAdminResponse,
  Uuid,
} from '../types';

export const adminService = {
  // --- users -------------------------------------------------------------
  listUsers: (search?: string) => http.get<UserAdminResponse[]>('/api/admin/users', { query: { search } }),

  listAdmins: () => http.get<UserAdminResponse[]>('/api/admin/users/admins'),

  banUser: (userId: number, reason?: string) =>
    http.post<UserAdminResponse>(`/api/admin/users/${userId}/ban`, reason ? { reason } : undefined),

  unbanUser: (userId: number) => http.post<UserAdminResponse>(`/api/admin/users/${userId}/unban`),

  grantAdmin: (userId: number) => http.post<UserAdminResponse>(`/api/admin/users/${userId}/admin`),

  revokeAdmin: (userId: number) => http.delete<UserAdminResponse>(`/api/admin/users/${userId}/admin`),

  // --- catalog requests --------------------------------------------------
  listCatalogRequests: (status: CatalogRequestStatus = 'PENDING') =>
    http.get<CatalogRequestResponse[]>('/api/admin/catalog-requests', { query: { status } }),

  /** Approve with the admin-edited name (and optionally reassigned category). */
  approveCatalogRequest: (id: Uuid, req: ApproveCatalogRequestRequest) =>
    http.post<CatalogRequestResponse>(`/api/admin/catalog-requests/${id}/approve`, req),

  rejectCatalogRequest: (id: Uuid) =>
    http.post<CatalogRequestResponse>(`/api/admin/catalog-requests/${id}/reject`),

  // --- reports -----------------------------------------------------------
  listReports: (status: ReportStatus = 'OPEN') =>
    http.get<ReportResponse[]>('/api/admin/reports', { query: { status } }),

  resolveReport: (id: Uuid) => http.post<ReportResponse>(`/api/admin/reports/${id}/resolve`),

  // --- stats & audit -----------------------------------------------------
  /** Platform stats for the last `days` (1..365, UTC days). */
  stats: (days: number) => http.get<AdminStatsResponse>('/api/admin/stats', { query: { days } }),

  /** Newest admin actions first (max 200). */
  auditLog: (limit = 20) => http.get<AuditLogEntryResponse[]>('/api/admin/audit-log', { query: { limit } }),
};
