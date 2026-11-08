import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientsService,
  userService,
  type BecomeMasterRequest,
  type UpdateMasterRequest,
  type UpdateUserRequest,
  type UserContext,
  type UserResponse,
} from '../../api';
import { qk } from '../queryKeys';

export function useMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.me(),
    queryFn: () => userService.getMe(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/** Shared onSuccess for mutations that return the fresh UserResponse. */
function useSetMe() {
  const queryClient = useQueryClient();
  return (user: UserResponse) => queryClient.setQueryData(qk.me(), user);
}

export function useUpdateMe() {
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (req: UpdateUserRequest) => userService.updateMe(req),
    onSuccess: setMe,
  });
}

export function useBecomeMaster() {
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (req: BecomeMasterRequest = {}) => userService.becomeMaster(req),
    onSuccess: setMe,
  });
}

export function useUpdateMaster() {
  const queryClient = useQueryClient();
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (req: UpdateMasterRequest) => userService.updateMaster(req),
    onSuccess: user => {
      setMe(user);
      queryClient.invalidateQueries({ queryKey: qk.masters.detail(user.id) });
    },
  });
}

/**
 * Switches the active mode (CLIENT / MASTER / ADMIN). Updates `me` and drops
 * every other cached query, since lists are scoped to the mode.
 */
export function useSwitchMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (context: UserContext) => userService.setActiveContext(context),
    onSuccess: ({ context }) => {
      queryClient.setQueryData<UserResponse>(qk.me(), prev => (prev ? { ...prev, context } : prev));
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] !== qk.me()[0],
      });
    },
  });
}

export function useClientProfile(clientId: number | undefined) {
  return useQuery({
    queryKey: qk.client(clientId ?? 0),
    queryFn: () => clientsService.getProfile(clientId!),
    enabled: clientId !== undefined,
  });
}
