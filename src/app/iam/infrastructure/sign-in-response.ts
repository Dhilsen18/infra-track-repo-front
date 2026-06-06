import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Infrastructure response envelope for IAM sign-in.
 */
export interface SignInResponse {
  id: number;
  username: string;
  token: string;
  role?: string;
}

/**
 * Infrastructure resource contract returned by IAM sign-in operations.
 */
export interface SignInResource extends BaseResource {
  username: string;
  token: string;
  role?: string;
}
