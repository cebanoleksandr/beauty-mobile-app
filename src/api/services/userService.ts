/** `user/controller/UserController` — /api/user/* */
import { http, resolveApiUrl } from '../client';
import type {
  ActiveContextResponse,
  BecomeMasterRequest,
  UpdateMasterRequest,
  UpdateUserRequest,
  UserContext,
  UserResponse,
} from '../types';

export const userService = {
  /** Current user (upserted from Telegram initData on every request). */
  getMe: (opts?: { credential?: string }) =>
    http.get<UserResponse>(
      '/api/user/me',
      // Lets sign-in verify a credential before it is stored in the session.
      opts?.credential ? { headers: { Authorization: `tma ${opts.credential}` } } : undefined,
    ),

  updateMe: (req: UpdateUserRequest) => http.put<UserResponse>('/api/user/me', req),

  becomeMaster: (req: BecomeMasterRequest = {}) =>
    http.post<UserResponse>('/api/user/me/become-master', req),

  updateMaster: (req: UpdateMasterRequest) => http.put<UserResponse>('/api/user/me/master', req),

  /** Persists the active mode server-side (CLIENT / MASTER / ADMIN). */
  setActiveContext: (context: UserContext) =>
    http.put<ActiveContextResponse>('/api/user/me/active-role', { context }),

  /** Public avatar URL (no auth required) — use directly as an Image source. */
  photoUrl: (userId: number) => resolveApiUrl(`/api/user/${userId}/photo`)!,
};
