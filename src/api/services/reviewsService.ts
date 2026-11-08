/** `review/controller/ReviewController` — POST /api/reviews */
import { http } from '../client';
import type { CreateReviewRequest, ReviewResponse } from '../types';

export const reviewsService = {
  /** Review the other party of a booking; `reportMessage` also files an admin report. */
  create: (req: CreateReviewRequest) => http.post<ReviewResponse>('/api/reviews', req),
};
