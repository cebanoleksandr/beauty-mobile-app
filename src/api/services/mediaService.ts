/**
 * `media/controller/MediaController` — /api/media/*
 *
 * Two-step upload: ask the backend for a presigned MinIO POST, then send the
 * file straight to MinIO as multipart form data.
 */
import { http, NetworkError } from '../client';
import type { PresignedUploadResponse } from '../types';

export type MediaTarget = 'master/avatar' | 'master/photo' | 'client/avatar';

/** A local file as returned by an image picker. */
export interface LocalFile {
  uri: string;
  /** e.g. `image/jpeg` */
  type: string;
  name?: string;
  size?: number;
}

export const mediaService = {
  presign: (target: MediaTarget, contentType: string) =>
    http.post<PresignedUploadResponse>(`/api/media/${target}`, undefined, { query: { contentType } }),

  /** Presigns and uploads; resolves with the stored object key. */
  async upload(target: MediaTarget, file: LocalFile): Promise<string> {
    const presigned = await mediaService.presign(target, file.type);
    if (file.size !== undefined && file.size > presigned.maxBytes) {
      throw new Error(`File is too large (max ${Math.round(presigned.maxBytes / 1024 / 1024)} MB)`);
    }

    const form = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => form.append(k, v));
    // S3 POST policy requires the file to be the last field.
    form.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name ?? presigned.objectKey.split('/').pop() ?? 'upload',
    } as unknown as Blob);

    let response: Response;
    try {
      response = await fetch(presigned.url, { method: 'POST', body: form });
    } catch (e) {
      throw new NetworkError('Upload failed', e);
    }
    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`);
    }
    return presigned.objectKey;
  },
};
