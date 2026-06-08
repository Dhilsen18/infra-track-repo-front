/**
 * HTTP write policy for the Spring Boot backend (JWT + PUT/POST).
 */
export const INFRATRACK_HTTP_POLICY = {
  allowPutDelete: true,
  allowPost: true,
} as const;

export function infratrackPutDeleteAllowed(): boolean {
  return INFRATRACK_HTTP_POLICY.allowPutDelete;
}

export function infratrackPostAllowed(): boolean {
  return INFRATRACK_HTTP_POLICY.allowPost;
}
