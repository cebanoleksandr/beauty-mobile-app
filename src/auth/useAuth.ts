import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setCredentialProvider, setUnauthorizedHandler, userService, type UserResponse } from '../api';
import { qk } from '../query';
import { sessionStore } from './sessionStore';
import { requestTelegramCredential } from './telegramAuth';

// Wire the HTTP client to the session once, at module load.
setCredentialProvider(() => sessionStore.credential);
setUnauthorizedHandler(() => sessionStore.clear());

/**
 * "Continue with Telegram": gets a credential, verifies it against
 * `GET /api/user/me` (which also upserts the user), seeds the `me` cache,
 * and only then flips the session to signed-in.
 */
export function useTelegramSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<UserResponse> => {
      const credential = await requestTelegramCredential();
      const me = await userService.getMe({ credential });
      queryClient.setQueryData(qk.me(), me);
      sessionStore.set(credential);
      return me;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return () => {
    sessionStore.clear();
    queryClient.clear();
  };
}
