import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpResource, SignUpResponse } from './sign-up-response';

const signUpApiEndpointUrl = `${environment.apiBases.identity}/authentication/sign-up`;

export class SignUpApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(
    private readonly http: HttpClient,
    private readonly assembler: SignUpAssembler,
  ) {
    super();
  }

  signUp(command: SignUpCommand): Observable<SignUpResource> {
    const body = this.assembler.toRequestFromCommand(command);
    return this.http.post<SignUpResponse>(signUpApiEndpointUrl, body).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-up')),
    );
  }
}
