/** Admin-mode hooks: users, catalog requests, reports. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  type ApproveCatalogRequestRequest,
  type CatalogRequestStatus,
  type ReportStatus,
  type Uuid,
} from '../../api';
import { qk } from '../queryKeys';

// --- users -----------------------------------------------------------------

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: qk.admin.users(search),
    queryFn: () => adminService.listUsers(search || undefined),
  });
}

export function useAdminAdmins() {
  return useQuery({ queryKey: qk.admin.admins(), queryFn: adminService.listAdmins });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: qk.admin.usersAll() });
    queryClient.invalidateQueries({ queryKey: qk.admin.admins() });
  };
}

export function useBanUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      adminService.banUser(userId, reason),
    onSuccess: invalidate,
  });
}

export function useUnbanUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: number) => adminService.unbanUser(userId),
    onSuccess: invalidate,
  });
}

export function useGrantAdmin() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: number) => adminService.grantAdmin(userId),
    onSuccess: invalidate,
  });
}

export function useRevokeAdmin() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: number) => adminService.revokeAdmin(userId),
    onSuccess: invalidate,
  });
}

// --- catalog requests ------------------------------------------------------

export function useAdminCatalogRequests(status: CatalogRequestStatus = 'PENDING') {
  return useQuery({
    queryKey: qk.admin.catalogRequests(status),
    queryFn: () => adminService.listCatalogRequests(status),
  });
}

export function useApproveCatalogRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: ApproveCatalogRequestRequest & { id: Uuid }) =>
      adminService.approveCatalogRequest(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.catalogRequestsAll() });
      // Approval writes a new category/service into the live catalog.
      queryClient.invalidateQueries({ queryKey: qk.catalog() });
    },
  });
}

export function useRejectCatalogRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Uuid) => adminService.rejectCatalogRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admin.catalogRequestsAll() }),
  });
}

// --- reports ---------------------------------------------------------------

export function useAdminReports(status: ReportStatus = 'OPEN') {
  return useQuery({
    queryKey: qk.admin.reports(status),
    queryFn: () => adminService.listReports(status),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Uuid) => adminService.resolveReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.admin.reportsAll() }),
  });
}
