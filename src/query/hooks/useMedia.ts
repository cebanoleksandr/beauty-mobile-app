import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService, type LocalFile, type MediaTarget } from '../../api';
import { qk } from '../queryKeys';

/** Uploads an avatar/portfolio photo; resolves with the stored object key. */
export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ target, file }: { target: MediaTarget; file: LocalFile }) =>
      mediaService.upload(target, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.me() });
      queryClient.invalidateQueries({ queryKey: qk.masters.all() });
    },
  });
}
