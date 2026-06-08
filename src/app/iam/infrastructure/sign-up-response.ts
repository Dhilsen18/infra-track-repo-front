import { BaseResource } from '../../shared/infrastructure/base-response';

export interface SignUpResponse {
  id: number;
  username: string;
  roles: string[];
}

export interface SignUpResource extends BaseResource {
  username: string;
  roles: string[];
}
