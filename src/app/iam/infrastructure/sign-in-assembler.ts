import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';
import { SignInResource, SignInResponse } from './sign-in-response';

/**
 * Infrastructure mapper for IAM sign-in commands and API contracts.
 */
export class SignInAssembler {
  toResourceFromResponse(response: SignInResponse): SignInResource {
    return {
      id: response.id,
      username: response.username,
      token: response.token,
      role: response.role,
    };
  }

  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      username: command.username,
      password: command.password,
    };
  }
}
