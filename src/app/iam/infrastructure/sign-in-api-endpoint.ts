import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInAssembler } from './sign-in-assembler';
import { SignInResource, SignInResponse } from './sign-in-response';

const signInApiEndpointUrl = `${environment.apiBases.identity}${environment.iamSignInEndpointPath}`;

/**
 * Infrastructure endpoint adapter for IAM sign-in HTTP operations.
 */
export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(
    private readonly http: HttpClient,
    private readonly assembler: SignInAssembler,
  ) {
    super();
  }

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    const signInRequest = this.assembler.toRequestFromCommand(signInCommand);
    return this.http.post<SignInResponse>(signInApiEndpointUrl, signInRequest).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-in')),
    );
  }
}
